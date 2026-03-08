import { schema } from "./schema";
import { prompt } from "./prompt";
import { ChatGPT } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "ChatGPT",
  icon: "✦",
  category: "ai",
  schema,
  prompt,
  component: ChatGPT,
  layout: "inline-right",
};
