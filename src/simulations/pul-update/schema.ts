import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showPULUpdate",
  description: "Update the ReplaceProof Risk Index (RRI) after every chapter. Keep the existing tool name for compatibility, but treat the score as displacement risk where lower is better and higher is more vulnerable.",
  inputSchema: z.object({
    score: z.number().min(0).max(100).describe("Current ReplaceProof Risk Index (0 = strongly replace-proof, 100 = highly replaceable)."),
    delta: z.number().describe("Risk shift from last update. Positive = higher risk, negative = lower risk."),
    reason: z.string().describe("Short coaching explanation for the change, tied to concrete choices or market shifts."),
    dimension: z.enum(["roleRisk", "transferability", "readiness", "urgency"]).optional().describe("Optional assessment dimension focus for checkpoint beats."),
    checkpointType: z.enum(["chapterBeat", "assessmentCheckpoint", "pathSignal"]).optional().describe("Optional checkpoint type. Use assessmentCheckpoint every 2-3 chapters."),
    pathSignal: z.string().optional().describe("Optional mapped path anchor, e.g. 'Content Strategist'."),
    nextWeekAction: z.string().optional().describe("Optional concrete 7-day action tied to this checkpoint."),
  }),
};
