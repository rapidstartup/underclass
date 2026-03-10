import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showGameOver",
  description: "End the simulation with a final ReplaceProof outcome after 10+ chapters. Summarize trajectory, final risk score, key turning points, and practical takeaway.",
  inputSchema: z.object({
    finalPul: z.number().min(0).max(100).describe("Final ReplaceProof Risk Index score (kept field name for compatibility)."),
    outcome: z.enum(["replaceProof", "transitionInProgress", "highRisk"]).describe("replaceProof = risk < 20, transitionInProgress = risk 20-60, highRisk = risk > 60"),
    headline: z.string().describe("One-line outcome summary grounded in their transition story."),
    turningPoints: z.array(z.string()).describe("3-4 key moments that defined their fate"),
    finalYear: z.string().describe("The year the simulation ended, e.g. '2047'"),
    epitaph: z.string().describe("A short closing line for their trajectory and next step."),
  }),
};
