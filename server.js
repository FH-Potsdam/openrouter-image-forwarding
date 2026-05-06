import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const BASE = 'https://openrouter.ai/api/v1';

app.use(cors());
app.use(express.json({ limit: '20mb' })); // base64 images

// All routes (static + API) are served under /images
const router = express.Router();
app.use('/images', express.static(join(__dirname, 'public')));
app.use('/images', router);

function getKey(req, res) {
  const key = req.headers['x-api-key'];
  if (!key) { res.status(401).json({ error: { message: 'Missing x-api-key header' } }); return null; }
  return key;
}

function orHeaders(key) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
}

// Resize a base64 data URL image so its longest edge is ≤ maxDimension.
// HTTPS URLs are passed through unchanged.
async function resizeBase64Image(dataUrl, maxDimension = 1024) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
  if (!match) return dataUrl;
  const buffer = Buffer.from(match[2], 'base64');
  const img = sharp(buffer);
  const { width, height } = await img.metadata();
  if (width <= maxDimension && height <= maxDimension) return dataUrl;
  const resized = await img
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return `data:image/jpeg;base64,${resized.toString('base64')}`;
}

async function parseJSON(r) {
  try { return await r.json(); }
  catch { return { error: { message: `Unexpected response (HTTP ${r.status})` } }; }
}

// Stream an upstream SSE response straight through to the client.
async function pipeSSE(req, res, upstream) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  req.on('close', () => reader.cancel());
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value, { stream: true }));
  }
  res.end();
}

// ── Models ────────────────────────────────────────────────────────────────────

router.get('/api/models', async (req, res) => {
  const key = getKey(req, res);
  if (!key) return;
  try {
    const up = await fetch(`${BASE}/models`, { headers: orHeaders(key) });
    const body = await parseJSON(up);
    if (!up.ok) console.error('[/api/models] HTTP', up.status, body);
    res.status(up.status).json(body);
  } catch (err) {
    res.status(502).json({ error: { message: `Could not reach OpenRouter: ${err.message}` } });
  }
});

// ── Generate image ────────────────────────────────────────────────────────────
// Uses chat/completions with modalities:["image"].
// Optionally accepts a reference image (base64 data URL or https URL) for img2img.

router.post('/api/generate-image', async (req, res) => {
  const key = getKey(req, res);
  if (!key) return;
  const { prompt, model, aspect_ratio, reference_image } = req.body;

  const refImage = reference_image ? await resizeBase64Image(reference_image) : null;
  const content = refImage
    ? [
        { type: 'image_url', image_url: { url: refImage } },
        { type: 'text', text: prompt },
      ]
    : prompt;

  const body = {
    model,
    messages: [{ role: 'user', content }],
    modalities: ['image'],
  };
  if (aspect_ratio) body.image_config = { aspect_ratio };

  try {
    const up = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(key),
      body: JSON.stringify(body),
    });
    const data = await parseJSON(up);
    if (!up.ok) console.error('[/api/generate-image] HTTP', up.status, data);
    res.status(up.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: `Could not reach OpenRouter: ${err.message}` } });
  }
});

// ── Image to prompt ───────────────────────────────────────────────────────────
// System prompt is embedded here — not exposed to the user.

const IMAGE_TO_PROMPT_SYSTEM =
  `You are an expert at analysing images and writing prompts for AI image generators. ` +
  `Given an image, write a single comprehensive generation prompt that would allow an AI to ` +
  `recreate a visually similar image. Cover: subject, composition, style, colour palette, ` +
  `lighting, mood, and relevant technical keywords (e.g. "cinematic lighting", "8k", ` +
  `"photorealistic"). Return only the prompt — no explanation, no preamble, no quotation marks.`;

router.post('/api/image-to-prompt', async (req, res) => {
  const key = getKey(req, res);
  if (!key) return;
  const { image, model } = req.body;

  try {
    const resizedImage = await resizeBase64Image(image);
    const up = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(key),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: IMAGE_TO_PROMPT_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: resizedImage } },
              { type: 'text', text: 'Generate the image generation prompt.' },
            ],
          },
        ],
        stream: true,
      }),
    });

    if (!up.ok) {
      const body = await parseJSON(up);
      console.error('[/api/image-to-prompt] HTTP', up.status, body);
      return res.status(up.status).json(body);
    }
    await pipeSSE(req, res, up);
  } catch (err) {
    if (!res.headersSent)
      res.status(502).json({ error: { message: `Could not reach OpenRouter: ${err.message}` } });
    else res.end();
  }
});

// ── Improve prompt ────────────────────────────────────────────────────────────

const IMPROVE_PROMPT_SYSTEM =
  `You are an expert prompt engineer for AI image generation. ` +
  `Transform the user's rough description into a rich, detailed prompt for tools like ` +
  `DALL-E, Midjourney, or Stable Diffusion. Add: specific visual details and composition, ` +
  `art or photographic style, lighting and atmosphere, colour palette, mood, and quality ` +
  `modifiers (e.g. "highly detailed", "4k", "award-winning photograph"). ` +
  `Return only the improved prompt as a single paragraph. No explanation, no alternatives, no preamble.`;

router.post('/api/improve-prompt', async (req, res) => {
  const key = getKey(req, res);
  if (!key) return;
  const { prompt, model } = req.body;

  try {
    const up = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(key),
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: IMPROVE_PROMPT_SYSTEM },
          { role: 'user', content: prompt },
        ],
        stream: true,
      }),
    });

    if (!up.ok) {
      const body = await parseJSON(up);
      console.error('[/api/improve-prompt] HTTP', up.status, body);
      return res.status(up.status).json(body);
    }
    await pipeSSE(req, res, up);
  } catch (err) {
    if (!res.headersSent)
      res.status(502).json({ error: { message: `Could not reach OpenRouter: ${err.message}` } });
    else res.end();
  }
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large')
    return res.status(413).json({ error: { message: 'Image too large. Please use a smaller file.' } });
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
