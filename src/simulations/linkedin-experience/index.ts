import { schema } from "./schema";
import { prompt } from "./prompt";
import { ExperienceCard } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Experience Card",
  icon: "💼",
  category: "professional",
  schema,
  prompt,
  component: ExperienceCard,
  layout: "inline-right",
};
