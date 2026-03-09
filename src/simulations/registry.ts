import type { Simulation } from "./types";
export type { Simulation, SimulationSchema } from "./types";

// ── Core (always included) ──────────────────────────────────
import { simulation as chapter } from "./chapter";
import { simulation as aiMilestone } from "./ai-milestone";
import { simulation as choice } from "./choice";
import { simulation as pulUpdate } from "./pul-update";

// ── Social ──────────────────────────────────────────────────
import { simulation as twitterPost } from "./twitter-post";
import { simulation as instagram } from "./instagram";

// ── Messaging ───────────────────────────────────────────────
import { simulation as imessage } from "./imessage";
import { simulation as slackMessage } from "./slack-message";
import { simulation as whatsapp } from "./whatsapp";

// ── Professional ────────────────────────────────────────────
import { simulation as linkedinPost } from "./linkedin-post";
import { simulation as linkedinExperience } from "./linkedin-experience";
import { simulation as email } from "./email";

// ── AI ──────────────────────────────────────────────────────
import { simulation as chatgpt } from "./chatgpt";
import { simulation as claudeMessage } from "./claude-message";

// ── System ──────────────────────────────────────────────────
import { simulation as newsAlert } from "./news-alert";

// ═══════════════════════════════════════════════════════════════
// ALL SIMULATIONS — Contributors: add your import above,
// then push to this array. That's it!
// ═══════════════════════════════════════════════════════════════
export const ALL_SIMULATIONS: Simulation[] = [
  // Core
  chapter,
  aiMilestone,
  choice,
  pulUpdate,

  // Social
  twitterPost,
  instagram,

  // Messaging
  imessage,
  slackMessage,
  whatsapp,

  // Professional
  linkedinPost,
  linkedinExperience,
  email,

  // AI
  chatgpt,
  claudeMessage,

  // System
  newsAlert,
];

// ── Helpers ─────────────────────────────────────────────────

/** Filter simulations by category */
export function getSimulations(categories?: string[]): Simulation[] {
  if (!categories) return ALL_SIMULATIONS;
  return ALL_SIMULATIONS.filter((s) => categories.includes(s.category));
}

/** Build system prompt fragments from all simulations */
export function buildPromptFragments(simulations: Simulation[]): string {
  return simulations
    .map((s) => s.prompt)
    .filter(Boolean)
    .join("\n");
}

/** Lookup: toolName → Simulation */
const toolMap = new Map<string, Simulation>(
  ALL_SIMULATIONS.map((s) => [s.schema.toolName, s])
);

export function getSimulationForTool(toolName: string): Simulation | undefined {
  return toolMap.get(toolName);
}
