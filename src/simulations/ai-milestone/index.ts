import { schema } from "./schema";
import { prompt } from "./prompt";
import { AiMilestone } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "AI Milestone",
  icon: "⚡",
  category: "core",
  schema,
  prompt,
  component: AiMilestone,
  layout: "inline-center",
};
