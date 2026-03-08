import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showWhatsApp",
  description: "Show a WhatsApp message. Use for group chats, international contacts, family groups, startup founder groups.",
  inputSchema: z.object({
    sender: z.string(),
    message: z.string(),
    timeAgo: z.string(),
  }),
};
