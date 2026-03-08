import { schema } from "./schema";
import { prompt } from "./prompt";
import { NewsAlert } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "News Alert",
  icon: "📰",
  category: "system",
  schema,
  prompt,
  component: NewsAlert,
  layout: "inline-right",
};
