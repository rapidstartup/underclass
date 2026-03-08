import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showExperienceCard",
  description: "Show LinkedIn-style experience card with job history entries.",
  inputSchema: z.object({
    entries: z.array(z.object({
      title: z.string(),
      company: z.string(),
      type: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      duration: z.string(),
      location: z.string(),
      description: z.string(),
    })),
  }),
};
