import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showLinkedInPost",
  description: "Show a LinkedIn post card. Use for professional updates, industry commentary, job announcements, thought leadership.",
  inputSchema: z.object({
    authorName: z.string(),
    authorTitle: z.string(),
    timeAgo: z.string(),
    content: z.string(),
    likes: z.number(),
    comments: z.number(),
  }),
};
