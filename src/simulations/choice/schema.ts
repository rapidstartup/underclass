import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showChoice",
  description: "Present a choice — a meaningful fork in the person's journey. Make it a real dilemma with specific stakes and consequences. ALWAYS use this as the LAST tool call in every response.",
  inputSchema: z.object({
    prompt: z.string().describe("The situation/dilemma they face — be specific and dramatic"),
    optionA: z.string().describe("First option — specific and consequential"),
    optionB: z.string().describe("Second option — specific and consequential"),
  }),
};
