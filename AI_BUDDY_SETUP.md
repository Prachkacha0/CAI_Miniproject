# AI Buddy with Typhoon API

Hardware Quest uses a same-origin server endpoint at `/api/ai-chat`. The browser never receives the Typhoon API key. In production, Vercel runs `api/ai-chat.ts` as a serverless function. During local development, the Vite middleware in `vite.config.ts` exposes the same endpoint.

## 1. Get a Typhoon API key

Create an API key in the [Typhoon Playground](https://playground.opentyphoon.ai/api-key). The integration follows the official [Typhoon API reference](https://docs.opentyphoon.ai/en/api-reference/) and sends requests to `POST https://api.opentyphoon.ai/v1/chat/completions`.

## 2. Local development

Copy `.env.example` to `.env.local`, then set the key:

```env
TYPHOON_API_KEY=your_real_key_here
TYPHOON_MODEL=typhoon-v2.5-30b-a3b-instruct
```

Run the project:

```powershell
npm.cmd run dev
```

Open `http://localhost:3001`. Sign in, open AI Buddy, select **ถาม AI**, and send a hardware question.

## 3. Vercel production

In the Vercel project:

1. Open **Settings → Environment Variables**.
2. Add `TYPHOON_API_KEY` with the real key for Production and Preview.
3. Optionally add `TYPHOON_MODEL=typhoon-v2.5-30b-a3b-instruct`.
4. Redeploy the latest commit.

Do not create a `VITE_TYPHOON_API_KEY` variable. Variables beginning with `VITE_` are bundled into browser code and would expose the key.

## Behavior and safeguards

- AI Buddy answers in Thai and receives the current mission context.
- It gives guided hints for assessment activities instead of direct answers.
- If the Typhoon key is missing or the upstream API is temporarily unavailable, it automatically uses the built-in hardware guide so students can continue learning. It returns to Typhoon automatically when the API is available.
- The client sends at most ten recent messages; each user message is limited to 600 characters.
- The server validates input, accepts same-origin requests, applies limits per browser and per shared IP, hides upstream error details, and stops requests after 25 seconds.
- The fallback response identifies itself with the model name `hardware-quest-offline-guide`, making it easy to distinguish from a Typhoon response during testing.
