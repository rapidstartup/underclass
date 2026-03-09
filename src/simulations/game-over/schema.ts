import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showGameOver",
  description: "End the simulation with a final summary. Call this ONLY after 10+ chapters when the person's fate is sealed. Summarize their journey, final PUL score, key turning points, and ultimate outcome.",
  inputSchema: z.object({
    finalPul: z.number().min(0).max(100).describe("Final PUL score"),
    outcome: z.enum(["elite", "survived", "underclass"]).describe("elite = PUL < 20, survived = PUL 20-60, underclass = PUL > 60"),
    headline: z.string().describe("One-line fate summary, e.g. 'You became the last human engineer at Anthropic' or 'You joined the permanent underclass in 2034'"),
    turningPoints: z.array(z.string()).describe("3-4 key moments that defined their fate"),
    finalYear: z.string().describe("The year the simulation ended, e.g. '2047'"),
    epitaph: z.string().describe("A short, punchy epitaph for their career. Dark humor encouraged."),
  }),
};
