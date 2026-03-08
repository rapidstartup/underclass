import { schema } from "./schema";
import { prompt } from "./prompt";
import { LinkedInPost } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "LinkedIn Post",
  icon: "in",
  category: "professional",
  schema,
  prompt,
  component: LinkedInPost,
  layout: "inline-right",
};
