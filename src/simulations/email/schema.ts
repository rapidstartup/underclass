import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showEmail",
  description: "Show an email notification/preview. Use for job offers, investor updates, rejection letters, important announcements.",
  inputSchema: z.object({
    sender: z.string(),
    subject: z.string().describe("Email subject line"),
    preview: z.string().describe("First 1-2 sentences of the email body"),
    timeAgo: z.string(),
  }),
};
