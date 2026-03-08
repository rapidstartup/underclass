import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showChapter",
  description: "Display a chapter/moment in the person's future. Returns confirmation when rendered.",
  inputSchema: z.object({
    year: z.number().describe("The year this takes place"),
    title: z.string().describe("Chapter title, evocative and short"),
    narrative: z.string().describe("2-4 sentences of vivid narrative. Third person. Cinematic."),
    personName: z.string().describe("The person's first name"),
    aiEra: z.string().describe("Brief label for the AI era, e.g. 'Pre-AGI', 'The Disruption', 'Agent Economy'"),
  }),
};
