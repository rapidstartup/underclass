import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showSlackMessage",
  description: "Show a Slack message. Use for work communication, team discussions, company announcements, #general channel drama.",
  inputSchema: z.object({
    sender: z.string().describe("Who sent the message"),
    message: z.string().describe("Message text"),
    channel: z.string().optional().describe("Channel name like #general or #engineering"),
    timeAgo: z.string(),
  }),
};
