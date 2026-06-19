# OpenRouter Chat

A lightweight Node.js proxy server and browser-based chat UI that connects to the [OpenRouter](https://openrouter.ai) API. OpenRouter provides a unified interface to hundreds of language models (OpenAI, Anthropic, Google, Meta, Mistral, and more) through a single OpenAI-compatible endpoint.

## Features

- **Model selector** — choose from every model available on your OpenRouter account; the list is loaded dynamically on startup
- **Streaming responses** — assistant replies stream token-by-token via Server-Sent Events
- **Markdown rendering** — assistant messages are rendered as formatted HTML (headings, lists, code blocks, tables, blockquotes) via [marked](https://marked.js.org/) with [DOMPurify](https://github.com/cure53/DOMPurify) sanitization
- **System prompt** — optional, collapsible system prompt applied to every request in the session
- **Multi-turn conversation** — full message history is maintained in the browser and sent on each request
- **Image generation** — separate page for generating, describing, and improving prompts for images via OpenRouter image models
- **Error handling** — maps API error codes (invalid key, no credits, rate limits, etc.) to plain-language messages
- **Key via URL** — no server-side secrets; each user supplies their own API key in the URL

## Requirements

- Node.js 18 or later (built-in `fetch` is required)
- An [OpenRouter](https://openrouter.ai) API key

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the server (with live reload)
npm run dev

# 3. Open the app — replace YOUR_KEY with your OpenRouter key
open http://localhost:1515/chat.html?key=YOUR_KEY
```

For production:

```bash
npm start
```

The port defaults to `3000` and can be overridden with a `PORT` environment variable or in `.env`:

```ini
PORT=1515
```

## Pages

### `/chat.html` — Chat interface

The main chat application. Requires a `key` URL parameter containing your OpenRouter API key.

```
http://localhost:1515/chat.html?key=YOUR_KEY
```

If no key is present the page replaces itself with an instruction screen. Assistant responses are rendered as formatted markdown (headings, lists, fenced code blocks with syntax-aware theming, tables, blockquotes).

### `/image.html` — Image tools

Three image-related tools in one page: **Generate Image**, **Image to Prompt**, and **Improve Prompt**. Requires the same `key` URL parameter and links back to the chat page preserving the key.

```
http://localhost:1515/image.html?key=YOUR_KEY
```

### `/key.html` — API key entry

A standalone form that accepts a key and redirects to the chat page with `?key=` appended. Not linked from the main application — share this URL with users who need a guided entry point.

```
http://localhost:1515/key.html
```

### `/credits.html` — API key details

Shows details for the key passed in the URL, fetched from `GET https://openrouter.ai/api/v1/key`. Displays label, credit limit, remaining credits, limit reset cadence, all-time/daily/weekly/monthly usage (regular and BYOK), free-tier status, and whether BYOK usage counts toward the limit.

```
http://localhost:1515/credits.html?key=YOUR_KEY
```

## Project structure

```
magnific-forwarding/
├── server.js          # Express proxy server
├── package.json
├── .env               # PORT override (optional)
├── .env.example
└── public/
    ├── chat.html      # Chat UI
    ├── chat.js        # Chat client JS
    ├── image.html     # Image tools UI (generate / image-to-prompt / improve)
    ├── key.html       # Standalone API key entry page
    ├── credits.html   # API key details & usage page
    ├── app.js         # Image tools client JS
    └── style.css      # Shared styles
```

## How the API key works

The key is read from `?key=` in the browser URL. The frontend attaches it as an `x-api-key` header on every request to the local server. The server converts it to `Authorization: Bearer <key>` before forwarding to OpenRouter. The key is never written to disk or logged.

Because multiple users each supply their own key, a single running server instance can serve many users simultaneously.

## Backend API routes

All routes require the `x-api-key` request header.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/models` | Returns the list of models available to the key, proxied from `GET https://openrouter.ai/api/v1/models` |
| `POST` | `/api/chat` | Streams a chat completion, proxied from `POST https://openrouter.ai/api/v1/chat/completions` |

### `/api/chat` request body

```json
{
  "model": "openai/gpt-4o",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "system": "You are a helpful assistant."
}
```

`system` is optional. When provided it is prepended as a `system` role message before `messages`. The server always requests `"stream": true` from OpenRouter and forwards the SSE response directly to the browser.

### Streaming format

The server passes through OpenRouter's SSE stream unchanged. Each event is a standard OpenAI-compatible chunk:

```
data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}

data: [DONE]
```

Errors that arrive inside the stream (e.g. mid-generation quota exhaustion) include an `error` field and are surfaced to the user by the frontend.

## Error handling

HTTP error codes from OpenRouter are forwarded to the browser. The frontend maps them to user-readable messages:

| Status | Message shown |
|--------|---------------|
| 401 | Invalid or missing API key |
| 402 | Insufficient credits — add credits at openrouter.ai |
| 403 | Access denied |
| 400 / 422 | Bad request — surfaces the API's own message |
| 429 | Rate limit reached, retry shortly |
| 500 | OpenRouter internal error |
| 502 / 503 / 504 | Service temporarily unavailable |

## Model loading

On startup the frontend fetches `/api/models` and populates the model selector, grouping models by provider. While the request is in flight a curated fallback list of seven popular models is shown so the user can start chatting immediately. If the fetch fails, the fallback list remains.

## License

See [LICENSE](LICENSE).
