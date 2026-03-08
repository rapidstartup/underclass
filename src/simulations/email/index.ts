import { schema } from "./schema";
import { prompt } from "./prompt";
import { Email } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Email",
  icon: "✉️",
  category: "professional",
  schema,
  prompt,
  component: Email,
  layout: "inline-right",
};
