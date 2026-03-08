import { schema } from "./schema";
import { prompt } from "./prompt";
import { IMessage } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "iMessage",
  icon: "💬",
  category: "messaging",
  schema,
  prompt,
  component: IMessage,
  layout: "inline-right",
};
