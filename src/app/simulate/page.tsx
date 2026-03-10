"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Shimmer } from "@/components/Shimmer";
import { SimulationControls, DEFAULT_SETTINGS, type SimulationSettings } from "@/components/SimulationControls";
import { posthog } from "@/lib/posthog";
import { ALL_SIMULATIONS } from "@/simulations/registry";
import type { Simulation } from "@/simulations/types";
import { playSound, setSoundEnabled } from "@/lib/sounds";
import { viralizeUrls } from "@/lib/viral";
import dynamic from "next/dynamic";
import Link from "next/link";

const Paywall = dynamic(() => import("@/components/Paywall"), { ssr: false });

// Build lookup maps from the simulation registry
const TOOL_MAP = new Map<string, Simulation>(
  ALL_SIMULATIONS.map((s) => [s.schema.toolName, s])
);

interface ProfileHistorySession {
  id: string;
  personName: string;
  finalPul: number | null;
  createdAt: string;
  isProtected?: boolean;
  canContinue?: boolean;
}

interface StoredSessionMessage {
  role: string;
  parts?: Array<{
    type?: string;
    text?: string;
    toolName?: string;
    input?: Record<string, unknown>;
    toolInvocation?: {
      toolName: string;
      args?: Record<string, unknown>;
      input?: Record<string, unknown>;
    };
  }>;
}

interface StoredSessionData {
  id: string;
  personName: string;
  profileData?: Record<string, unknown>;
  messages: StoredSessionMessage[];
}

interface MemberContext {
  unlocked: boolean;
  memberId?: string | null;
  email?: string | null;
  name?: string | null;
  source?: string | null;
}

function normalizeProfileLookup(url: string, handle: string): string {
  const cleanUrl = (url || "").trim();
  const cleanHandle = (handle || "").trim();

  const linkedInMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?#\s]+)/i);
  if (linkedInMatch?.[1]) {
    return `https://www.linkedin.com/in/${linkedInMatch[1].replace(/^@/, "").toLowerCase()}`;
  }

  const xMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#\s]+)/i);
  if (xMatch?.[1]) {
    return `https://x.com/${xMatch[1].replace(/^@/, "").toLowerCase()}`;
  }

  if (/^@?[a-zA-Z0-9_]+$/.test(cleanHandle)) {
    return `https://x.com/${cleanHandle.replace(/^@/, "").toLowerCase()}`;
  }

  return "";
}

function getSessionTextPart(message: StoredSessionMessage): string {
  const textPart = (message.parts || []).find((part) => part.type === "text" && typeof part.text === "string");
  return textPart?.text || "";
}

function buildResumeSnapshot(messages: StoredSessionMessage[]): string {
  const lines: string[] = [];
  const recent = messages.slice(-18);

  for (const msg of recent) {
    if (msg.role === "user") {
      const text = getSessionTextPart(msg);
      const choiceMatch = text.match(/I chose:\s*"([^"]+)"/i);
      const steerMatch = text.match(/USER DIRECTION:\s*(.+?)(?:\n|$)/i);
      if (choiceMatch?.[1]) lines.push(`- User choice: ${choiceMatch[1]}`);
      else if (steerMatch?.[1]) lines.push(`- User direction: ${steerMatch[1].trim()}`);
      continue;
    }

    if (msg.role !== "assistant") continue;
    for (const part of msg.parts || []) {
      const toolName =
        part.toolName ||
        (typeof part.type === "string" && part.type.startsWith("tool-") ? part.type.slice(5) : "") ||
        part.toolInvocation?.toolName ||
        "";
      const toolInput = part.input || part.toolInvocation?.args || part.toolInvocation?.input || {};

      if (toolName === "showChapter") {
        const title = typeof toolInput.title === "string" ? toolInput.title : "";
        if (title) lines.push(`- Chapter: ${title}`);
      } else if (toolName === "showPULUpdate") {
        const score = toolInput.score;
        if (typeof score === "number") lines.push(`- Risk index now: ${score}%`);
      } else if (toolName === "showChoice") {
        const optionA = typeof toolInput.optionA === "string" ? toolInput.optionA : "";
        const optionB = typeof toolInput.optionB === "string" ? toolInput.optionB : "";
        if (optionA || optionB) lines.push(`- Last options: ${optionA}${optionA && optionB ? " / " : ""}${optionB}`);
      } else if (toolName === "showGameOver") {
        lines.push("- Session ended with game over.");
      } else if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
        lines.push(`- Narrative: ${part.text.trim().slice(0, 120)}`);
      }
    }
  }

  return lines.slice(-10).join("\n");
}

function SimulationContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const handle = searchParams.get("handle") || "";
  const resumeSessionId = searchParams.get("resumeSession") || "";
  const normalizedInputProfile = normalizeProfileLookup(url, handle);
  const [isResearching, setIsResearching] = useState(true);
  const [researchStatus, setResearchStatus] = useState("Researching...");
  const [choiceDisabled, setChoiceDisabled] = useState(false);
  const [personName, setPersonName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [gameOverShareUrl, setGameOverShareUrl] = useState<string | null>(null);
  const [gameOverSessionId, setGameOverSessionId] = useState<string | null>(null);
  const [showFinalUpgradePrompt, setShowFinalUpgradePrompt] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  const gameOverSavedRef = useRef(false);
  const finalUpsellPromptedRef = useRef(false);
  const [candidates, setCandidates] = useState<Array<{
    name: string; headline: string; location: string; profileImageUrl: string; linkedinUrl: string;
  }> | null>(null);
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [appliedNotes, setAppliedNotes] = useState<string[]>([]);
  const [steeringNotes, setSteeringNotes] = useState<Array<{ text: string; id: number }>>([]);
  const [selectedChoices, setSelectedChoices] = useState<Map<string, string>>(new Map());
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [unlockKey, setUnlockKey] = useState("");
  const [memberContext, setMemberContext] = useState<MemberContext>({ unlocked: false });
  const [hasMemberAccess, setHasMemberAccess] = useState(false);
  const [hideFromPublicListing, setHideFromPublicListing] = useState(false);
  const [useBasicModel, setUseBasicModel] = useState(false);
  const [historySessions, setHistorySessions] = useState<ProfileHistorySession[]>([]);
  const [historyState, setHistoryState] = useState<"idle" | "checking" | "prompt" | "ready">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const hasTriedResumeRef = useRef(false);
  const profileRef = useRef("");

  const transportRef = useRef(
    new DefaultChatTransport({ api: "/api/simulate" })
  );

  const { messages, sendMessage, status, error } = useChat({
    transport: transportRef.current,
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const sessionIsPublic = !hasMemberAccess || !hideFromPublicListing;

  // Sync model choice to transport body
  useEffect(() => {
    const mutableTransport = transportRef.current as unknown as { body?: { model: string } };
    if (useBasicModel) {
      mutableTransport.body = { model: "basic" };
    } else {
      mutableTransport.body = undefined;
    }
  }, [useBasicModel]);

  // Hydrate local unlock key + existing access state
  useEffect(() => {
    let localUnlockKey = localStorage.getItem("replaceproof_unlock_key") || "";
    if (!localUnlockKey) {
      localUnlockKey = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `rp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("replaceproof_unlock_key", localUnlockKey);
    }
    setUnlockKey(localUnlockKey);

    const paid = localStorage.getItem("replaceproof_paid");
    const memberAccess = localStorage.getItem("replaceproof_member_access");
    const hidePublicPref = localStorage.getItem("replaceproof_hide_public_listing");
    if (hidePublicPref === "true") setHideFromPublicListing(true);
    if (memberAccess === "true") setHasMemberAccess(true);
    const storedMemberName = localStorage.getItem("replaceproof_member_name") || "";
    const storedMemberEmail = localStorage.getItem("replaceproof_member_email") || "";
    if (storedMemberName) setLeadName(storedMemberName);
    if (storedMemberEmail) setLeadEmail(storedMemberEmail);
    const urlPaid = searchParams.get("paid");
    if (paid || urlPaid === "true" || memberAccess === "true") {
      setHasPaid(true);
    }

    const statusUrl = `/api/member/status?unlockKey=${encodeURIComponent(localUnlockKey)}`;
    fetch(statusUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.unlocked) {
          setMemberContext({
            unlocked: true,
            memberId: data?.member?.memberId || null,
            email: data?.member?.email || null,
            name: data?.member?.name || null,
            source: data?.source || null,
          });
          setHasMemberAccess(true);
          setHasPaid(true);
          localStorage.setItem("replaceproof_member_access", "true");
          localStorage.setItem("replaceproof_paid", Date.now().toString());
        } else {
          setMemberContext({ unlocked: false });
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (!leadName && personName) {
      setLeadName(personName);
    }
  }, [personName, leadName]);

  // While paywall is open, poll for server-side unlocks (member webhook/login flows)
  useEffect(() => {
    if (!showPaywall || hasPaid) return;

    const pollStatus = () => {
      const statusUrl = unlockKey
        ? `/api/member/status?unlockKey=${encodeURIComponent(unlockKey)}`
        : "/api/member/status";

      fetch(statusUrl, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (data?.unlocked) {
            setMemberContext({
              unlocked: true,
              memberId: data?.member?.memberId || null,
              email: data?.member?.email || null,
              name: data?.member?.name || null,
              source: data?.source || null,
            });
            setHasMemberAccess(true);
            setHasPaid(true);
            setShowPaywall(false);
            localStorage.setItem("replaceproof_member_access", "true");
            localStorage.setItem("replaceproof_paid", Date.now().toString());
          }
        })
        .catch(() => {});
    };

    pollStatus();
    const timer = setInterval(pollStatus, 5000);
    return () => clearInterval(timer);
  }, [showPaywall, hasPaid, unlockKey]);

  useEffect(() => {
    if (!hasMemberAccess) return;
    localStorage.setItem("replaceproof_hide_public_listing", hideFromPublicListing ? "true" : "false");
  }, [hasMemberAccess, hideFromPublicListing]);

  // Stall detector: if streaming for 45s+ with no new content, retry
  const lastMessageCountRef = useRef(0);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Clear any existing timer
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);

    if (isStreaming) {
      const currentCount = messages.length;
      // Count total parts across all messages
      let totalParts = 0;
      messages.forEach((m) => { totalParts += (m.parts || []).length; });

      stallTimerRef.current = setTimeout(() => {
        // Check if we got new content since timer started
        let newParts = 0;
        messages.forEach((m) => { newParts += (m.parts || []).length; });
        if (newParts === totalParts && (status === "streaming" || status === "submitted")) {
          console.log("[stall-detector] Stalled for 45s, retrying...");
          // Force a continue message
          sendMessage({
            text: `Continue the simulation from where you left off. Keep the narrative going.${profileRef.current ? `\n\nPROFILE DATA:\n${profileRef.current}` : ""}`,
          });
        }
      }, 45000);
    }

    return () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, [isStreaming, messages, status, sendMessage]);

  // Error recovery: if the chat errors out, show retry
  const [showRetry, setShowRetry] = useState(false);
  useEffect(() => {
    if (error) {
      console.error("[chat-error]", error);
      setShowRetry(true);
    }
  }, [error]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Ref for sendMessage to avoid dependency issues
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // Start simulation with a researched profile
  const startSimulation = useCallback((data: { name?: string; profileImageUrl?: string }) => {
    setPersonName(data.name || "");
    setProfileImage((data as Record<string, string>).profileImageUrl || "");
    setCandidates(null);

    if (posthog.__loaded) {
      posthog.capture("simulation_started", {
        person_name: data.name,
        linkedin_url: url || undefined,
        handle: handle || undefined,
      });
    }
    const profileStr = JSON.stringify(data, null, 2);
    profileRef.current = profileStr;

    setIsResearching(true);
    setResearchStatus("Building your ReplaceProof simulation...");
    setTimeout(() => {
      setIsResearching(false);
      sendMessageRef.current({
        text: `Start my ReplaceProof student simulation. Begin with AI displacement risk signals for my current trajectory, then show realistic pivot paths and actionable weekly moves. Use a variety of simulation types — tweets, iMessages, Slack, LinkedIn, news alerts, AI conversations.\n\nPROFILE DATA:\n${profileStr}`,
      });
    }, 600);
  }, [url, handle]);

  // Pick a candidate from disambiguation
  const handlePickCandidate = useCallback(async (candidate: { name: string; linkedinUrl: string }) => {
    setCandidates(null);
    setIsResearching(true);
    setResearchStatus(`Researching ${candidate.name}...`);

    try {
      const targetUrl = candidate.linkedinUrl || url;
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      startSimulation(data);
    } catch {
      setResearchStatus("Research failed. Try again.");
    }
  }, [url, startSimulation]);

  // Check if this exact profile already has saved sessions
  useEffect(() => {
    if (resumeSessionId) return;
    if (!url && !handle) return;

    hasStartedRef.current = false;
    setHistorySessions([]);

    if (!normalizedInputProfile) {
      setHistoryState("ready");
      return;
    }

    setHistoryState("checking");
    setResearchStatus("Checking previous sessions...");

    const unlockParam = unlockKey ? `&unlockKey=${encodeURIComponent(unlockKey)}` : "";
    fetch(`/api/sessions?profile=${encodeURIComponent(normalizedInputProfile)}&limit=5${unlockParam}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const matches = (data?.sessions || []) as ProfileHistorySession[];
        if (matches.length > 0) {
          setHistorySessions(matches);
          setHistoryState("prompt");
          setIsResearching(false);
        } else {
          setHistoryState("ready");
        }
      })
      .catch(() => {
        setHistoryState("ready");
      });
  }, [url, handle, normalizedInputProfile, unlockKey, resumeSessionId]);

  const handleStartNewSimulation = useCallback(() => {
    hasStartedRef.current = false;
    setIsResearching(true);
    setResearchStatus("Looking up profile...");
    setHistoryState("ready");
  }, []);

  const handleContinueSession = useCallback(async (sessionId: string) => {
    hasStartedRef.current = true;
    setIsResearching(true);
    setResearchStatus("Loading previous session...");
    try {
      const unlockParam = unlockKey ? `&unlockKey=${encodeURIComponent(unlockKey)}` : "";
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}&intent=continue${unlockParam}`, {
        cache: "no-store",
      });
      if (res.status === 403) {
        hasStartedRef.current = false;
        setIsResearching(false);
        setShowPaywall(true);
        return;
      }
      if (!res.ok) {
        hasStartedRef.current = false;
        setResearchStatus("Could not load that session.");
        setIsResearching(false);
        return;
      }

      const saved = (await res.json()) as StoredSessionData;
      const profileData = (saved.profileData || {}) as Record<string, unknown>;
      const profileName =
        (typeof profileData.name === "string" && profileData.name) ||
        saved.personName ||
        "";
      const imageUrl =
        (typeof profileData.profileImageUrl === "string" && profileData.profileImageUrl) ||
        "";

      setPersonName(profileName);
      setProfileImage(imageUrl);
      setCandidates(null);
      setHistoryState("ready");

      const profileStr = JSON.stringify(profileData, null, 2);
      profileRef.current = profileStr;

      const snapshot = buildResumeSnapshot(saved.messages || []);
      setTimeout(() => {
        setIsResearching(false);
        sendMessageRef.current({
          text:
            `Continue this existing ReplaceProof simulation from the current timeline. Respect all prior events as canonical history and continue with realistic consequences and next actions.\n\n` +
            `RESUME SESSION ID: ${saved.id}\n` +
            `LAST KNOWN SESSION STATE:\n${snapshot || "- Prior context available but summary is limited."}\n\n` +
            `PROFILE DATA:\n${profileStr}`,
        });
      }, 350);
    } catch {
      hasStartedRef.current = false;
      setResearchStatus("Could not continue this session.");
      setIsResearching(false);
    }
  }, [unlockKey]);

  // Direct resume flow from shared/session links.
  useEffect(() => {
    if (!resumeSessionId || hasTriedResumeRef.current) return;
    if (!unlockKey) return;
    hasTriedResumeRef.current = true;
    handleContinueSession(resumeSessionId);
  }, [resumeSessionId, unlockKey, handleContinueSession]);

  // Research the person and start simulation
  useEffect(() => {
    if (resumeSessionId) return;
    if ((!url && !handle) || hasStartedRef.current || historyState !== "ready") return;
    hasStartedRef.current = true;

    const loadingMessages = [
      "Looking up profile...",
      "Analyzing role exposure to AI...",
      "Checking market shifts in your field...",
      "Mapping transferable skills...",
      "Estimating displacement timeline...",
      "Finding adjacent AI-resistant roles...",
      "Building your 90-day transition path...",
      "Calibrating ReplaceProof risk index...",
      "Preparing your simulation...",
      "Finalizing your first scenario...",
    ];

    const research = async () => {
      try {
        setResearchStatus(handle ? `Searching for ${handle}...` : loadingMessages[0]);

        // Cycle through loading messages
        let msgIdx = 1;
        const msgInterval = setInterval(() => {
          setResearchStatus(loadingMessages[msgIdx % loadingMessages.length]);
          msgIdx++;
        }, 2500);

        // Direct LinkedIn URL or X/Twitter URL → skip disambiguation, go straight to research
        const hasDirectUrl = url && url.includes("linkedin.com/in/");
        const h = handle || url || "";
        const looksLikeUsername = !h.includes(" ") && !h.includes("-") && h.length > 3 && /^[a-zA-Z0-9_]+$/.test(h);
        const isXHandle = h.match(/(?:x\.com|twitter\.com)\//) || h.startsWith("@") || looksLikeUsername;

        // Only run disambiguation for plain name searches (no direct URLs or X handles)
        if (!hasDirectUrl && !isXHandle) {
          const candidateBody = handle
            ? { handle, candidates: true }
            : { url, candidates: true };
          const candidateRes = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateBody),
          });
          const candidateData = await candidateRes.json();
          const foundCandidates = candidateData.candidates || [];

          if (foundCandidates.length > 1) {
            const uniqueNames = new Set(foundCandidates.map((c: { name: string }) => c.name.toLowerCase()));
            if (uniqueNames.size > 1) {
              clearInterval(msgInterval);
              setIsResearching(false);
              setCandidates(foundCandidates);
              return; // Wait for user to pick
            }
          }
        }

        // Research the person
        const body = hasDirectUrl ? { url } : (handle ? { handle } : { url });
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        clearInterval(msgInterval);
        startSimulation(data);
      } catch {
        setResearchStatus("Could not research this profile. Try another URL.");
      }
    };

    research();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, handle, historyState, resumeSessionId]);

  const handleShare = useCallback(async () => {
    if (isSaving || shareUrl) return;
    setIsSaving(true);
    try {
      // Extract latest risk score from messages
      let lastPul: number | undefined;
      for (const msg of [...messages].reverse()) {
        if (msg.role !== "assistant") continue;
        for (const part of [...(msg.parts || [])].reverse()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = part as any;
          if (p.type?.startsWith?.("tool-showPULUpdate") || p.toolName === "showPULUpdate") {
            lastPul = p.input?.score;
            break;
          }
        }
        if (lastPul !== undefined) break;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: url || normalizedInputProfile,
          personName,
          profileData: profileRef.current ? JSON.parse(profileRef.current) : {},
          messages: messages.map((m) => ({ role: m.role, parts: m.parts })),
          finalPul: lastPul,
          isPublic: sessionIsPublic,
          memberEmail: memberContext.unlocked ? memberContext.email || undefined : undefined,
          memberId: memberContext.unlocked ? memberContext.memberId || undefined : undefined,
          accessSource: memberContext.unlocked ? memberContext.source || "external_auth" : undefined,
        }),
      });

      if (res.ok) {
        const { shareUrl: newUrl } = await res.json();
        setShareUrl(newUrl);
        // Copy to clipboard
        await navigator.clipboard.writeText(newUrl).catch(() => {});
      }
    } catch (e) {
      console.error("Share error:", e);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, shareUrl, messages, url, normalizedInputProfile, personName, memberContext, sessionIsPublic]);

  const handleSettings = useCallback((newSettings: SimulationSettings) => {
    setSettings(newSettings);
    setSoundEnabled(newSettings.soundEnabled);
  }, []);

  const handleSteer = useCallback((note: string) => {
    // Add to visible timeline
    setSteeringNotes((prev) => [...prev, { text: note, id: Date.now() }]);
    // Set as active steering for next generation
    setSettings((prev) => ({ ...prev, userNotes: "" }));
    setAppliedNotes((prev) => [...prev, note]);

    // If not currently streaming, send a steering message immediately
    if (status === "ready" && messages.length > 0) {
      sendMessageRef.current({
        text: `USER DIRECTION: ${note}\n\nContinue the simulation incorporating this direction. Keep the narrative going.\n\nPROFILE DATA:\n${profileRef.current}`,
      });
    }
  }, [status, messages.length]);

  const handleFinalUpgradeAction = useCallback(async (intent: "upgrade" | "login" | "skip") => {
    if (intent === "skip") {
      setShowFinalUpgradePrompt(false);
      return;
    }

    const trimmedName = leadName.trim();
    const trimmedEmail = leadEmail.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setLeadError("Please enter your name and email to continue.");
      return;
    }

    if (!gameOverSessionId) {
      setLeadError("Your session is still finishing. Please try again in a moment.");
      return;
    }

    setLeadSubmitting(true);
    setLeadError("");
    try {
      const captureRes = await fetch("/api/member/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: gameOverSessionId,
          name: trimmedName,
          email: trimmedEmail,
          intent,
        }),
      });

      const captureData = await captureRes.json().catch(() => ({}));
      if (!captureRes.ok) {
        setLeadError(captureData.error || "Unable to save your details right now.");
        return;
      }

      setLeadSaved(true);
      localStorage.setItem("replaceproof_member_name", trimmedName);
      localStorage.setItem("replaceproof_member_email", trimmedEmail);

      if (intent === "upgrade") {
        const params = new URLSearchParams({
          utm_source: "underclass",
          utm_medium: "game_over_upgrade",
          utm_campaign: "full_transition_roadmap",
          name: trimmedName,
          email: trimmedEmail,
          session_id: gameOverSessionId,
        });
        if (unlockKey) params.set("unlock_key", unlockKey);
        window.open(`https://replaceproof.com?${params.toString()}`, "_blank", "noopener,noreferrer");
      }

      if (intent === "login") {
        setShowPaywall(true);
      }

      setShowFinalUpgradePrompt(false);
    } catch {
      setLeadError("Unable to save your details right now.");
    } finally {
      setLeadSubmitting(false);
    }
  }, [gameOverSessionId, leadEmail, leadName, unlockKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getToolInfo = useCallback((part: any): { toolName: string; args: any } | null => {
    if (part.state === "input-streaming") return null;

    if (part.type === "dynamic-tool" && part.toolName) {
      return { toolName: part.toolName, args: part.input || {} };
    }
    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      const toolName = part.type.slice(5);
      return { toolName, args: part.input || {} };
    }
    if (part.type === "tool-invocation" && part.toolInvocation) {
      return { toolName: part.toolInvocation.toolName, args: part.toolInvocation.args || part.toolInvocation.input || {} };
    }
    return null;
  }, []);

  // Helper: count chapters in current messages
  const countChapters = useCallback(() => {
    let count = 0;
    messages.forEach((m) => {
      if (m.role !== "assistant") return;
      (m.parts || []).forEach((p) => {
        const info = getToolInfo(p);
        if (info?.toolName === "showChapter") count++;
      });
    });
    return count;
  }, [messages, getToolInfo]);

  useEffect(() => {
    if (hasPaid || finalUpsellPromptedRef.current) return;

    let hasGameOver = false;
    messages.forEach((message) => {
      if (message.role !== "assistant") return;
      (message.parts || []).forEach((part) => {
        const info = getToolInfo(part);
        if (info?.toolName === "showGameOver") hasGameOver = true;
      });
    });

    if (hasGameOver) {
      finalUpsellPromptedRef.current = true;
      setShowFinalUpgradePrompt(true);
    }
  }, [messages, hasPaid, getToolInfo]);

  const handleChoice = useCallback(
    (choice: string) => {
      if (choiceDisabled) return;
      if (status !== "ready") return;

      // Paywall check
      if (!hasPaid) {
        const chapters = countChapters();
        if (chapters >= 1) {
          setShowPaywall(true);
          return;
        }
      }

      setChoiceDisabled(true);
      const notes = settings.userNotes ? `\n\nUSER DIRECTION: ${settings.userNotes}` : "";
      if (settings.userNotes) {
        setAppliedNotes((prev) => [...prev, settings.userNotes]);
      }
      // Track choice
      if (posthog.__loaded) {
        posthog.capture("choice_made", { choice, person_name: personName });
      }

      const chapterCount = countChapters();
      const endHint = chapterCount >= 9 ? "\n\nIMPORTANT: This is chapter ~" + (chapterCount + 1) + "+. END the game with showGameOver after 1-2 more chapters." : "";
      sendMessage({
        text: `I chose: "${choice}". Continue the simulation from where we left off — advance the timeline, show consequences of this choice, then present another choice after 2-3 chapters. Use varied simulation types!${endHint}${notes}\n\nPROFILE DATA:\n${profileRef.current}`,
      });
      setTimeout(() => setChoiceDisabled(false), 5000);

      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 300);
    },
    [sendMessage, settings.userNotes, status, choiceDisabled, hasPaid, countChapters, personName]
  );

  // Auto-continue: when streaming finishes, either auto-pick a choice or continue
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    const nowReady = status === "ready";
    prevStatusRef.current = status;

    if (!wasStreaming || !nowReady || isResearching) return;

    // Find the last tool in the last assistant message
    const lastMsg = messages[messages.length - 1];
    let lastToolName: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastToolArgs: any = null;
    if (lastMsg?.role === "assistant") {
      const parts = lastMsg.parts || [];
      for (let i = parts.length - 1; i >= 0; i--) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = parts[i] as any;
        const tn = p.toolName || (typeof p.type === "string" && p.type.startsWith("tool-") ? p.type.slice(5) : null);
        if (tn) {
          lastToolName = tn;
          lastToolArgs = p.input || {};
          break;
        }
      }
    }

    if (lastToolName === "showChoice") {
      // Check paywall before allowing choice
      if (!hasPaid && countChapters() >= 1) {
        setShowPaywall(true);
        return;
      }
      // Wait for user to pick — don't auto-continue
      return;
    }

    if (lastToolName === "showGameOver") {
      // Game is over — don't continue
      return;
    }

    // Paywall check on auto-continue too
    if (!hasPaid && countChapters() >= 1) {
      setShowPaywall(true);
      return;
    }

    // No choice at end — auto-continue after a short pause
    const timer = setTimeout(() => {
      const notes = settings.userNotes ? `\n\nUSER DIRECTION: ${settings.userNotes}` : "";
      sendMessage({
        text: `Continue the simulation — advance the timeline, show concrete consequences, and keep updating the ReplaceProof Risk Index. End with another practical choice.${notes}\n\nPROFILE DATA:\n${profileRef.current}`,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, messages, isResearching, sendMessage, settings.userNotes, handleChoice, hasPaid, countChapters]);

  // Track which tools have already played sounds
  const playedSoundsRef = useRef(new Set<string>());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTool = useCallback((toolName: string, args: any, key: string) => {
    const sim = TOOL_MAP.get(toolName);
    if (!sim) return null;

    // Play sound once per tool invocation
    if (!playedSoundsRef.current.has(key)) {
      playedSoundsRef.current.add(key);
      playSound(toolName);
    }

    const safeArgs = { ...(args || {}) };
    const Component = sim.component;

    // Viralize URLs in text-heavy fields
    const textFields = ["content", "message", "headline", "narrative", "subject", "preview"];
    for (const field of textFields) {
      if (typeof safeArgs[field] === "string") {
        safeArgs[field] = viralizeUrls(safeArgs[field]);
      }
    }

    // Inject onChoice + disabled + selected for the choice component
    const extraProps = toolName === "showChoice"
      ? {
          onChoice: (choice: string) => {
            setSelectedChoices((prev) => new Map(prev).set(key, choice));
            handleChoice(choice);
          },
          disabled: choiceDisabled,
          selected: selectedChoices.get(key),
        }
      : {};

    // Inject personName fallback
    if (toolName === "showChapter" && !safeArgs.personName) {
      safeArgs.personName = personName;
    }
    if (toolName === "showGameOver") {
      if (!safeArgs.personName) safeArgs.personName = personName;
      safeArgs.sessionShareUrl = gameOverShareUrl || undefined;

      // Track game over + auto-save session
      if (!gameOverSavedRef.current) {
        gameOverSavedRef.current = true;
        if (posthog.__loaded) {
          posthog.capture("game_over", {
            person_name: personName,
            final_pul: safeArgs.finalPul,
            outcome: safeArgs.outcome,
          });
        }
        // Auto-save session in background
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkedinUrl: url || normalizedInputProfile,
            personName,
            profileData: profileRef.current ? JSON.parse(profileRef.current) : {},
            messages: messages.map((m) => ({ role: m.role, parts: m.parts })),
            finalPul: safeArgs.finalPul,
            isPublic: sessionIsPublic,
            memberEmail: memberContext.unlocked ? memberContext.email || undefined : undefined,
            memberId: memberContext.unlocked ? memberContext.memberId || undefined : undefined,
            accessSource: memberContext.unlocked ? memberContext.source || "external_auth" : undefined,
          }),
        })
          .then((r) => r.json())
          .then(({ shareUrl: savedUrl, id: savedId }) => {
            if (savedId) setGameOverSessionId(savedId);
            if (savedUrl) setGameOverShareUrl(savedUrl);
          })
          .catch(() => {});
      }
    }

    const layoutClass =
      sim.layout === "inline-right" ? "flex justify-end mb-4" :
      sim.layout === "inline-left" ? "mb-2" :
      sim.layout === "inline-center" ? "" :
      sim.layout === "fullscreen" ? "w-full mb-6" :
      "mb-4";

    return (
      <ErrorBoundary key={key}>
        <div className={layoutClass}>
          <Component {...safeArgs} {...extraProps} />
        </div>
      </ErrorBoundary>
    );
  }, [handleChoice, choiceDisabled, personName, selectedChoices, gameOverShareUrl, messages, url, normalizedInputProfile, memberContext, sessionIsPublic]);

  // Extract tool name from part type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <main className="relative min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.jpg)" }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      <div ref={scrollRef} className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <AnimatePresence>
            {isResearching && (
              <motion.div
                className="flex flex-col items-center justify-center min-h-[80vh] gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                {/* Status text */}
                <div className="text-center">
                  <Shimmer as="p" className="text-lg font-medium mb-3" duration={2.5}>
                    {researchStatus}
                  </Shimmer>
                  <p className="text-white/20 text-sm max-w-xs mx-auto leading-relaxed">
                    Assessing AI risk and mapping your 90-day transition roadmap
                  </p>
                </div>

                {/* Animated skeleton cards */}
                <div className="w-full max-w-md space-y-3 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="rounded-xl overflow-hidden"
                      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.4, duration: 0.5 }}
                    >
                      <div className={`h-16 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 ${i % 2 === 0 ? "ml-0 mr-auto max-w-[85%]" : "ml-auto mr-0 max-w-[70%]"}`}>
                        <motion.div
                          className="h-2.5 rounded-full bg-white/[0.06] mb-2"
                          style={{ width: `${60 + i * 15}%` }}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                        <motion.div
                          className="h-2 rounded-full bg-white/[0.04]"
                          style={{ width: `${40 + i * 10}%` }}
                          animate={{ opacity: [0.2, 0.4, 0.2] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.3 }}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {/* Skeleton risk index bar */}
                  <motion.div
                    className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <motion.div
                        className="h-2 w-32 rounded-full bg-white/[0.06]"
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="h-5 w-10 rounded bg-white/[0.06]"
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-cyan-400/10"
                        animate={{ width: ["0%", "45%", "30%", "50%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {historyState === "prompt" && historySessions.length > 0 && (
            <motion.div
              className="flex flex-col items-center pt-12 pb-20 gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-1">
                <h2 className="text-xl font-semibold text-white/80 mb-1">Recent sessions found</h2>
                <p className="text-sm text-white/35">Review a previous run or start a new simulation.</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md max-h-[55vh] overflow-y-auto pr-1">
                {historySessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/85 truncate">{session.personName || "Saved session"}</p>
                        <p className="text-[11px] text-white/30">
                          {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-white/40">Risk</p>
                        <p className="text-sm font-mono text-white/70">
                          {session.finalPul === null ? "--" : `${session.finalPul}%`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`/s/${session.id}`}
                        className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white/65 hover:text-white hover:bg-white/10 transition-all"
                      >
                        View
                      </a>
                      {session.canContinue ? (
                        <button
                          onClick={() => handleContinueSession(session.id)}
                          className="px-3 py-1.5 rounded-lg border border-cyan-400/25 text-xs text-cyan-300 hover:bg-cyan-400/10 transition-all cursor-pointer"
                        >
                          Continue
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/35">
                          {session.isProtected ? "Member key required to continue" : "View only"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleStartNewSimulation}
                className="px-6 py-2.5 rounded-full bg-white/10 border border-white/15 text-sm text-white/70 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
              >
                Start new simulation
              </button>
            </motion.div>
          )}

          {/* Candidate disambiguation */}
          {candidates && candidates.length > 0 && (
            <motion.div
              className="flex flex-col items-center pt-12 pb-20 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-white/80 mb-1">Which one is you?</h2>
                <p className="text-sm text-white/30">We found {candidates.length} matches</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md max-h-[60vh] overflow-y-auto pr-1">
                {candidates.map((c, i) => (
                  <motion.button
                    key={c.linkedinUrl || i}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 transition-all cursor-pointer text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handlePickCandidate(c)}
                  >
                    {c.profileImageUrl ? (
                      <img
                        src={c.profileImageUrl}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-white/40 font-bold shrink-0">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{c.name}</p>
                      <p className="text-xs text-white/30 truncate">{c.headline}</p>
                      {c.location && <p className="text-[11px] text-white/20 mt-0.5">{c.location}</p>}
                    </div>
                  </motion.button>
                ))}
              </div>
              <Link
                href="/"
                className="text-xs text-white/20 hover:text-white/40 transition-colors mt-4"
              >
                ← Try a different search
              </Link>
            </motion.div>
          )}

          {!isResearching && !candidates && historyState !== "prompt" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Profile header */}
              {personName && (
                <motion.div
                  className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={personName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-white/40 text-sm font-bold">
                      {personName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white/70">{personName}</p>
                    <p className="text-[11px] text-white/30">ReplaceProof student simulation</p>
                  </div>
                </motion.div>
              )}

              {(() => {
                const elements: React.ReactNode[] = [];
                let lastChoiceIndex = -1;
                let globalIndex = 0;

                // Count choices (no longer hiding old ones)
                messages.forEach((message) => {
                  if (message.role !== "assistant") return;
                  (message.parts || []).forEach((part) => {
                    const toolInfo = getToolInfo(part);
                    if (toolInfo?.toolName === "showChoice") {
                      lastChoiceIndex = globalIndex;
                    }
                    globalIndex++;
                  });
                });

                // Second pass: render everything
                let idx = 0;
                messages.forEach((message, messageIndex) => {
                  // Render user steering notes in the timeline
                  if (message.role === "user" && messageIndex > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const text = (message as any).content || (message.parts || []).map((p: any) => p.text || "").join("");
                    const dirMatch = typeof text === "string" ? text.match(/USER DIRECTION: (.+?)(\n|$)/) : null;
                    if (dirMatch) {
                      elements.push(
                        <motion.div
                          key={`note-${messageIndex}`}
                          className="flex items-center gap-2 my-3 mx-auto max-w-md"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <div className="flex-1 h-px bg-white/5" />
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                            <span className="text-[10px] text-white/25">🎯</span>
                            <span className="text-[11px] text-white/30 italic">{dirMatch[1]}</span>
                          </div>
                          <div className="flex-1 h-px bg-white/5" />
                        </motion.div>
                      );
                    }
                    return;
                  }
                  if (message.role !== "assistant") return;
                  (message.parts || []).forEach((part, partIndex) => {
                    const currentIdx = idx++;
                    const toolInfo = getToolInfo(part);
                    if (toolInfo) {
                      const el = renderTool(
                        toolInfo.toolName,
                        toolInfo.args,
                        `tool-${messageIndex}-${partIndex}`
                      );
                      if (el) elements.push(el);
                      return;
                    }
                    if (part.type === "text") {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const text = (part as any).text;
                      if (!text || text.trim().length === 0) return;
                      elements.push(
                        <motion.p
                          key={`text-${messageIndex}-${partIndex}`}
                          className="text-white/70 text-base leading-relaxed mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {text}
                        </motion.p>
                      );
                    }
                  });
                });

                return <div className="space-y-2">{elements}</div>;
              })()}

              {/* Steering notes submitted by user */}
              {steeringNotes.map((note) => (
                <motion.div
                  key={note.id}
                  className="flex items-center gap-2 my-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex-1 h-px bg-cyan-400/10" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-400/15">
                    <span className="text-[10px]">🎯</span>
                    <span className="text-[11px] text-cyan-400/60 italic">{note.text}</span>
                  </div>
                  <div className="flex-1 h-px bg-cyan-400/10" />
                </motion.div>
              ))}

              {isStreaming && !showRetry && (
                <motion.div
                  className="mt-8 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Shimmer
                    as="span"
                    className="text-sm font-mono tracking-wider"
                    duration={2}
                    spread={3}
                  >
                    building your transition path...
                  </Shimmer>
                </motion.div>
              )}

              {/* Error / stall retry */}
              {showRetry && (
                <motion.div
                  className="mt-8 mb-4 flex flex-col items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-white/40 text-sm">Something stalled. The AI might need a nudge.</p>
                  <button
                    onClick={() => {
                      setShowRetry(false);
                      sendMessage({
                        text: `Continue the simulation from where you left off. Keep going.\n\nPROFILE DATA:\n${profileRef.current}`,
                      });
                    }}
                    className="px-5 py-2 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all cursor-pointer border border-white/10"
                  >
                    Continue →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
        <div className="h-32" />
      </div>

      {/* Sound toggle — top right, always visible */}
      <motion.button
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all cursor-pointer shadow-2xl"
        onClick={() => {
          const next = !soundOn;
          setSoundOn(next);
          setSoundEnabled(next);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        title={soundOn ? "Mute sounds" : "Enable sounds"}
      >
        {soundOn ? (
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </motion.button>

      {/* Floating controls */}
      {!isResearching && (
        <>
          {hasMemberAccess && (
            <motion.button
              className="fixed bottom-20 right-20 z-50 h-10 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 flex items-center gap-2 px-3 text-white/70 hover:text-white hover:bg-white/12 transition-all cursor-pointer shadow-2xl"
              onClick={() => setHideFromPublicListing((prev) => !prev)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={hideFromPublicListing ? "This session is hidden from homepage scroller" : "This session appears in homepage scroller"}
            >
              <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Homepage</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  hideFromPublicListing
                    ? "bg-red-500/15 border-red-400/35 text-red-300"
                    : "bg-emerald-500/15 border-emerald-400/35 text-emerald-300"
                }`}
              >
                {hideFromPublicListing ? "Hidden" : "Public"}
              </span>
            </motion.button>
          )}

          {/* Share button */}
          <motion.button
            className="fixed bottom-6 right-20 z-50 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center gap-2 px-4 text-white/60 hover:text-white hover:bg-white/15 transition-all cursor-pointer shadow-2xl"
            onClick={handleShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSaving}
          >
            {shareUrl ? (
              <>
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-xs text-green-400">Copied!</span>
              </>
            ) : isSaving ? (
              <span className="text-xs">Saving...</span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-xs">Share</span>
              </>
            )}
          </motion.button>

          <SimulationControls settings={settings} onSettingsChange={handleSettings} onSteer={handleSteer} />
        </>
      )}

      {/* Final upgrade prompt */}
      {showFinalUpgradePrompt && !hasPaid && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f121a] p-6 shadow-2xl"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/35 mb-2">
                90-day execution support
              </p>
              <h3 className="text-xl font-bold text-white mb-2">
                Build your Full Transition Roadmap
              </h3>
              <p className="text-sm text-white/65 mb-5 leading-relaxed">
                Upgrade into the 90-day ReplaceProof member program for full implementation support.
                {leadSaved ? " Your details are saved." : " Before continuing, confirm your details below."}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="your name"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30"
                />
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="your email"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/30"
                />
              </div>

              {leadError && (
                <p className="text-xs text-red-300 mb-3">{leadError}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleFinalUpgradeAction("upgrade")}
                  disabled={leadSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  {leadSubmitting ? "Saving..." : "Upgrade at replaceproof.com"}
                </button>
                <button
                  onClick={() => handleFinalUpgradeAction("login")}
                  disabled={leadSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white/10 text-white font-medium text-sm border border-white/15 hover:bg-white/15 transition disabled:opacity-50"
                >
                  I am already a member
                </button>
              </div>

              <button
                onClick={() => handleFinalUpgradeAction("skip")}
                className="mt-3 text-xs text-white/40 hover:text-white/65 underline underline-offset-4"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Paywall overlay */}
      {showPaywall && !hasPaid && (
        <Paywall
          personName={personName}
          unlockKey={unlockKey || undefined}
          searchParams={{ url: url || undefined, handle: handle || undefined }}
          onPaymentComplete={() => {
            setHasMemberAccess(true);
            setHasPaid(true);
            setShowPaywall(false);
          }}
          onContinueFree={() => {
            setUseBasicModel(true);
            setHasPaid(true); // Don't show paywall again
            setShowPaywall(false);
          }}
        />
      )}
    </main>
  );
}

export default function SimulatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
          <div className="w-8 h-8 border-2 border-t-cyan-400/60 border-white/10 rounded-full animate-spin" />
        </div>
      }
    >
      <SimulationContent />
    </Suspense>
  );
}
