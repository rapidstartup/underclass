import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showPULUpdate",
  description: "Update the PUL (Permanent Underclass Likelihood) score. Call this after EVERY chapter to reflect how the person's choices and circumstances affect their odds. This is the core game mechanic — every decision, every AI milestone, every career move shifts the PUL.",
  inputSchema: z.object({
    score: z.number().min(0).max(100).describe("Current PUL percentage (0 = certain elite, 100 = certain underclass). Start around 40-50 for most people."),
    delta: z.number().describe("How much the PUL changed from the last update. Positive = worse, negative = better. e.g. -8 means improved by 8 points."),
    reason: z.string().describe("Brief explanation of why the PUL changed, e.g. 'Pivoted to AI safety research early' or 'Ignored the agent economy transition'"),
  }),
};
