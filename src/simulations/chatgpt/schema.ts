import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showChatGPT",
  description: "Show a ChatGPT conversation snippet. Use for moments where the person uses AI for advice, work, existential questions.",
  inputSchema: z.object({
    message: z.string().describe("ChatGPT's response"),
    userQuery: z.string().optional().describe("What the person asked"),
    timeAgo: z.string(),
  }),
};
