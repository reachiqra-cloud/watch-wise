# WatchWise

**One subscription. Every streaming service. An AI that makes your budget go further.**

Built for **GDG DevFest UC Santa Cruz 2026** (category: _Best Integration of Gemini / Google API_).

**Live demo:** https://watch-wise-theta.vercel.app

---

## The problem

People pay for Netflix, Prime Video, Disney+, Hulu and more, and the monthly total adds up fast. Most of that money goes to services they barely open, and nobody has a good way to decide what to watch against a budget.

## Our solution

WatchWise is a single subscription that works across providers through a **shared token wallet**. For example, $25 a month gives you 20 tokens, and you spend them on what you actually watch:

| Content               | Token cost                                                      |
| --------------------- | --------------------------------------------------------------- |
| Short episode         | 0.5                                                             |
| Standard movie        | 1                                                               |
| Premium / new release | 2                                                               |
| Full season           | Discounted bundle (cheaper than buying the episodes one by one) |

What makes WatchWise different is that it isn't only a catalogue. It's an **AI-powered entertainment budgeting and optimization assistant** that helps you decide what to watch and how to get the most out of your tokens.

## Features

- **Unified catalogue and token wallet.** Browse titles from all four services in one place, see your token balance, and view your watch history.
- **Gemini entertainment assistant.** Describe what you're in the mood for ("funny, under 2 hours, I only have 3 tokens") and Gemini checks the real catalogue, your wallet, and your history before it recommends anything.
- **Token optimizer.** Pick a wishlist and WatchWise finds the cheapest way to watch it, for example buying a season bundle instead of eight individual episodes.
- **AI budget plan.** Gemini analyzes your viewing history and suggests a monthly plan, a weekly usage forecast, and the subscription tier that fits you best.

## How we use Google and Gemini

| Google technology                | What it does in WatchWise                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gemini API** (`@google/genai`) | Powers the assistant, the optimizer explanations, and the budget plan                                                                                            |
| **Function calling**             | The assistant calls our own tools (`search_catalog`, `get_wallet`, `get_history`) in a loop, so recommendations are grounded in live app data instead of guesses |
| **Structured JSON output**       | The budget plan is returned as validated JSON that the UI turns into a chart and tips                                                                            |
| **Model fallback and retry**     | If a Gemini model is overloaded or rate-limited, the app retries and falls over to another Gemini Flash model                                                    |

### Design decision: the code does the math, Gemini does the reasoning

Token costs, savings, balances, and recommendation IDs are all **computed and validated in code**. Gemini only chooses what fits the user's request and writes the explanation. This means the assistant can't invent a title, miscount tokens, or recommend something that isn't in the catalogue, and the numbers shown in the demo are always verifiable.

## Architecture

```
Browser (Next.js pages: catalogue, wallet, chat, optimizer, budget)
        |
        v
Next.js API routes (server-side only)
   /api/chat      -> Gemini with function calling (tools below)
   /api/optimize  -> bundle math in code + Gemini explanation
   /api/budget    -> usage math in code + Gemini JSON summary and tips
   /api/catalog, /api/wallet, /api/watch -> app data and wallet state
        |
        v
Tools Gemini can call: search_catalog, get_wallet, get_history
        |
        v
Gemini API (Google AI)
```

## Tech stack

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **AI:** Google Gemini API via the `@google/genai` SDK
- **Charts:** Recharts
- **Hosting:** Vercel

## Security and reliability

- The Gemini API key is read only on the server (`process.env.GEMINI_API_KEY`) and is never sent to the browser or committed to the repository.
- All API inputs are validated (message length, wishlist size, known title IDs).
- The chat endpoint is rate limited per visitor.
- Recommended title IDs from the model are checked against the real catalogue before they are returned.
- Gemini calls have timeouts, retries, and model fallback, and the optimizer and budget endpoints return sensible plain-text results if Gemini is unavailable.

## Run it locally

You need **Node.js** (LTS) and a free **Gemini API key** from [Google AI Studio](https://aistudio.google.com).

```bash
git clone https://github.com/reachiqra-cloud/watch-wise.git
cd watch-wise
npm install
```

Create a file named `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
```

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000.

To check a production build:

```bash
npm run build
```

## API overview

| Endpoint        | Method | Purpose                                                                                      |
| --------------- | ------ | -------------------------------------------------------------------------------------------- |
| `/api/catalog`  | GET    | List titles (optional `genre`, `provider`, `type` filters)                                   |
| `/api/wallet`   | GET    | Token balance, plan, and watch history                                                       |
| `/api/watch`    | POST   | "Watch" a title: deducts tokens and records history                                          |
| `/api/chat`     | POST   | Gemini assistant: `{ message, history }` returns `{ reply, recommendedTitles, tokensAfter }` |
| `/api/optimize` | POST   | `{ wishlist: [titleIds] }` returns the cheapest plan, savings, and an explanation            |
| `/api/budget`   | GET    | Monthly usage forecast, suggested tier, and tips                                             |

Full request and response shapes are in [`CONTRACT.md`](./CONTRACT.md).

## Honest scope notes

- **The streaming catalogue and billing layer are mock data.** Real integration with Netflix, Prime Video, Disney+, and Hulu would need licensing agreements and partner APIs that don't exist publicly. WatchWise demonstrates the intelligence layer that would sit on top of those partnerships.
- **Wallet and history are kept in server memory** for the demo, so the balance can reset when the server restarts. A production version would store this in a database such as Firestore.

## What we'd build next

- Persistent accounts and wallet storage (Google sign-in with Firestore)
- Live "what's new this week" answers using Gemini with Google Search grounding
- Real partner integrations and subscription billing
- Household profiles and shared token pools

## Team

- **[Vanshita]**: frontend and data
- **[Iqra]**: AI and backend

Built in two days at GDG DevFest UC Santa Cruz.
