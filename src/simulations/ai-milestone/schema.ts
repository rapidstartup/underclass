import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showAiMilestone",
  description: "Show a major AI milestone marker between chapters. Reference specific research — arXiv papers, company announcements, breakthrough demos.",
  inputSchema: z.object({
    year: z.number(),
    headline: z.string().describe("Short headline about a specific AI breakthrough, e.g. 'Anthropic publishes Constitutional AI 4.0 on arXiv' or 'OpenAI Codex v3 passes SWE-bench at 94%'"),
  }),
};
