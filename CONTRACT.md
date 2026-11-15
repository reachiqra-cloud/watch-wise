# API Contract

> Agreement between **Person A (frontend + data)** and **Person B (AI + backend)**.
> Person A builds screens against these shapes. Person B builds endpoints that return them.
> **If you need to change anything here, tell the other person first, then update this file in the same commit.**

Project name: `[WatchWise]`

---

## 1. Ground rules

- All endpoints live under `/api/` and return **JSON**.
- All requests and responses use **camelCase** field names.
- IDs are **strings** (`"t014"`, `"u001"`), never numbers.
- Token amounts are **numbers** and can be fractional (`0.5`).
- **Money:** Standard plan is `$25/month = 20 tokens` (with ads). Premium plan is `$30/month = 20 tokens` (no ads). Single tokens cost `$1.50` each.
- Person A can build against **fake responses** in these exact shapes until Person B's endpoint is live.
- The Gemini API key lives **only on the server** (`.env.local`). The frontend never sees it.

### Standard error shape

Any endpoint can fail. On failure, return a non-200 status and:

```json
{
  "error": {
    "code": "INSUFFICIENT_TOKENS",
    "message": "You need 2 tokens but only have 1.5."
  }
}
```

| code                  | HTTP status | meaning                                      |
| --------------------- | ----------- | -------------------------------------------- |
| `BAD_REQUEST`         | 400         | missing or invalid input                     |
| `NOT_FOUND`           | 404         | title id doesn't exist                       |
| `INSUFFICIENT_TOKENS` | 400         | balance too low                              |
| `AI_ERROR`            | 502         | Gemini failed or returned something unusable |
| `INTERNAL`            | 500         | anything else                                |

The frontend shows `error.message` to the user, so write it in plain English.

---

## 2. Shared data types

### Title

```json
{
  "id": "t014",
  "title": "Superbad",
  "provider": "Netflix",
  "type": "movie",
  "genre": ["comedy"],
  "runtimeMinutes": 113,
  "isNewRelease": false,
  "tokenCost": 1,
  "episodeCount": null
}
```

| field            | type           | notes                                                                |
| ---------------- | -------------- | -------------------------------------------------------------------- |
| `id`             | string         | unique                                                               |
| `title`          | string         |                                                                      |
| `provider`       | string         | `"Netflix"`, `"Prime Video"`, `"Disney+"`, `"Hulu"`, ... (mock data) |
| `type`           | string         | `"episode"`, `"movie"`, or `"season"`                                |
| `genre`          | string[]       | lowercase                                                            |
| `runtimeMinutes` | number         | for a season, total runtime                                          |
| `isNewRelease`   | boolean        |                                                                      |
| `tokenCost`      | number         | see pricing table below                                              |
| `episodeCount`   | number or null | only for `type: "season"`, otherwise `null`                          |

### Token pricing (fixed, not decided by AI)

| content               | tokens                                                              |
| --------------------- | ------------------------------------------------------------------- |
| Short episode         | 0.5                                                                 |
| Standard movie        | 1                                                                   |
| Premium / new release | 2                                                                   |
| Full season (bundle)  | cheaper than `episodeCount x 0.5` (set per title in `catalog.json`) |

### HistoryEntry

```json
{
  "titleId": "t003",
  "title": "The Bear S1E1",
  "tokensSpent": 0.5,
  "watchedAt": "2026-11-02T20:15:00Z"
}
```

---

## 3. Endpoints

### `GET /api/catalog`

Returns the list of titles. Optional query params for filtering: `genre`, `provider`, `type`.

**Example request:** `GET /api/catalog?genre=comedy&provider=Netflix`

**Response 200:**

```json
{
  "titles": [
    {
      "id": "t014",
      "title": "Superbad",
      "provider": "Netflix",
      "type": "movie",
      "genre": ["comedy"],
      "runtimeMinutes": 113,
      "isNewRelease": false,
      "tokenCost": 1,
      "episodeCount": null
    }
  ]
}
```

**Owner:** Person A (serves `catalog.json`).

---

### `GET /api/wallet`

Returns the current user's token balance and watch history.

**Response 200:**

```json
{
  "userId": "u001",
    "plan": {
    "id": "standard",
    "name": "Standard",
    "pricePerMonth": 25,
    "tokensPerMonth": 20,
    "hasAds": true
  },
  "balance": 14.5,
  "history": [
    {
      "titleId": "t003",
      "title": "The Bear S1E1",
      "tokensSpent": 0.5,
      "watchedAt": "2026-11-02T20:15:00Z"
    }
  ]
}
```

**Owner:** Person A for the mock version. Person B swaps in Firestore later if time allows. The response shape must not change.

---

### `POST /api/watch`

"Watch" a title. Deducts tokens and adds a history entry.

**Request:**

```json
{ "titleId": "t014" }
```

**Response 200:**

```json
{
  "balance": 13.5,
  "entry": {
    "titleId": "t014",
    "title": "Superbad",
    "tokensSpent": 1,
    "watchedAt": "2026-11-14T19:30:00Z"
  }
}
```

**Errors:** `NOT_FOUND` if the title doesn't exist, `INSUFFICIENT_TOKENS` if balance is too low.

**Owner:** Person A.

---
### `POST /api/plan`

Switch the user's plan. Does not change the token balance.

**Request:**

    { "planId": "premium" }

`planId` is `"standard"` ($25/month, 20 tokens, with ads) or `"premium"` ($30/month, 20 tokens, no ads).

**Response 200:**

    {
      "plan": { "id": "premium", "name": "Premium", "pricePerMonth": 30, "tokensPerMonth": 20, "hasAds": false },
      "balance": 20
    }

**Errors:** `BAD_REQUEST` if `planId` is missing, `NOT_FOUND` if the plan doesn't exist.

**Owner:** Person A.

---

### `POST /api/topup`

Buy single tokens at $1.50 each (mock payment). Adds to the balance.

**Request:**

    { "tokens": 5 }

`tokens` is a whole number from 1 to 50.

**Response 200:**

    { "balance": 25, "tokensAdded": 5, "charged": 7.5 }

**Errors:** `BAD_REQUEST` if `tokens` is not a whole number from 1 to 50.

**Owner:** Person A.

---
### `POST /api/chat`

The Gemini entertainment assistant. The user describes what they want; Gemini uses tools to check the catalogue, wallet, and history, then recommends titles it knows the user can afford.

**Request:**

```json
{
  "message": "Something funny for date night, under 2 hours, I only have 3 tokens left",
  "history": [
    { "role": "user", "text": "hi" },
    { "role": "assistant", "text": "Hi! What are you in the mood for?" }
  ]
}
```

`history` is optional and holds previous chat messages so Gemini keeps context. The frontend sends the whole conversation each time.

**Response 200:**

```json
{
  "reply": "Try Superbad (1 token, 113 min). It's a crowd-pleaser, and you'd still have 2.5 tokens left.",
  "recommendedTitles": ["t014", "t022"],
  "tokensAfter": 2.5
}
```

| field               | notes                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `reply`             | the assistant's message, plain text                                                               |
| `recommendedTitles` | array of title ids from the catalogue (the frontend renders these as cards). Empty array if none. |
| `tokensAfter`       | optional: balance if the user watches the top pick. `null` if not applicable.                     |

**Rule:** `recommendedTitles` must only contain ids that exist in the catalogue.

**Owner:** Person B.

---

### `POST /api/optimize`

Takes a wishlist and returns the cheapest way to spend tokens on it (for example, a season bundle instead of individual episodes). **The token math is computed in code; Gemini picks the strategy and writes the explanation.**

**Request:**

```json
{
  "wishlist": ["t003", "t004", "t005", "t031"]
}
```

**Response 200:**

```json
{
  "plan": [
    {
      "action": "buy_season_bundle",
      "titleId": "s010",
      "title": "The Bear Season 1",
      "tokenCost": 3.5,
      "replaces": ["t003", "t004", "t005"],
      "tokensSaved": 1
    },
    {
      "action": "watch_single",
      "titleId": "t031",
      "title": "Dune: Part Two",
      "tokenCost": 2,
      "replaces": [],
      "tokensSaved": 0
    }
  ],
  "totalCost": 5.5,
  "costIfBoughtIndividually": 6.5,
  "tokensSaved": 1,
  "canAfford": true,
  "balanceAfter": 9,
  "explanation": "Bundling the first three Bear episodes saves you a full token compared with watching them one at a time."
}
```

| `action` value      | meaning                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `buy_season_bundle` | use the discounted season bundle                                     |
| `watch_single`      | watch it individually                                                |
| `skip`              | not affordable or not worth it (include the reason in `explanation`) |

**Owner:** Person B.

---

### `GET /api/budget`

Gemini analyzes the user's viewing history and token usage and returns a personalized monthly plan.

**Response 200:**

```json
{
  "summary": "You watch mostly comedies and short episodes, averaging about 14 tokens a month.",
  "projectedUsage": [
    { "week": "Week 1", "tokens": 4 },
    { "week": "Week 2", "tokens": 3.5 },
    { "week": "Week 3", "tokens": 4 },
    { "week": "Week 4", "tokens": 3 }
  ],
  "projectedMonthlyTokens": 14.5,
  "suggestedTier": {
    "name": "Lite",
    "pricePerMonth": 18,
    "tokensPerMonth": 15,
    "monthlySavings": 7
  },
  "tips": [
    "Switch to season bundles for The Bear to save about 1 token.",
    "You have unused tokens most months, so the Lite tier fits better."
  ]
}
```

**Owner:** Person B.

---

## 4. Who owns what

|                                             | Person A | Person B |
| ------------------------------------------- | -------- | -------- |
| Pages, components, styling                  | yes      |          |
| `catalog.json`, mock user data              | yes      |          |
| `/api/catalog`, `/api/wallet`, `/api/watch` | yes      |          |
| `/api/chat`, `/api/optimize`, `/api/budget` |          | yes      |
| Gemini setup, prompts, tools (`lib/`)       |          | yes      |
| Firebase Auth / Firestore (stretch)         |          | yes      |
| Deploy                                      |          | yes      |
| README, slides, demo                        | both     | both     |

**Folder split (to avoid merge conflicts):**

- Person A edits: `app/` pages, `components/`, `data/`
- Person B edits: `app/api/chat`, `app/api/optimize`, `app/api/budget`, `lib/`

If you need to edit a file the other person owns, message them first.

---

## 5. Changing this contract

1. Message the other person: "I want to change X in endpoint Y."
2. Agree.
3. Update this file **and** the code in the same commit.
4. Pull before you start your next task.

---

## 6. Sign-off

- [Y] Person A has read and agrees
- [Y] Person B has read and agrees
