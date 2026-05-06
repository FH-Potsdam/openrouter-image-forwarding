// ─── API key from URL param ────────────────────────────────────────────────────

const BASE_PATH = '/images';

const params = new URLSearchParams(location.search);
const API_KEY = params.get('key') ?? '';

if (!API_KEY) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                height:100dvh;gap:16px;font-family:system-ui,sans-serif;color:#444;padding:24px;text-align:center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c5af5" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <h2 style="font-size:18px;font-weight:600">API key required</h2>
      <p style="font-size:14px;max-width:360px;line-height:1.6">
        Open this app with your OpenRouter API key as a URL parameter:<br><br>
        <code style="background:#f4f4f8;padding:4px 8px;border-radius:4px;font-size:13px">?key=YOUR_OPENROUTER_API_KEY</code>
      </p>
    </div>`;
  throw new Error('No API key — stopping init.');
}

function apiHeaders() {
  return { 'Content-Type': 'application/json', 'x-api-key': API_KEY };
}

// ─── Last generated image ─────────────────────────────────────────────────────

let lastImage      = null; // data URL of the most recently generated image
let genUsingLast   = false;
let i2pUsingLast   = false;

function setLastImage(url) {
  lastImage = url;

  // Show the option in both forms and update thumbnails
  for (const prefix of ['gen', 'i2p']) {
    const wrap  = document.getElementById(`${prefix}-last-wrap`);
    const thumb = document.getElementById(`${prefix}-last-thumb`);
    if (!wrap) continue;
    thumb.src   = url;
    wrap.hidden = false;
  }
}

function setGenUsingLast(active) {
  genUsingLast = active;
  document.getElementById('btn-use-last-gen').classList.toggle('active', active);
  document.getElementById('btn-use-last-gen').textContent = active ? 'Selected ✓' : 'Use as reference';
  // deselect file input when switching to last image
  if (active) {
    document.getElementById('gen-ref-file').value = '';
    document.getElementById('gen-ref-preview').innerHTML = '';
  }
}

function setI2pUsingLast(active) {
  i2pUsingLast = active;
  document.getElementById('btn-use-last-i2p').classList.toggle('active', active);
  document.getElementById('btn-use-last-i2p').textContent = active ? 'Selected ✓' : 'Use this image';
  if (active) {
    document.getElementById('i2p-file').value = '';
    document.getElementById('i2p-preview').innerHTML = '';
    document.getElementById('i2p-url').value = '';
  }
}

// ─── Tab switching ─────────────────────────────────────────────────────────────

function activateTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  const next = new URLSearchParams(location.search);
  next.set('key', API_KEY);
  next.set('tab', name);
  history.replaceState(null, '', `?${next}`);
}

document.querySelectorAll('.tab').forEach(btn =>
  btn.addEventListener('click', () => activateTab(btn.dataset.tab))
);

const initialTab = params.get('tab');
if (initialTab && document.getElementById(`panel-${initialTab}`)) activateTab(initialTab);

// ─── Model loading ─────────────────────────────────────────────────────────────

// Fallbacks shown while the API loads, keyed by required output/input modality.
const FALLBACK = {
  image_out: [
    { id: 'google/gemini-2.0-flash-001',       name: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-2.0-flash-exp:free',   name: 'Gemini 2.0 Flash (free)' },
  ],
  image_in: [
    { id: 'openai/gpt-4o',                       name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini',                  name: 'GPT-4o mini' },
    { id: 'anthropic/claude-opus-4',             name: 'Claude Opus 4' },
    { id: 'anthropic/claude-sonnet-4-5',         name: 'Claude Sonnet 4.5' },
    { id: 'google/gemini-2.0-flash-001',         name: 'Gemini 2.0 Flash' },
  ],
  text: [
    { id: 'openai/gpt-4o',                       name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini',                  name: 'GPT-4o mini' },
    { id: 'anthropic/claude-opus-4',             name: 'Claude Opus 4' },
    { id: 'anthropic/claude-sonnet-4-5',         name: 'Claude Sonnet 4.5' },
    { id: 'google/gemini-2.0-flash-001',         name: 'Gemini 2.0 Flash' },
    { id: 'meta-llama/llama-3.3-70b-instruct',   name: 'Llama 3.3 70B' },
    { id: 'mistralai/mistral-large',             name: 'Mistral Large' },
  ],
};

function fillSelect(selectEl, models, preferred) {
  // Group by provider prefix
  const groups = {};
  for (const m of models) {
    const provider = m.id.split('/')[0];
    (groups[provider] ??= []).push(m);
  }
  selectEl.innerHTML = '';
  for (const provider of Object.keys(groups).sort()) {
    const og = document.createElement('optgroup');
    og.label = provider;
    for (const m of groups[provider].sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id))) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name ?? m.id;
      og.appendChild(opt);
    }
    selectEl.appendChild(og);
  }
  if (preferred) {
    const opt = selectEl.querySelector(`option[value="${preferred}"]`);
    if (opt) opt.selected = true;
  }
  selectEl.disabled = false;
}

// Populate immediately from fallbacks, then replace with live data.
fillSelect(document.getElementById('gen-model'),  FALLBACK.image_out, 'google/gemini-2.0-flash-001');
fillSelect(document.getElementById('i2p-model'),  FALLBACK.image_in,  'openai/gpt-4o');
fillSelect(document.getElementById('ip-model'),   FALLBACK.text,      'openai/gpt-4o');

(async () => {
  try {
    const res = await fetch(`${BASE_PATH}/api/models`, { headers: apiHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const all = data?.data ?? [];

    const imageOut = all.filter(m => m.architecture?.output_modalities?.includes('image'));
    const imageIn  = all.filter(m => m.architecture?.input_modalities?.includes('image'));
    const textOnly = all.filter(m =>
      m.architecture?.output_modalities?.includes('text') &&
      !m.architecture?.output_modalities?.includes('image')
    );

    if (imageOut.length) fillSelect(document.getElementById('gen-model'), imageOut, 'google/gemini-2.0-flash-001');
    if (imageIn.length)  fillSelect(document.getElementById('i2p-model'), imageIn,  'openai/gpt-4o');
    if (textOnly.length) fillSelect(document.getElementById('ip-model'),  textOnly, 'openai/gpt-4o');
  } catch (err) {
    console.warn('Model fetch failed, using fallbacks:', err.message);
  }
})();

// ─── File / drop zone helpers ──────────────────────────────────────────────────

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function previewFile(file, previewEl) {
  previewEl.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="preview" />`;
}

function initDropZone(zoneId, inputId, previewId) {
  const zone    = document.getElementById(zoneId);
  const input   = document.getElementById(inputId);
  const preview = previewId ? document.getElementById(previewId) : null;
  if (!zone) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file && input) {
      const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
      if (preview) previewFile(file, preview);
    }
  });
  if (input && preview) {
    input.addEventListener('change', () => { if (input.files[0]) previewFile(input.files[0], preview); });
  }
}

initDropZone('gen-drop',  'gen-ref-file', 'gen-ref-preview');
initDropZone('i2p-drop',  'i2p-file',     'i2p-preview');

// Deselect "use last" when a real file is chosen
document.getElementById('gen-ref-file').addEventListener('change', () => { if (genUsingLast) setGenUsingLast(false); });
document.getElementById('i2p-file').addEventListener('change',     () => { if (i2pUsingLast) setI2pUsingLast(false); });
document.getElementById('i2p-url').addEventListener('input',       () => { if (i2pUsingLast) setI2pUsingLast(false); });

// "Use last image" buttons — toggle on/off
document.getElementById('btn-use-last-gen').addEventListener('click', () => setGenUsingLast(!genUsingLast));
document.getElementById('btn-use-last-i2p').addEventListener('click', () => setI2pUsingLast(!i2pUsingLast));

// ─── Result helpers ────────────────────────────────────────────────────────────

function setLoading(el, msg = 'Working…') {
  el.innerHTML = `<div class="loading"><div class="spinner"></div><p>${msg}</p></div>`;
}

function setError(el, msg) {
  el.innerHTML = `<div class="error-card">${msg}</div>`;
}

function extractError(status, body) {
  const msg =
    body?.error?.message ||
    (typeof body?.error === 'string' ? body.error : null) ||
    body?.message || null;
  switch (status) {
    case 401: return 'Invalid or missing API key — check the ?key= parameter in your URL.';
    case 402: return 'Insufficient credits on your OpenRouter account. Add credits at openrouter.ai.';
    case 403: return msg || 'Access denied. Your key may lack permission for this model.';
    case 400:
    case 422: return msg ? `Bad request: ${msg}` : 'The request was rejected. Check your inputs.';
    case 429: return 'Rate limit reached. Please wait a moment and try again.';
    case 500: return msg || 'OpenRouter internal error. Try again shortly.';
    case 502:
    case 503:
    case 504: return 'OpenRouter is temporarily unavailable. Try again later.';
    default:  return msg || `Unexpected error (HTTP ${status}).`;
  }
}

// Show an image result with a download link.
function showImage(el, dataUrl, revisedPrompt) {
  const card = document.createElement('div');
  card.className = 'image-card';

  const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  card.innerHTML = `
    <img src="${dataUrl}" alt="Generated image" />
    <div class="image-card-footer">
      ${revisedPrompt ? `<span style="font-size:11px;color:#a0a0b8;flex:1;line-height:1.4">${revisedPrompt}</span>` : ''}
      <a href="${dataUrl}" download="generated.${ext}" class="btn-secondary">Download</a>
    </div>`;
  el.innerHTML = '';
  el.appendChild(card);
}

// Show a streaming text result with Copy + optional "Use as prompt" button.
function showTextCard(el, { onUseAsPrompt } = {}) {
  const card = document.createElement('div');
  card.className = 'text-card';
  const p = document.createElement('p');
  const footer = document.createElement('div');
  footer.className = 'text-card-footer';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-secondary';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(p.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
  });
  footer.appendChild(copyBtn);

  if (onUseAsPrompt) {
    const useBtn = document.createElement('button');
    useBtn.className = 'btn-secondary';
    useBtn.textContent = 'Use as prompt →';
    useBtn.addEventListener('click', () => onUseAsPrompt(p.textContent));
    footer.appendChild(useBtn);
  }

  card.appendChild(p);
  card.appendChild(footer);
  el.innerHTML = '';
  el.appendChild(card);
  return p; // caller appends text + cursor here
}

// Parse and consume an SSE stream, calling onChunk for each text delta.
async function consumeSSE(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;

      let parsed;
      try { parsed = JSON.parse(payload); } catch { continue; }

      if (parsed.error) throw new Error(extractError(parsed.error.code ?? 0, parsed));
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) onChunk(delta);
    }
  }
}

// ─── Generate Image ────────────────────────────────────────────────────────────

document.getElementById('form-generate').addEventListener('submit', async e => {
  e.preventDefault();
  const resultEl = document.getElementById('results-generate');
  const btn = document.getElementById('btn-generate');

  const prompt = document.getElementById('gen-prompt').value.trim();
  const model  = document.getElementById('gen-model').value;
  const aspect = document.getElementById('gen-aspect').value || undefined;
  const refFile = document.getElementById('gen-ref-file').files[0];

  const body = { prompt, model };
  if (aspect) body.aspect_ratio = aspect;
  if (genUsingLast && lastImage)          body.reference_image = lastImage;
  else if (refFile)                        body.reference_image = await fileToDataURL(refFile);

  setLoading(resultEl, 'Generating image…');
  btn.disabled = true;

  try {
    const res = await fetch(`${BASE_PATH}/api/generate-image`, {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(extractError(res.status, data));

    const msg = data.choices?.[0]?.message;
    const imgUrl = msg?.images?.[0]?.image_url?.url;
    if (!imgUrl) throw new Error('No image returned. The selected model may not support image generation.');

    showImage(resultEl, imgUrl, msg?.content || undefined);
    setLastImage(imgUrl);
  } catch (err) {
    setError(resultEl, err.message);
  } finally {
    btn.disabled = false;
  }
});

// ─── Image to Prompt ───────────────────────────────────────────────────────────

document.getElementById('form-i2p').addEventListener('submit', async e => {
  e.preventDefault();
  const resultEl = document.getElementById('results-i2p');
  const btn = e.target.querySelector('[type="submit"]');

  const file  = document.getElementById('i2p-file').files[0];
  const urlIn = document.getElementById('i2p-url').value.trim();
  const model = document.getElementById('i2p-model').value;

  if (!file && !urlIn && !i2pUsingLast) { setError(resultEl, 'Please upload an image, paste a URL, or use the last generated image.'); return; }

  const image = i2pUsingLast && lastImage ? lastImage : (file ? await fileToDataURL(file) : urlIn);

  setLoading(resultEl, 'Analysing image…');
  btn.disabled = true;

  try {
    const res = await fetch(`${BASE_PATH}/api/image-to-prompt`, {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ image, model }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(extractError(res.status, body));
    }

    const p = showTextCard(resultEl, {
      onUseAsPrompt: text => {
        document.getElementById('gen-prompt').value = text;
        activateTab('generate');
      },
    });

    let text = '';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    await consumeSSE(res, chunk => {
      text += chunk;
      p.textContent = text;
      p.appendChild(cursor);
    });

    cursor.remove();
  } catch (err) {
    setError(resultEl, err.message);
  } finally {
    btn.disabled = false;
  }
});

// ─── Improve Prompt ────────────────────────────────────────────────────────────

document.getElementById('form-ip').addEventListener('submit', async e => {
  e.preventDefault();
  const resultEl = document.getElementById('results-ip');
  const btn = e.target.querySelector('[type="submit"]');

  const prompt = document.getElementById('ip-prompt').value.trim();
  const model  = document.getElementById('ip-model').value;

  setLoading(resultEl, 'Improving prompt…');
  btn.disabled = true;

  try {
    const res = await fetch(`${BASE_PATH}/api/improve-prompt`, {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ prompt, model }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(extractError(res.status, body));
    }

    const p = showTextCard(resultEl, {
      onUseAsPrompt: text => {
        document.getElementById('gen-prompt').value = text;
        activateTab('generate');
      },
    });

    let text = '';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    await consumeSSE(res, chunk => {
      text += chunk;
      p.textContent = text;
      p.appendChild(cursor);
    });

    cursor.remove();
  } catch (err) {
    setError(resultEl, err.message);
  } finally {
    btn.disabled = false;
  }
});
