'use strict';

// ─── Config & key guard ─────────────────────────────────────────────────────

const BASE_PATH = '/images';
const API_KEY   = new URLSearchParams(location.search).get('key') ?? '';

if (!API_KEY) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                height:100dvh;gap:16px;font-family:system-ui,sans-serif;color:#444;
                padding:24px;text-align:center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c5af5" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <h2 style="font-size:18px;font-weight:600;margin:0">${I18n.t('chat_no_key_title')}</h2>
      <p style="font-size:14px;max-width:380px;line-height:1.7;margin:0">
        ${I18n.t('chat_no_key_body')}<br>
        <code style="background:#f4f4f8;padding:3px 8px;border-radius:4px;font-size:12px">?key=sk-or-…</code>
      </p>
    </div>`;
  throw new Error('No API key — halting init.');
}

function apiHeaders() {
  return { 'Content-Type': 'application/json', 'x-api-key': API_KEY };
}

// Preserve ?key= and ?lang= when navigating to the Images page
const imgLink = document.getElementById('link-images');
if (imgLink) imgLink.href = I18n.addLangParam(`image.html?key=${encodeURIComponent(API_KEY)}`);

// ─── DOM refs ───────────────────────────────────────────────────────────────

const modelSelect = document.getElementById('chat-model');
const messagesEl  = document.getElementById('messages');
const chatInput   = document.getElementById('chat-input');
const sendBtn     = document.getElementById('btn-send');
const clearBtn    = document.getElementById('btn-clear');

// ─── Model loading ──────────────────────────────────────────────────────────

const FALLBACK_MODELS = [
  { id: 'openai/gpt-4o',                    name: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',               name: 'GPT-4o mini' },
  { id: 'anthropic/claude-opus-4',           name: 'Claude Opus 4' },
  { id: 'anthropic/claude-sonnet-4-5',       name: 'Claude Sonnet 4.5' },
  { id: 'google/gemini-2.0-flash-001',       name: 'Gemini 2.0 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'mistralai/mistral-large',           name: 'Mistral Large' },
];

function fillSelect(el, models, preferred) {
  const groups = {};
  for (const m of models) {
    const provider = m.id.split('/')[0];
    (groups[provider] ??= []).push(m);
  }
  el.innerHTML = '';
  for (const provider of Object.keys(groups).sort()) {
    const og = document.createElement('optgroup');
    og.label = provider;
    for (const m of groups[provider].sort((a, b) =>
        (a.name ?? a.id).localeCompare(b.name ?? b.id))) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name ?? m.id;
      og.appendChild(opt);
    }
    el.appendChild(og);
  }
  const hit = el.querySelector(`option[value="${preferred}"]`);
  if (hit) hit.selected = true;
  el.disabled = false;
}

fillSelect(modelSelect, FALLBACK_MODELS, 'openai/gpt-4o');

(async () => {
  try {
    const res = await fetch(`${BASE_PATH}/api/models`, { headers: apiHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    const textModels = (data?.data ?? []).filter(m =>
      m.architecture?.output_modalities?.includes('text') &&
      !m.architecture?.output_modalities?.includes('image')
    );
    if (textModels.length) fillSelect(modelSelect, textModels, 'openai/gpt-4o');
  } catch {
    // keep fallback list
  }
})();

// ─── Range slider live readouts ──────────────────────────────────────────────

for (const [id, valId] of [
  ['chat-temperature', 'chat-temperature-val'],
  ['chat-top-p',       'chat-top-p-val'],
  ['chat-freq-penalty','chat-freq-penalty-val'],
  ['chat-pres-penalty','chat-pres-penalty-val'],
]) {
  const slider = document.getElementById(id);
  const valEl  = document.getElementById(valId);
  slider.addEventListener('input', () => {
    valEl.textContent = parseFloat(slider.value).toFixed(2);
  });
}

// ─── Conversation state ──────────────────────────────────────────────────────

let history   = [];   // { role, content }[]
let streaming = false;

// ─── Markdown rendering ──────────────────────────────────────────────────────

marked.use({ breaks: true, gfm: true });

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text));
}

// ─── Message rendering ───────────────────────────────────────────────────────

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearEmptyState() {
  messagesEl.querySelector('.empty-state')?.remove();
}

function createBubble(role) {
  clearEmptyState();
  const wrap   = document.createElement('div');
  const bubble = document.createElement('div');
  wrap.className   = `message ${role}`;
  bubble.className = 'message-bubble';
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollBottom();
  return bubble;
}

function showTyping() {
  clearEmptyState();
  const wrap = document.createElement('div');
  wrap.id = 'typing-indicator';
  wrap.className = 'message assistant';
  wrap.innerHTML = '<div class="message-bubble">'
    + '<div class="typing-dots"><span></span><span></span><span></span></div>'
    + '</div>';
  messagesEl.appendChild(wrap);
  scrollBottom();
}

function removeTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function showChatError(msg) {
  const wrap   = document.createElement('div');
  const bubble = document.createElement('div');
  wrap.className   = 'message error';
  bubble.className = 'message-bubble';
  bubble.textContent = msg;
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  scrollBottom();
}

// ─── Build request body ──────────────────────────────────────────────────────

function buildRequestBody(userContent) {
  const systemPrompt = document.getElementById('chat-system').value.trim();
  const messages     = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push(...history);
  messages.push({ role: 'user', content: userContent });

  const body = {
    model:             modelSelect.value,
    messages,
    stream:            true,
    temperature:       parseFloat(document.getElementById('chat-temperature').value),
    top_p:             parseFloat(document.getElementById('chat-top-p').value),
    frequency_penalty: parseFloat(document.getElementById('chat-freq-penalty').value),
    presence_penalty:  parseFloat(document.getElementById('chat-pres-penalty').value),
  };

  const maxTokens = document.getElementById('chat-max-tokens').value.trim();
  const topK      = document.getElementById('chat-top-k').value.trim();
  const seed      = document.getElementById('chat-seed').value.trim();

  if (maxTokens) body.max_tokens = parseInt(maxTokens, 10);
  if (topK)      body.top_k      = parseInt(topK, 10);
  if (seed)      body.seed       = parseInt(seed, 10);

  return body;
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function extractError(status, body) {
  const msg = body?.error?.message
    ?? (typeof body?.error === 'string' ? body.error : null)
    ?? body?.message
    ?? null;
  if (status === 401) return I18n.t('chat_err_401');
  if (status === 402) return I18n.t('chat_err_402');
  if (status === 429) return I18n.t('chat_err_429');
  return msg ?? `${I18n.t('err_unexpected_prefix')}${status}).`;
}

async function consumeSSE(response, onChunk) {
  const reader  = response.body.getReader();
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

// ─── Send ─────────────────────────────────────────────────────────────────────

async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content || streaming) return;

  streaming        = true;
  sendBtn.disabled = true;

  chatInput.value        = '';
  chatInput.style.height = 'auto';

  createBubble('user').textContent = content;
  showTyping();

  try {
    const res = await fetch(`${BASE_PATH}/api/chat`, {
      method:  'POST',
      headers: apiHeaders(),
      body:    JSON.stringify(buildRequestBody(content)),
    });

    removeTyping();

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(extractError(res.status, data));
    }

    const bubble = createBubble('assistant');
    let assistantContent = '';

    await consumeSSE(res, chunk => {
      assistantContent += chunk;
      bubble.innerHTML = renderMarkdown(assistantContent);
      scrollBottom();
    });

    history.push({ role: 'user',      content });
    history.push({ role: 'assistant', content: assistantContent });

  } catch (err) {
    removeTyping();
    showChatError(err.message);
  } finally {
    streaming        = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 160) + 'px';
});

clearBtn.addEventListener('click', () => {
  history = [];
  messagesEl.innerHTML = `<div class="empty-state">${I18n.t('chat_empty_state')}</div>`;
  chatInput.focus();
});
