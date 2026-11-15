# WatchWise

**One subscription. Every streaming service. Smarter with AI.**

Built for UCSC GDG DevFest (Nov 14-15, 2026), in the Best Integration of Gemini / Google API category.

Live demo: [add the deployed link here]

## The problem

People pay for several streaming services (Netflix, Prime Video, Disney+, Hulu) and it adds up to $60+ a month, even though most of us only watch a few things on each one.

## The idea

One subscription that works across providers through a shared token wallet. Standard is $25 a month for 20 tokens with ads. Premium is $30 a month for 20 tokens with no ads. You can also buy single tokens for $1.50 each.
WatchWise is not just an aggregator. It is an AI-powered entertainment budgeting and optimization platform that helps you decide what to watch and get the most out of your tokens.

| Content | Tokens |
| --- | --- |
| Short episode | 0.5 |
| Standard movie | 1 |
| Premium / new release | 2 |
| Full season bundle | Cheaper than buying the episodes one by one |

Token costs are fixed in code. The AI never decides prices.

## Features

1. **Unified catalogue, token wallet and watch history.** Browse every provider in one place, filter by genre, provider and type, and spend tokens with one click.
2. **AI assistant (Gemini function calling).** Ask for a recommendation in plain English. The assistant checks the catalogue, your wallet and your history before answering, and only recommends titles you can afford.
3. **Token optimizer.** Pick a wishlist and get the cheapest plan, for example a season bundle instead of single episodes. The token math is computed in code. Gemini picks the strategy and writes the explanation. One click buys the plan.
4. **AI budget plan.** Gemini analyses your viewing history, projects your weekly usage on a chart, and suggests the plan tier that fits you.

## What is real and what is mock

The AI layer is real. The streaming catalogue and billing are mock data: there are no public streaming APIs, and real content would need licensing and DRM. "Watch" deducts tokens from the wallet. Wallet and history live in server memory, so restarting the server resets them to 20 tokens.

## Security and design choices

- The Gemini API key lives only on the server (`.env.local`). The browser never sees it and only talks to our own `/api/*` routes.
- Prices and token math live in code, not in the AI, so the AI cannot invent a price.
- Chat messages are length-limited and every endpoint returns the same friendly error shape.
- Frontend and backend were built in parallel against a written API contract (`CONTRACT.md`).

## Built with

Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts, and the Gemini API through `@google/genai`.

## Run it locally

    git clone https://github.com/reachiqra-cloud/watch-wise.git
    cd watch-wise
    npm install

Create a file called `.env.local` in the project root containing:

    GEMINI_API_KEY=your-key-here

Then start the app and open http://localhost:3000:

    npm run dev

## API

| Endpoint | What it does |
| --- | --- |
| `GET /api/catalog` | Titles, with optional `genre`, `provider` and `type` filters |
| `GET /api/wallet` | Token balance, plan and watch history |
| `POST /api/watch` | Spend tokens on a title |
| `POST /api/plan` | Switch between the Standard and Premium plans |
| `POST /api/topup` | Buy single tokens at $1.50 each (mock payment) |
| `POST /api/chat` | Gemini assistant with tool calling |
| `POST /api/optimize` | Cheapest plan for a wishlist |
| `GET /api/budget` | AI monthly budget plan |

Full request and response shapes are in `CONTRACT.md`.

## Team

- **Vanshita:** frontend, mock data, wallet and watch endpoints
- **Iqra:** Gemini integration, AI endpoints, deployment

## What we would build next

- Save wallets and history in Firestore, with sign-in
- Real provider integrations and household sharing
- Gemini with Search grounding for what is trending on each service