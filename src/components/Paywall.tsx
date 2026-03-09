"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaywallProps {
  onPaymentComplete: () => void;
  personName?: string;
}

export default function Paywall({ onPaymentComplete, personName }: PaywallProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleUnlock = useCallback(async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "" }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true);
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    }
  }, []);

  const handleComplete = useCallback(() => {
    // Mark as paid in localStorage so refreshes don't re-charge
    localStorage.setItem("underclass_paid", Date.now().toString());
    setShowCheckout(false);
    onPaymentComplete();
  }, [onPaymentComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          {!showCheckout ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center">
              {/* Lock icon */}
              <div className="text-5xl mb-4">🔒</div>

              <h2 className="text-2xl font-bold text-white mb-2">
                Story paused
              </h2>
              <p className="text-zinc-400 mb-1 text-sm">
                {personName
                  ? `${personName}'s simulation is just getting started.`
                  : "The simulation is just getting started."}
              </p>
              <p className="text-zinc-500 mb-6 text-xs">
                Unlock the full story — all chapters through the final verdict.
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$1.99</span>
                <span className="text-zinc-500 ml-2 text-sm">one-time</span>
              </div>

              {/* CTA */}
              <button
                onClick={handleUnlock}
                className="w-full py-3.5 px-6 bg-white text-black font-semibold rounded-xl 
                         hover:bg-zinc-200 active:scale-[0.98] transition-all text-lg
                         flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17.72 5.011H8.026c-2.228 0-2.398.163-2.398 2.222v1.392c0 .063.02.096.063.096h.44c.04 0 .063-.033.063-.096V7.31c0-1.357.063-1.42 1.549-1.42h9.181c1.486 0 1.549.063 1.549 1.42v9.181c0 1.356-.063 1.419-1.549 1.419H8.026c-1.486 0-1.549-.063-1.549-1.42V15.1c0-.063-.024-.096-.063-.096h-.44c-.044 0-.063.033-.063.096v1.392c0 2.059.17 2.222 2.398 2.222h9.694c2.228 0 2.398-.163 2.398-2.222V7.233c0-2.059-.17-2.222-2.398-2.222z" />
                  <path d="M12.85 15.55a.472.472 0 0 1-.017-.126l.017-.126c.003-.04.009-.126.017-.126l3.548-3.257H4.95c-.063 0-.096-.033-.096-.096v-.44c0-.063.033-.096.096-.096h11.465l-3.548-3.257c-.008 0-.014-.086-.017-.126l-.017-.126c.005-.04.017-.126.017-.126.003-.04.092-.096.126-.096.033 0 .126.056.126.096l4.096 3.757c.063.063.063.126 0 .189l-4.096 3.757c0 .04-.093.096-.126.096-.034 0-.123-.056-.126-.096z" />
                </svg>
                Continue with Apple Pay
              </button>

              <p className="text-zinc-600 text-xs mt-3">
                Also accepts cards · Powered by Stripe
              </p>
            </div>
          ) : (
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
