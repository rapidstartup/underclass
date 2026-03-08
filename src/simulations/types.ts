import type { ComponentType } from "react";
import type { ZodObject } from "zod";

export interface SimulationSchema {
  toolName: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: ZodObject<any>;
}

export interface Simulation {
  name: string;
  icon: string;
  category: "core" | "social" | "messaging" | "professional" | "ai" | "developer" | "system";
  schema: SimulationSchema;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  layout: "inline-left" | "inline-right" | "inline-center" | "fullscreen" | "tab";
}
