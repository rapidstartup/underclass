import { schema } from "./schema";
import { prompt } from "./prompt";
import { Chapter } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Chapter",
  icon: "📖",
  category: "core",
  schema,
  prompt,
  component: Chapter,
  layout: "inline-left",
};
