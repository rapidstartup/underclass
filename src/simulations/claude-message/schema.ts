import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showClaude",
  description: "Show a Claude AI conversation snippet. Use for deep analysis, safety discussions, philosophical conversations with AI.",
  inputSchema: z.object({
    message: z.string().describe("Claude's response"),
    userQuery: z.string().optional().describe("What the person asked"),
    timeAgo: z.string(),
  }),
};
