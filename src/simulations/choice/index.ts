import { schema } from "./schema";
import { prompt } from "./prompt";
import { Choice } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Choice",
  icon: "🔀",
  category: "core",
  schema,
  prompt,
  component: Choice,
  layout: "inline-center",
};
