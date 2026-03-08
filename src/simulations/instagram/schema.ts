import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showInstagram",
  description: "Show an Instagram notification. Use for social updates, DMs from friends, life moments, personal milestones.",
  inputSchema: z.object({
    sender: z.string(),
    message: z.string().describe("Notification text like 'liked your photo' or DM content"),
    timeAgo: z.string(),
  }),
};
