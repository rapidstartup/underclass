import { schema } from "./schema";
import { prompt } from "./prompt";
import { GameOver } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Game Over",
  icon: "🏁",
  category: "core",
  schema,
  prompt,
  component: GameOver,
  layout: "fullscreen",
};
