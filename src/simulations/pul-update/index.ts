import { schema } from "./schema";
import { prompt } from "./prompt";
import { PULUpdate } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "PUL Score",
  icon: "📊",
  category: "core",
  schema,
  prompt,
  component: PULUpdate,
  layout: "inline-center",
};
