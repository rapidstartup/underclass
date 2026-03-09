import posthog from "posthog-js";

export const POSTHOG_KEY = "phc_NGWdGVZK6o8lxjAsIizfoVXyWvD0nxxUKQyDSdQ4imK";
export const POSTHOG_HOST = "https://us.i.posthog.com";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    // Session replay
    session_recording: {
      recordCrossOriginIframes: true,
    },
    // Performance
    disable_session_recording: false,
    enable_recording_console_log: false,
    mask_all_text: false,
    mask_all_element_attributes: false,
  });
}

export { posthog };
