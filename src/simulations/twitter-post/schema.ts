import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showTwitterPost",
  description: "Show a tweet/X post. Use for public discourse, tech hot takes, viral moments, industry drama, AI debates.",
  inputSchema: z.object({
    authorName: z.string().describe("Display name"),
    handle: z.string().describe("@handle without the @"),
    content: z.string().describe("Tweet text"),
    verified: z.boolean().optional().describe("Blue checkmark"),
    timeAgo: z.string(),
  }),
};
