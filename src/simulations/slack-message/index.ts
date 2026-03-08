import { schema } from "./schema";
import { prompt } from "./prompt";
import { SlackMessage } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Slack Message",
  icon: "#",
  category: "messaging",
  schema,
  prompt,
  component: SlackMessage,
  layout: "inline-right",
};
