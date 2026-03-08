import { schema } from "./schema";
import { prompt } from "./prompt";
import { WhatsApp } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "WhatsApp",
  icon: "📱",
  category: "messaging",
  schema,
  prompt,
  component: WhatsApp,
  layout: "inline-right",
};
