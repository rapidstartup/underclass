import { schema } from "./schema";
import { prompt } from "./prompt";
import { ClaudeMessage } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Claude",
  icon: "◎",
  category: "ai",
  schema,
  prompt,
  component: ClaudeMessage,
  layout: "inline-right",
};
