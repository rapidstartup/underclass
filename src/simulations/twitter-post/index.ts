import { schema } from "./schema";
import { prompt } from "./prompt";
import { TwitterPost } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Twitter/X Post",
  icon: "𝕏",
  category: "social",
  schema,
  prompt,
  component: TwitterPost,
  layout: "inline-right",
};
