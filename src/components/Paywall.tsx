"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Stripe is intentionally disabled for now.
// Keeping these imports/logic commented so they can be restored quickly later.
// import { loadStripe } from "@stripe/stripe-js";
// import {
//   EmbeddedCheckoutProvider,
//   EmbeddedCheckout,
// } from "@stripe/react-stripe-js";
// const stripePromise = loadStripe(
//   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
// );

interface PaywallProps {
  onPaymentComplete: () => void;
  onContinueFree: () => void;
  personName?: string;
  searchParams?: { url?: string; handle?: string };
  unlockKey?: string;
}

type AuthMode = "password" | "membershipKey";

export default function Paywall({
  onPaymentComplete,
  onContinueFree,
  personName,
  searchParams,
  unlockKey,
}: PaywallProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [membershipKey, setMembershipKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleMemberLogin = async () => {
    if (authMode === "password" && (!identifier.trim() || !password.trim())) {
      setErrorMessage("Enter your username/email and password.");
      return;
    }
    if (authMode === "membershipKey" && !membershipKey.trim()) {
      setErrorMessage("Enter your membership key.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: authMode,
          identifier: identifier.trim(),
          password,
          membershipKey: membershipKey.trim(),
          unlockKey: unlockKey || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Unable to verify membership right now.");
        return;
      }

      localStorage.setItem("replaceproof_member_access", "true");
      localStorage.setItem("replaceproof_paid", Date.now().toString());
      if (data?.member?.email) {
        localStorage.setItem("replaceproof_member_email", data.member.email);
      }
      if (data?.member?.name) {
        localStorage.setItem("replaceproof_member_name", data.member.name);
      }
      onPaymentComplete();
    } catch (err) {
      console.error("Member login error:", err);
      setErrorMessage("Could not verify membership. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUpgradeUrl = () => {
    const params = new URLSearchParams();
    params.set("utm_source", "underclass");
    params.set("utm_medium", "paywall");
    params.set("utm_campaign", "full_transition_roadmap");
    if (unlockKey) params.set("unlock_key", unlockKey);
    if (personName) params.set("name", personName);
    if (searchParams?.url) params.set("profile_url", searchParams.url);
    if (searchParams?.handle) params.set("profile_handle", searchParams.handle);
    return `https://replaceproof.com?${params.toString()}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4"
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md my-2 sm:my-0"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-8 text-center max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
            <div className="text-4xl mb-4">🚀</div>

            <h2 className="text-xl font-bold text-white mb-3">
              Unlock your Full Transition Roadmap
            </h2>
            <p className="text-zinc-300 mb-6 text-sm leading-relaxed">
              {personName ? `${personName}, ` : ""}
              upgrade to the 90-day ReplaceProof member program for full roadmap access and no more interruptions.
            </p>

            <a
              href={getUpgradeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl 
                       hover:bg-zinc-200 active:scale-[0.98] transition-all
                       flex items-center justify-center gap-2 mb-3"
            >
              Upgrade at replaceproof.com
            </a>

            <div className="my-5 border-t border-zinc-700 pt-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 mb-3">
                Already a member?
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setAuthMode("password")}
                  className={`py-2 rounded-lg text-xs font-semibold border transition ${
                    authMode === "password"
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  Log in
                </button>
                <button
                  onClick={() => setAuthMode("membershipKey")}
                  className={`py-2 rounded-lg text-xs font-semibold border transition ${
                    authMode === "membershipKey"
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  Membership key
                </button>
              </div>

              {authMode === "password" ? (
                <div className="space-y-2 mb-3">
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username or email"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                  />
                </div>
              ) : (
                <div className="mb-3">
                  <input
                    value={membershipKey}
                    onChange={(e) => setMembershipKey(e.target.value)}
                    placeholder="membership key"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              <button
                onClick={handleMemberLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 px-5 bg-zinc-100 text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Unlock member access"}
              </button>
            </div>

            {errorMessage && (
              <p className="text-red-300 text-xs mb-3">{errorMessage}</p>
            )}

            <button
              onClick={onContinueFree}
              className="w-full py-3 px-6 bg-zinc-800 text-zinc-300 font-medium rounded-xl 
                       hover:bg-zinc-700 hover:text-white active:scale-[0.98] transition-all
                       border border-zinc-700 text-sm"
            >
              Continue free with basic model
            </button>

            <p className="text-zinc-600 text-xs mt-4">
              You can keep simulating free, or upgrade for the full 90-day roadmap.
            </p>
            <p className="hidden text-zinc-700 text-[11px] mt-3 leading-relaxed">
              This project remains{" "}
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                open source
              </a>
              {" "}and community-built.
            </p>
          </div>
          {/*
            Stripe checkout block kept for quick rollback.
            {!showCheckout ? (...) : (
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="text-white font-semibold text-sm">Complete Payment</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden bg-white">
                  {clientSecret && (
                    <EmbeddedCheckoutProvider
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        onComplete: handleComplete,
                      }}
                    >
                      <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                  )}
                </div>
              </div>
            )}
          */}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
