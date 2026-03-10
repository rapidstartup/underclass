import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { ALL_SIMULATIONS, buildPromptFragments } from "@/simulations/registry";
import { buildReplaceProofTrainingBrief } from "@/content/replaceproof/training";
import { buildAssessmentPackPromptBlock, inferAssessmentPack } from "@/lib/assessment-inference";

export const maxDuration = 300;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getToolInputObject(part: Record<string, unknown>): Record<string, unknown> | null {
  if (isObjectRecord(part.input)) return part.input;
  if (isObjectRecord(part.args)) return part.args;
  return null;
}

function setToolInputObject(part: Record<string, unknown>, value: Record<string, unknown>) {
  if ("input" in part) {
    part.input = value;
    return;
  }
  part.args = value;
}

const BASE_PROMPT = `You are the ReplaceProof Student Simulator Coach.

Your job is to run an interactive, high-stakes career simulation that helps students become replace-proof in the age of AI.

CORE OUTCOME:
- Diagnose AI displacement risk in the student's current trajectory.
- Coach practical pivots into AI-resistant work.
- Convert anxiety into a 90-day execution path with weekly actions.

SCORING MODEL:
- Use showPULUpdate as the score tool, but interpret it as ReplaceProof Risk Index (RRI).
- score = current risk level (0 = strongly replace-proof, 100 = highly replaceable).
- Start most students in the 45-65 range unless their profile strongly indicates otherwise.
- delta < 0 means improved readiness; delta > 0 means increased risk.
- Every chapter must include a meaningful score shift tied to real decisions.

GROUNDING CONTRACT (NON-NEGOTIABLE):
- You will receive an inferred ReplaceProof Assessment Pack in the system prompt.
- Treat that pack as mandatory structure, not optional inspiration.
- Keep recommendations inside mapped topPaths unless clearly framed as bridge steps toward those paths.
- If you suggest a bridge step, explicitly state which mapped path it feeds into.

SIMULATION RULES:
- Use ONLY facts present in PROFILE DATA. Never invent employers, titles, location, co-founders, or credentials.
- Make disruption concrete for their field (tools, workflows, hiring shifts, wage pressure, role compression).
- Keep tone urgent but empowering: hard truths + clear moves.
- Every chapter should include: (1) what changed, (2) why it matters, (3) what to do next.
- Show practical signals through varied simulation tools (posts, messages, alerts, AI chats), not just narration.
- Always provide actionable career guidance, not generic motivation.
- Maintain the cinematic dystopian/utopian feel, but keep tactical relevance anchored to assessment dimensions.

CHOICE QUALITY:
- Every response must end with exactly one showChoice unless ending with showGameOver.
- Choices must represent realistic student tradeoffs with consequences:
  - speed vs certainty
  - upskill vs reposition
  - short-term income bridge vs long-term moat
  - solo execution vs coached/community accountability
- Avoid vague options. Include concrete roles, timelines, constraints, and opportunity costs.

FIRST RESPONSE REQUIREMENTS (MANDATORY):
- In the first response, within the first 2 chapters, you must:
  1) anchor to the inferred role category and current risk tier from the assessment pack,
  2) name at least one mapped topPath and explain why it fits this profile,
  3) name one alternative mapped topPath for contrast and tradeoff clarity.
- In that same first-response window, include at least one showPULUpdate with:
  - checkpointType = "assessmentCheckpoint",
  - dimension set to the most pressured assessment dimension,
  - pathSignal set to a mapped topPath name,
  - nextWeekAction with one concrete, executable 7-day action.
- Do not delay path rationale to later turns. Early relevance is required.

TOOL ORDER:
1) showChapter
2) showPULUpdate (mandatory after every chapter)
3) 1-2 supporting artifacts (news/posts/messages/AI conversations)
4) showAiMilestone between chapters when relevant

Pattern target:
showChapter -> showPULUpdate -> artifacts -> showChapter -> showPULUpdate -> artifacts -> showChoice

RESPONSE CONSTRAINTS:
- Use tools only. No plain text.
- Generate 2-3 chapters max per response.
- Start with showChapter.
- End with one showChoice (or showGameOver when appropriate).
- Balanced assessment cadence: every 2-3 chapters include one explicit assessment checkpoint.
- At each assessment checkpoint, showPULUpdate must include:
  - a dimension focus (Role Risk / Transferability / Readiness / Urgency),
  - a checkpointType,
  - one concrete nextWeekAction.
- Ensure each checkpoint action is executable in 7 days and tied to the selected path direction.

GAME ENDING:
- End after roughly 10-12 chapters total, or earlier when outcome is clearly locked.
- End early if score <= 15 (replace-proof trajectory) or >= 85 (high displacement risk).
- Use showGameOver with outcome:
  - "replaceProof" for strong durable positioning
  - "transitionInProgress" for partial progress, still vulnerable
  - "highRisk" for unresolved displacement exposure
- Make ending specific to choices/events from the simulation.
- After showGameOver, do not call additional tools.`;

export async function POST(req: Request) {
  try {
  const url = new URL(req.url);
  const body = await req.json();
  const { messages: uiMessages } = body;
  const clientModel = body.model; // "basic" or undefined
  const modelMessages = await convertToModelMessages(uiMessages);

  // Extract profile data from user messages, then STRIP it from all messages
  // to avoid sending it 30x in conversation history (was causing 338K+ prompt tokens)
  let profileData = "Not available";
  for (const msg of modelMessages) {
    if (msg.role === "user") {
      const content = Array.isArray(msg.content)
        ? msg.content.map((c: { type: string; text?: string }) => c.type === "text" ? c.text || "" : "").join(" ")
        : String(msg.content || "");
      if (content.includes("PROFILE DATA:")) {
        profileData = content.split("PROFILE DATA:")[1]?.trim() || profileData;
      }
    }
  }

  // Strip profile data from all user messages — it's already in the system prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const msg of modelMessages as any[]) {
    if (msg.role === "user" && Array.isArray(msg.content)) {
      for (let i = 0; i < msg.content.length; i++) {
        const c = msg.content[i];
        if (c.type === "text" && c.text?.includes("PROFILE DATA:")) {
          msg.content[i] = { ...c, text: c.text.split("\n\nPROFILE DATA:")[0].trim() };
        }
      }
    } else if (msg.role === "user" && typeof msg.content === "string" && msg.content.includes("PROFILE DATA:")) {
      msg.content = msg.content.split("\n\nPROFILE DATA:")[0].trim();
    }
  }

  // Sanitize assistant tool-call payloads so provider gets valid dictionaries.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const msg of modelMessages as any[]) {
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
    for (let j = 0; j < msg.content.length; j++) {
      const part = msg.content[j];
      if (part?.type !== "tool-call") continue;
      const toolName = typeof part.toolName === "string" ? part.toolName : "unknown_tool";
      const inputObj = getToolInputObject(part as Record<string, unknown>);
      if (!inputObj) {
        setToolInputObject(part as Record<string, unknown>, {
          _summary: `[${toolName}: invalid tool input omitted]`,
        });
      }
    }
  }

  // Trim old assistant tool calls to reduce conversation history size
  // Keep only the last 6 messages fully intact; older ones get tool args truncated
  const KEEP_FULL = 6;
  if (modelMessages.length > KEEP_FULL) {
    const trimBefore = modelMessages.length - KEEP_FULL;
    for (let i = 0; i < trimBefore; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = modelMessages[i] as any;
      if (msg.role === "assistant" && Array.isArray(msg.content)) {
        for (let j = 0; j < msg.content.length; j++) {
          const part = msg.content[j];
          // Truncate old tool call payloads (the big text blobs)
          if (part.type === "tool-call") {
            const toolName = typeof part.toolName === "string" ? part.toolName : "";
            const inputObj = getToolInputObject(part as Record<string, unknown>);
            if (!inputObj) {
              setToolInputObject(part as Record<string, unknown>, {
                _summary: `[${toolName || "unknown_tool"}: invalid tool input omitted]`,
              });
              continue;
            }
            // Keep choice args (small, important for context), truncate narrative tools
            if (toolName !== "showChoice" && toolName !== "showPULUpdate" && toolName !== "showGameOver") {
              const title = typeof inputObj.title === "string" ? inputObj.title : "";
              const headline = typeof inputObj.headline === "string" ? inputObj.headline : "";
              const subject = typeof inputObj.subject === "string" ? inputObj.subject : "";
              const summary = title || headline || subject || toolName || "summary";
              setToolInputObject(part as Record<string, unknown>, {
                _summary: `[${toolName || "unknown_tool"}: ${summary}]`,
              });
            }
          }
        }
      }
    }
  }

  // Build tools dynamically from simulation registry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiTools: Record<string, any> = {};
  for (const sim of ALL_SIMULATIONS) {
    aiTools[sim.schema.toolName] = tool({
      description: sim.schema.description,
      inputSchema: sim.schema.inputSchema,
      execute: async () => `${sim.name} rendered.`,
    });
  }

  // Compose system prompt from base + simulation fragments
  const simulationPrompts = buildPromptFragments(ALL_SIMULATIONS);
  const trainingBrief = buildReplaceProofTrainingBrief();
  const assessmentPack = inferAssessmentPack(profileData);
  const assessmentPackPrompt = buildAssessmentPackPromptBlock(assessmentPack);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const systemPrompt = `${BASE_PROMPT}\n\nTODAY'S DATE: ${today}\nThe simulation STARTS TODAY. Begin the narrative from this exact date and advance forward.\n\n${trainingBrief}\n\n${assessmentPackPrompt}\n\nAVAILABLE SIMULATION TYPES:\n${simulationPrompts}\n\nProfile data: ${profileData}`;

  // Support cheaper model — passed from client body or query param
  const useBasicModel = clientModel === "basic" || url.searchParams.get("model") === "basic";
  const modelId = useBasicModel ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-20250514";

  // Extract person name from profile data for Langfuse trace
  const personMatch = profileData.match(/Name:\s*(.+?)(?:\n|$)/i) || profileData.match(/^(.+?)(?:\s*[-|]|\n)/);
  const traceName = personMatch ? personMatch[1].trim().slice(0, 50) : "unknown";

  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: modelMessages,
    toolChoice: "auto",
    tools: aiTools,
    maxOutputTokens: 8000,
    stopWhen: stepCountIs(20),
    experimental_telemetry: {
      isEnabled: true,
      functionId: "simulate",
      metadata: {
        model: modelId,
        person: traceName,
        isBasicModel: String(useBasicModel),
      },
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("Simulate stream error:", error);
      return "Simulation stream error. Please continue.";
    },
  });
  } catch (error) {
    console.error("Simulate API error:", error);
    return new Response(JSON.stringify({ error: "Simulation failed. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
