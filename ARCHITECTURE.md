# ReplaceProof Student Simulator — Plugin Architecture

## Core Concept

A **Simulation** is a self-contained plugin that teaches the AI how to generate a specific type of content and provides the React component to render it. Everything is a simulation — tweets, iMessages, LinkedIn posts, GitHub profiles, full-screen phone mockups, etc.

## Plugin Structure

Each simulation lives in `src/simulations/<name>/` with 4 files:

```
src/simulations/
├── registry.ts              ← auto-discovers all simulations
├── twitter-post/
│   ├── index.ts             ← exports everything (barrel file)
│   ├── schema.ts            ← Zod schema for the AI tool
│   ├── component.tsx         ← React component
│   └── prompt.ts            ← AI instructions for this simulation
├── imessage/
│   ├── index.ts
│   ├── schema.ts
│   ├── component.tsx
│   └── prompt.ts
├── github-profile/
│   ├── index.ts
│   ├── schema.ts
│   ├── component.tsx
│   └── prompt.ts
└── ...
```

### schema.ts

Defines the tool name, description, and Zod input schema. This is what the AI model calls.

```ts
import { z } from "zod";
import type { SimulationSchema } from "../registry";

export const schema: SimulationSchema = {
  // Tool name the AI calls — must be unique
  toolName: "showTwitterPost",

  // Description shown to the AI
  description: "Show a tweet/X post. Use for public discourse, tech hot takes, viral moments, industry drama.",

  // Zod schema for tool input
  inputSchema: z.object({
    authorName: z.string().describe("Display name"),
    handle: z.string().describe("@handle without the @"),
    content: z.string().describe("Tweet text, max 280 chars"),
    verified: z.boolean().optional().describe("Blue checkmark"),
    likes: z.number().describe("Like count"),
    retweets: z.number().describe("Retweet count"),
    replies: z.number().describe("Reply count"),
    views: z.number().describe("View count"),
    timeAgo: z.string(),
  }),
};
```

### component.tsx

A React component that receives the schema's input as props. Must handle partial/undefined data gracefully.

```tsx
"use client";
import { motion } from "framer-motion";
import type { z } from "zod";
import type { schema } from "./schema";

type Props = z.infer<typeof schema.inputSchema>;

export function TwitterPost({ authorName, handle, content, likes, ...rest }: Props) {
  return (
    <motion.div ...>
      {/* Pixel-accurate Twitter/X dark mode card */}
    </motion.div>
  );
}
```

### prompt.ts

A text fragment that gets injected into the system prompt. Tells the AI when/how to use this simulation.

```ts
export const prompt = `
TWITTER/X POSTS (showTwitterPost):
- Use for: public discourse, tech hot takes, viral moments, industry reactions, AI drama
- Make tweets feel authentic — use real Twitter voice, hashtags, ratio energy
- Reference real accounts when relevant (@sama, @daboross, @kaboross, etc.)
- Engagement numbers should be realistic for the person's following
`;
```

### index.ts

Barrel export with metadata.

```ts
import { schema } from "./schema";
import { prompt } from "./prompt";
import { TwitterPost } from "./component";
import type { Simulation } from "../registry";

export const simulation: Simulation = {
  // Metadata
  name: "Twitter/X Post",
  description: "Tweets and X posts",
  icon: "𝕏",
  category: "social",    // social | messaging | professional | developer | fullscreen | system

  // Plugin parts
  schema,
  prompt,
  component: TwitterPost,

  // Layout hint — how the simulate page should render this
  layout: "inline-right",  // inline-left | inline-right | inline-center | fullscreen | tab
};
```

## Registry

`src/simulations/registry.ts` auto-collects all simulations:

```ts
import type { z, ZodObject } from "zod";
import type { ComponentType } from "react";

export interface SimulationSchema {
  toolName: string;
  description: string;
  inputSchema: ZodObject<any>;
}

export interface Simulation {
  name: string;
  description: string;
  icon: string;
  category: "social" | "messaging" | "professional" | "developer" | "fullscreen" | "system";
  schema: SimulationSchema;
  prompt: string;
  component: ComponentType<any>;
  layout: "inline-right" | "inline-left" | "inline-center" | "fullscreen" | "tab";
}

// All simulations — import and register here
// Contributors: add your simulation import + push here
import { simulation as twitterPost } from "./twitter-post";
import { simulation as imessage } from "./imessage";
import { simulation as slack } from "./slack";
import { simulation as linkedinPost } from "./linkedin-post";
import { simulation as linkedinExperience } from "./linkedin-experience";
import { simulation as whatsapp } from "./whatsapp";
import { simulation as email } from "./email";
import { simulation as newsAlert } from "./news-alert";
import { simulation as chatgpt } from "./chatgpt";
import { simulation as claude } from "./claude";
import { simulation as instagram } from "./instagram";
import { simulation as chapter } from "./chapter";
import { simulation as aiMilestone } from "./ai-milestone";
import { simulation as choice } from "./choice";

export const ALL_SIMULATIONS: Simulation[] = [
  // Core (always included)
  chapter,
  aiMilestone,
  choice,

  // Social
  twitterPost,
  instagram,
  linkedinPost,

  // Messaging
  imessage,
  slack,
  whatsapp,

  // Professional
  linkedinExperience,
  email,

  // AI
  chatgpt,
  claude,

  // System
  newsAlert,
];

// Helper: get simulations by category
export function getSimulations(categories?: string[]): Simulation[] {
  if (!categories) return ALL_SIMULATIONS;
  return ALL_SIMULATIONS.filter((s) => categories.includes(s.category));
}

// Helper: build AI tools object from simulations
export function buildTools(simulations: Simulation[]) {
  const tools: Record<string, any> = {};
  for (const sim of simulations) {
    tools[sim.schema.toolName] = {
      description: sim.schema.description,
      inputSchema: sim.schema.inputSchema,
      execute: async () => `${sim.name} rendered.`,
    };
  }
  return tools;
}

// Helper: compose system prompt from simulations
export function buildPromptFragments(simulations: Simulation[]): string {
  return simulations
    .map((s) => s.prompt)
    .filter(Boolean)
    .join("\n");
}

// Helper: get component for a tool name
export function getComponentForTool(toolName: string): ComponentType<any> | null {
  const sim = ALL_SIMULATIONS.find((s) => s.schema.toolName === toolName);
  return sim?.component || null;
}

// Helper: get layout for a tool name
export function getLayoutForTool(toolName: string): string {
  const sim = ALL_SIMULATIONS.find((s) => s.schema.toolName === toolName);
  return sim?.layout || "inline-right";
}
```

## How the API Route Uses This

```ts
// src/app/api/simulate/route.ts
import { ALL_SIMULATIONS, buildTools, buildPromptFragments } from "@/simulations/registry";
import { tool } from "ai";

// Build tools dynamically
const aiTools = {};
for (const sim of ALL_SIMULATIONS) {
  aiTools[sim.schema.toolName] = tool({
    description: sim.schema.description,
    inputSchema: sim.schema.inputSchema,
    execute: async () => `${sim.name} rendered.`,
  });
}

// Compose prompt
const simulationPrompts = buildPromptFragments(ALL_SIMULATIONS);
const systemPrompt = `${BASE_PROMPT}\n\nAVAILABLE SIMULATION TYPES:\n${simulationPrompts}`;
```

## How the Page Renders

```tsx
// src/app/simulate/page.tsx
import { ALL_SIMULATIONS } from "@/simulations/registry";

// Build a lookup map: toolName → { component, layout }
const TOOL_MAP = new Map(
  ALL_SIMULATIONS.map((s) => [
    s.schema.toolName,
    { Component: s.component, layout: s.layout },
  ])
);

// In render:
const renderTool = (toolName: string, args: any, key: string) => {
  const entry = TOOL_MAP.get(toolName);
  if (!entry) return null;

  const { Component, layout } = entry;

  const layoutClass =
    layout === "inline-right" ? "flex justify-end" :
    layout === "inline-left" ? "flex justify-start" :
    layout === "inline-center" ? "flex justify-center" :
    layout === "fullscreen" ? "w-full" :
    "";

  return (
    <ErrorBoundary key={key}>
      <div className={`mb-4 ${layoutClass}`}>
        <Component {...args} />
      </div>
    </ErrorBoundary>
  );
};
```

## Layout Types

| Layout | Description | Example |
|--------|-------------|---------|
| `inline-right` | Float right, max-w-sm | Notifications, tweets, messages |
| `inline-left` | Float left, full width | Chapters, narrative text |
| `inline-center` | Centered | AI milestones, choices |
| `fullscreen` | Full viewport width | Phone mockup, GitHub profile |
| `tab` | Rendered in a tab bar the user can switch between | Gmail inbox, Messages app, GitHub repos |

## Future Simulations (planned)

### Developer
- `github-profile` — Full GitHub profile with contribution graph, pinned repos, activity
- `github-repo` — Repo page with stars, forks, README preview
- `github-pr` — Pull request with diff preview, review comments
- `terminal` — Terminal/CLI output mockup

### Fullscreen / Tabs
- `iphone-screen` — Full iPhone mockup with status bar, app grid or specific app
- `messages-app` — Full Messages.app conversation thread
- `gmail-inbox` — Gmail inbox with email list
- `calendar` — Calendar view with events

### Social
- `reddit-post` — Reddit post with upvotes, subreddit, comments
- `hackernews` — HN post with points, comments
- `tiktok` — TikTok-style video card with engagement stats
- `youtube` — YouTube video thumbnail card

### Financial
- `bank-notification` — Bank account balance / transaction alert
- `stock-ticker` — Stock/crypto price movement
- `venmo` — Venmo payment notification

### System
- `breaking-news` — Full-width news banner
- `podcast` — Podcast episode card
- `book-cover` — Book cover (for when the person writes a book)

## Adding a New Simulation (Contributor Guide)

1. Create `src/simulations/your-name/` with 4 files:
   - `schema.ts` — define the tool name + Zod input schema
   - `component.tsx` — build the React component (match the real platform's UI exactly)
   - `prompt.ts` — write AI instructions for when/how to use it
   - `index.ts` — export the `simulation` object with metadata
2. Add your import + registration in `src/simulations/registry.ts`
3. That's it — the API route and page automatically pick it up

**Rules for components:**
- Must handle all props being undefined/null gracefully
- Must use `framer-motion` for entrance animations
- Must visually match the real platform as closely as possible (dark mode)
- Must be responsive (max-w-sm for inline, full-width for fullscreen)
- No external API calls — components are purely presentational

## User Customization (future)

On the landing page, users can optionally customize which simulations to include:

```
[✓] Twitter/X posts      [✓] iMessages      [✓] LinkedIn
[✓] Slack messages        [ ] GitHub profile  [ ] Reddit
[✓] News alerts           [✓] Email           [ ] Phone mockup
```

Selected simulations are passed as a query param: `?sims=twitter,imessage,linkedin,slack,news,email`

The API route filters simulations and only includes selected ones in the tools + prompt.

## Tab System (future)

For `tab` layout simulations, the page renders a tab bar at the bottom:

```
┌──────────────────────────────────────┐
│                                      │
│         [Simulation content]         │
│                                      │
├──────────────────────────────────────┤
│  📱 Phone  |  💻 GitHub  |  📧 Gmail │
└──────────────────────────────────────┘
```

Tapping a tab shows a fullscreen mockup of that app with accumulated state from the simulation (all iMessages so far, all GitHub repos created, all emails received, etc.).
