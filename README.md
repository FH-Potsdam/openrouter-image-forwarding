# OpenRouter Chat

A lightweight Node.js proxy server and browser-based chat UI that connects to the [OpenRouter](https://openrouter.ai) API. OpenRouter provides a unified interface to hundreds of language models (OpenAI, Anthropic, Google, Meta, Mistral, and more) through a single OpenAI-compatible endpoint.

## Features

- **Model selector** — choose from every model available on your OpenRouter account; the list is loaded dynamically on startup
- **Streaming responses** — assistant replies stream token-by-token via Server-Sent Events
- **Markdown rendering** — assistant messages are rendered as formatted HTML (headings, lists, code blocks, tables, blockquotes) via [marked](https://marked.js.org/) with [DOMPurify](https://github.com/cure53/DOMPurify) sanitization
- **Structured system prompt** — Name, Role, Tonality, and Task fields compose into a structured markdown system prompt; Name is UI-only and never sent to the model
- **Settings export/import** — save the system prompt fields and generation parameters to a JSON file (named after the Name field) and restore them later
- **Parameter info boxes** — tap-to-toggle inline explanations for each generation parameter (temperature, top P, penalties, max tokens, top K, seed), usable on touch and desktop
- **Speech output** — reads assistant responses aloud via the Web Speech API, with voice, rate, and pitch controls persisted in localStorage
- **Multi-chat history** — conversations are saved to a sidebar (localStorage-backed); start, switch between, and delete chats independently
- **Multi-turn conversation** — full message history is maintained in the browser and sent on each request
- **Conversation download** — export the current conversation as plain text or JSON, and clear it from the chat header
- **Image generation** — separate page with three tools: **Generate Image** (text-to-image, with optional aspect ratio and a reference image for img2img), **Image to Prompt** (describe an uploaded image as a generation prompt), and **Improve Prompt** (expand a rough prompt into a detailed one)
- **Reference image handling** — drag-and-drop or file-picker upload, a pasted image URL, or reusing a previously generated image as a reference, all sharing one removable preview box
- **Localization** — EN/DE language toggle available on every page, driven by `public/i18n.js`
- **Error handling** — maps API error codes (invalid key, no credits, rate limits, etc.) to plain-language messages
- **Key via URL** — no server-side secrets; each user supplies their own API key in the URL
- **Privacy notice** — a data-protection modal is shown on every page load of the chat and image tools, informing users that nothing is persisted beyond the browser session

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
open http://localhost:3000/images/chat.html?key=YOUR_KEY
```

For production:

```bash
npm start
```

The port defaults to `3000` and can be overridden with a `PORT` environment variable or in `.env`:

```ini
PORT=1515
```

All pages and API routes are served under the `/images` base path (see [Project structure](#project-structure)), so a page always looks like `http://localhost:<PORT>/images/<page>.html`.

`npm run open:key` / `npm run dev:open` instead open `public/key.html` directly through VS Code Live Server on port `5500`; in that setup, point `public/config.js`'s `BASE_PATH` at the running backend (e.g. `http://localhost:3000/images`).

## Pages

### `/images/chat.html` — Chat interface

The main chat application. Requires a `key` URL parameter containing your OpenRouter API key.

```
http://localhost:3000/images/chat.html?key=YOUR_KEY
```

If no key is present the page replaces itself with an instruction screen. Assistant responses are rendered as formatted markdown (headings, lists, fenced code blocks with syntax-aware theming, tables, blockquotes).

Conversations are listed in a sidebar and persisted to localStorage; you can start a new chat, switch between saved chats, or delete one independently of the others.

The system prompt is composed from four fields — **Name** (UI-only, shown in the chat but never sent to the model), **Role**, **Tonality**, and **Task** — merged into a structured markdown prompt sent with every request. These fields, along with the generation parameters, can be saved to and restored from a JSON file via the Export/Import buttons in settings. Each generation parameter has a tap-to-toggle info button with an inline explanation.

Assistant replies can be read aloud via the speech-output toggle in the chat header, with voice, rate, and pitch configurable in a dedicated settings section. Conversations can be downloaded as text or JSON, or cleared, from the chat header.

### `/images/image.html` — Image tools

Three image-related tools in one page: **Generate Image**, **Image to Prompt**, and **Improve Prompt**. Requires the same `key` URL parameter and links back to the chat page preserving the key.

```
http://localhost:3000/images/image.html?key=YOUR_KEY
```

The reference image used for img2img generation can come from an uploaded file (drag-and-drop or file picker), a pasted image URL, or a previous result reused as a reference — all sharing one preview box with a Remove button that clears whichever source is active.

### `/images/key.html` — API key entry

A standalone form that accepts an API key. After submitting, the user chooses where to go: **Images** opens `/images/image.html` and **Chat** opens `/images/chat.html`, both with `?key=` appended. Not linked from the main application — share this URL with users who need a guided entry point.

```
http://localhost:3000/images/key.html
```

### `/images/credits.html` — API key details

Shows details for the key passed in the URL, fetched directly from the browser via `GET https://openrouter.ai/api/v1/key` (not proxied through the local server). Displays label, credit limit, remaining credits, limit reset cadence, all-time/daily/weekly/monthly usage (regular and BYOK), free-tier status, and whether BYOK usage counts toward the limit.

```
http://localhost:3000/images/credits.html?key=YOUR_KEY
```

## Project structure

```
magnific-forwarding/
├── server.js          # Express proxy server (serves everything under /images)
├── package.json
├── .env               # PORT override (optional)
├── .env.example
└── public/
    ├── chat.html          # Chat UI
    ├── chat.js            # Chat client JS
    ├── image.html         # Image tools UI (generate / image-to-prompt / improve)
    ├── app.js             # Image tools client JS
    ├── key.html           # Standalone API key entry page
    ├── credits.html       # API key details & usage page
    ├── i18n.js            # EN/DE strings and language-toggle logic, shared by all pages
    ├── config.js          # Runtime config (BASE_PATH used by app.js / chat.js)
    ├── privacy-modal.js   # Privacy/data-protection modal (shown on every session start)
    ├── style.css          # Shared styles
    └── assets/            # Static images (e.g. logo)
```

## How the API key works

The key is read from `?key=` in the browser URL. The frontend attaches it as an `x-api-key` header on every request to the local server. The server converts it to `Authorization: Bearer <key>` before forwarding to OpenRouter. The key is never written to disk or logged.

Because multiple users each supply their own key, a single running server instance can serve many users simultaneously.

## Backend API routes

All routes are mounted under `/images` and require the `x-api-key` request header.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/images/api/models` | Returns the list of models available to the key, proxied from `GET https://openrouter.ai/api/v1/models` |
| `POST` | `/images/api/chat` | Streams a chat completion, proxied from `POST https://openrouter.ai/api/v1/chat/completions` |
| `POST` | `/images/api/generate-image` | Generates an image via `chat/completions` with `modalities: ["image"]`; accepts an optional `reference_image` (base64 data URL or HTTPS URL) for img2img and an optional `aspect_ratio` |
| `POST` | `/images/api/image-to-prompt` | Streams a generated prompt describing an uploaded image, using a fixed server-side system prompt |
| `POST` | `/images/api/improve-prompt` | Streams an expanded, detailed version of a rough prompt, using a fixed server-side system prompt |

Any base64 reference/uploaded image is resized server-side (via `sharp`) so its longest edge is ≤ 1024px before being sent to OpenRouter; HTTPS image URLs are passed through unchanged. The JSON body limit is 20 MB to accommodate base64 images.

### `/images/api/chat` request body

```json
{
  "model": "openai/gpt-4o",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 0.7,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "max_tokens": 1024,
  "top_k": 0,
  "seed": 0
}
```

`messages` carries the full conversation, including the composed system prompt as a leading `system`-role message when one is set — the server does not build the system prompt itself, it forwards `messages` as given. The sampler fields (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `max_tokens`, `top_k`, `seed`) are all optional and only forwarded when present. The server always requests `"stream": true` from OpenRouter and forwards the SSE response directly to the browser.

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
| 413 | Image too large — returned by the local server when the request body exceeds the 20 MB limit |

## Model loading

On startup the frontend fetches `/images/api/models` and populates the model selector, grouping models by provider. While the request is in flight a curated fallback list of seven popular models is shown so the user can start chatting immediately. If the fetch fails, the fallback list remains.

## License

See [LICENSE](LICENSE).
