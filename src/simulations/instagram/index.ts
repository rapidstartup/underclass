import { schema } from "./schema";
import { prompt } from "./prompt";
import { Instagram } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Instagram",
  icon: "📷",
  category: "social",
  schema,
  prompt,
  component: Instagram,
  layout: "inline-right",
};
