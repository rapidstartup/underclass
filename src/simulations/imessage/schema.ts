import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showIMessage",
  description: "Show an iMessage bubble. Use for personal texts from friends, family, co-founders, significant others.",
  inputSchema: z.object({
    sender: z.string().describe("Who sent the message"),
    message: z.string().describe("Message text"),
    timeAgo: z.string(),
    isFromMe: z.boolean().optional().describe("If true, show as sent (right-aligned blue). Default is received."),
  }),
};
