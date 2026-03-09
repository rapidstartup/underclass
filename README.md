# Underclass

**Simulate your future through the age of AI.**

Paste a LinkedIn URL → the app researches you via [Exa](https://exa.ai), then streams an interactive narrative showing how AI will reshape your career over the next 50 years. Platform-accurate notifications (tweets, iMessages, Slack, LinkedIn posts), a PUL score tracking your odds, and branching choices that shape your fate.

**[Try it →](https://whats-next-inky.vercel.app)**

![What's Next](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![AI SDK](https://img.shields.io/badge/AI_SDK-v6-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## How It Works

1. **Research** — Exa API pulls your career history, company data, co-founders, education, and recent news
2. **Simulate** — Claude streams an interactive narrative using tool calls that render as platform-accurate UI components
3. **Play** — Your PUL (Permanent Underclass Likelihood) score shifts with every chapter. Make choices that determine if you join the elite that survives AI — or fall into the permanent underclass
4. **Share** — Save your simulation and share the link

## Stack

- **Next.js 16** + React 19 + TypeScript
- **AI SDK v6** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) — streaming tool calls
- **Claude Sonnet 4** — narrative generation
- **Exa API** — person/company research
- **Framer Motion** — animations
- **Tailwind v4** — styling
- **Neon Postgres** — session persistence (optional)

## Getting Started

```bash
git clone https://github.com/shaiunterslak/whats-next.git
cd whats-next
npm install
```

Create `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
EXA_API_KEY=...

# Optional — enables shareable sessions
POSTGRES_URL=postgresql://...
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Plugin Architecture

Every UI element in the simulation — tweets, iMessages, Slack messages, news alerts, the PUL score — is a **simulation plugin**. The system is designed so anyone can add new simulation types via a PR.

### Existing Plugins

| Plugin | Tool Name | Description |
|--------|-----------|-------------|
| `chapter` | `showChapter` | Narrative chapter with year/title |
| `choice` | `showChoice` | Branching choice (Path A / Path B) |
| `pul-update` | `showPULUpdate` | PUL score update with delta |
| `ai-milestone` | `showAiMilestone` | AI progress milestone |
| `twitter-post` | `showTwitterPost` | X/Twitter dark mode tweet |
| `imessage` | `showIMessage` | iMessage blue bubble |
| `slack-message` | `showSlackMessage` | Slack dark theme message |
| `linkedin-post` | `showLinkedInPost` | LinkedIn feed post |
| `linkedin-experience` | `showLinkedInExperience` | LinkedIn experience card |
| `whatsapp` | `showWhatsApp` | WhatsApp message |
| `email` | `showEmail` | Email notification |
| `news-alert` | `showNewsAlert` | Breaking news alert |
| `chatgpt` | `showChatGPT` | ChatGPT conversation |
| `claude-message` | `showClaude` | Claude conversation |
| `instagram` | `showInstagram` | Instagram post |

### Adding a New Simulation

Create a folder in `src/simulations/<your-simulation>/` with 4 files:

#### 1. `schema.ts` — Define the AI tool

```typescript
import { z } from "zod";
import type { SimulationSchema } from "../types";

export const schema: SimulationSchema = {
  toolName: "showRedditPost",  // unique tool name
  description: "Show a Reddit post. Use this for community reactions, viral discussions, and tech debates.",
  inputSchema: z.object({
    subreddit: z.string().describe("Subreddit name without r/"),
    author: z.string().describe("Reddit username"),
    title: z.string().describe("Post title"),
    content: z.string().describe("Post body text"),
    upvotes: z.number().describe("Upvote count"),
    commentCount: z.number().describe("Number of comments"),
  }),
};
```

#### 2. `component.tsx` — React component

```tsx
"use client";

import { motion } from "framer-motion";

interface Props {
  subreddit?: string;
  author?: string;
  title?: string;
  content?: string;
  upvotes?: number;
  commentCount?: number;
}

export function RedditPost({
  subreddit = "technology",
  author = "anonymous",
  title = "",
  content = "",
  upvotes = 0,
  commentCount = 0,
}: Props) {
  // IMPORTANT: All props must have defaults — the AI may send partial data
  return (
    <motion.div
      className="max-w-lg rounded-lg bg-[#1a1a1b] border border-[#343536] p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-xs text-gray-400 mb-1">r/{subreddit} • u/{author}</div>
      <h3 className="text-white font-medium mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{content}</p>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span>▲ {upvotes.toLocaleString()}</span>
        <span>💬 {commentCount} comments</span>
      </div>
    </motion.div>
  );
}
```

#### 3. `prompt.ts` — Instructions for the AI

```typescript
export const prompt = `
REDDIT POST (showRedditPost):
Use for viral tech discussions, community reactions to AI news, debates about job displacement.
Make subreddit names realistic (r/cscareerquestions, r/artificial, r/singularity, r/MachineLearning).
Content should feel authentic to Reddit culture — casual tone, strong opinions, dark humor.
`;
```

#### 4. `index.ts` — Barrel export

```typescript
import { schema } from "./schema";
import { prompt } from "./prompt";
import { RedditPost } from "./component";
import type { Simulation } from "../types";

export const simulation: Simulation = {
  name: "Reddit Post",
  icon: "🤖",
  category: "notification",  // "core" | "notification" | "conversation" | "fullscreen"
  schema,
  prompt,
  component: RedditPost,
  layout: "inline-left",  // "inline-left" | "inline-right" | "inline-center" | "fullscreen"
};
```

#### 5. Register it

Add one line to `src/simulations/registry.ts`:

```typescript
import { simulation as redditPost } from "./reddit-post";

// Add to ALL_SIMULATIONS array:
export const ALL_SIMULATIONS: Simulation[] = [
  // Core
  chapter, aiMilestone, choice, pulUpdate,
  // Notifications
  twitterPost, imessage, slackMessage, /* ... */
  redditPost,  // ← your new simulation
];
```

That's it. The registry auto-wires the tool into the API, composes the prompt fragment, and maps the component for rendering.

### Sound Effects (Optional)

Add a sound file to `public/sounds/<name>.mp3` and map it in `src/lib/sounds.ts`:

```typescript
const soundMap: Record<string, string> = {
  // ...existing mappings
  showRedditPost: "reddit",
};
```

### Guidelines

- **All props must be optional with defaults** — the AI streams partial data
- **Use Framer Motion** for entrance animations (`initial={{ opacity: 0 }} animate={{ opacity: 1 }}`)
- **Match the real platform's design** as closely as possible (dark modes, exact colors, typography)
- **Keep components self-contained** — no external dependencies beyond framer-motion and React
- **Wrap in ErrorBoundary** — the renderer automatically wraps your component, but defensive coding helps
- **Core simulations** (`chapter`, `choice`, `pul-update`) cannot be disabled by users

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page (LinkedIn URL input)
│   ├── simulate/page.tsx        # Main simulation viewer
│   ├── s/[id]/page.tsx          # Shared session viewer (read-only)
│   └── api/
│       ├── research/route.ts    # Exa person/company research
│       ├── simulate/route.ts    # Claude streaming + tool calls
│       └── sessions/route.ts    # Save/load sessions (Neon)
├── simulations/
│   ├── registry.ts              # Plugin registry
│   ├── types.ts                 # Simulation & SimulationSchema interfaces
│   └── <plugin>/                # One folder per simulation type
├── components/
│   ├── logos.tsx                 # Inline SVG logos
│   ├── Shimmer.tsx              # Loading shimmer effect
│   ├── SimulationControls.tsx   # Floating controls panel
│   └── ErrorBoundary.tsx        # Error boundary wrapper
└── lib/
    ├── exa.ts                   # Exa API client (4-step research)
    ├── sounds.ts                # Sound effect system
    └── viral.ts                 # URL replacement (growth hack)
```

## Ideas for New Simulations

- **Reddit post** — r/cscareerquestions discussions about AI job displacement
- **GitHub profile** — contribution chart showing activity changes
- **Terminal** — command-line output showing AI agent interactions
- **Phone mockup** — full iPhone screen with app UI
- **Gmail inbox** — email list view
- **Calendar** — meeting invites and schedule changes
- **Bank statement** — financial impact of career moves
- **App Store** — apps the person builds or gets replaced by

## Contributing

1. Fork the repo
2. Create a new simulation plugin (see [Adding a New Simulation](#adding-a-new-simulation))
3. Test locally with `npm run dev`
4. Open a PR

## License

MIT
