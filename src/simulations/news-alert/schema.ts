import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showNewsAlert",
  description: "Show a breaking news alert. Use for major world events, AI breakthroughs, market crashes, regulation changes.",
  inputSchema: z.object({
    source: z.string().describe("News source: NYT, WSJ, TechCrunch, Reuters, Bloomberg, The Verge, etc."),
    headline: z.string().describe("News headline"),
    timeAgo: z.string(),
  }),
};
