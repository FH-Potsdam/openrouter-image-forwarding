'use strict';

// ─── Config & key guard ─────────────────────────────────────────────────────

const BASE_PATH = CONFIG.BASE_PATH;
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

// ─── DOM refs ───────────────────────────────────────────────────────────────

const modelSelect  = document.getElementById('chat-model');
const messagesEl   = document.getElementById('messages');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('btn-send');
const clearBtn     = document.getElementById('btn-clear');
const newChatBtn   = document.getElementById('btn-new-chat');
const chatListEl   = document.getElementById('chat-list');
const downloadBtn  = document.getElementById('btn-download');
const downloadMenu = document.getElementById('download-menu');
const downloadTextBtn = document.getElementById('download-text');
const downloadJsonBtn = document.getElementById('download-json');
const exportSettingsBtn  = document.getElementById('btn-export-settings');
const importSettingsBtn  = document.getElementById('btn-import-settings');
const importSettingsFile = document.getElementById('import-settings-file');
const speechBtn      = document.getElementById('btn-speech');
const speechSettings = document.getElementById('speech-settings');
const speechVoiceSelect = document.getElementById('chat-speech-voice');
const speechRateInput   = document.getElementById('chat-speech-rate');
const speechRateVal     = document.getElementById('chat-speech-rate-val');
const speechPitchInput  = document.getElementById('chat-speech-pitch');
const speechPitchVal    = document.getElementById('chat-speech-pitch-val');

clearBtn.title = I18n.t('chat_clear');

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

// ─── Chat storage ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'chatai_chats';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function makeChat() {
  return { id: genId(), title: I18n.t('chat_new_chat'), history: [], createdAt: Date.now() };
}

function loadChatsFromStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; } catch { return []; }
}

function saveChatsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

let chats         = loadChatsFromStorage();
let currentChatId = null;
let history       = [];
let streaming     = false;

// ─── Sidebar rendering ───────────────────────────────────────────────────────

function renderSidebar() {
  chatListEl.innerHTML = '';
  const sorted = [...chats].sort((a, b) => b.createdAt - a.createdAt);
  for (const chat of sorted) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');

    const title = document.createElement('span');
    title.className = 'chat-item-title';
    title.textContent = chat.title;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'chat-item-del';
    del.title = I18n.t('chat_delete_chat');
    del.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>`;
    del.addEventListener('click', e => { e.stopPropagation(); deleteChat(chat.id); });

    item.appendChild(title);
    item.appendChild(del);
    item.addEventListener('click', () => switchToChat(chat.id));
    chatListEl.appendChild(item);
  }
}

// ─── Chat management ─────────────────────────────────────────────────────────

function flushCurrentHistory() {
  const chat = chats.find(c => c.id === currentChatId);
  if (chat) chat.history = [...history];
}

function renderHistoryIntoMessages(chatHistory) {
  downloadBtn.disabled = chatHistory.length === 0;
  messagesEl.innerHTML = '';
  if (chatHistory.length === 0) {
    messagesEl.innerHTML = `<div class="empty-state">${I18n.t('chat_empty_state')}</div>`;
    return;
  }
  for (const msg of chatHistory) {
    const wrap   = document.createElement('div');
    const bubble = document.createElement('div');
    wrap.className   = `message ${msg.role}`;
    bubble.className = 'message-bubble';
    if (msg.role === 'user') {
      bubble.textContent = msg.content;
    } else {
      bubble.innerHTML = renderMarkdown(msg.content);
    }
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function switchToChat(id) {
  if (id === currentChatId) return;
  stopSpeaking();
  flushCurrentHistory();
  saveChatsToStorage();
  const chat = chats.find(c => c.id === id);
  if (!chat) return;
  currentChatId = chat.id;
  history = [...chat.history];
  renderHistoryIntoMessages(chat.history);
  renderSidebar();
  chatInput.focus();
}

function startNewChat() {
  stopSpeaking();
  flushCurrentHistory();
  const chat = makeChat();
  chats.unshift(chat);
  saveChatsToStorage();
  currentChatId = chat.id;
  history = [];
  renderHistoryIntoMessages([]);
  renderSidebar();
  chatInput.focus();
}

function deleteChat(id) {
  const idx = chats.findIndex(c => c.id === id);
  if (idx === -1) return;
  if (id === currentChatId) stopSpeaking();
  chats.splice(idx, 1);
  saveChatsToStorage();
  if (id !== currentChatId) { renderSidebar(); return; }
  if (chats.length > 0) {
    const next = [...chats].sort((a, b) => b.createdAt - a.createdAt)[0];
    currentChatId = next.id;
    history = [...next.history];
    renderHistoryIntoMessages(next.history);
    renderSidebar();
  } else {
    startNewChat();
  }
}

// ─── Speech output (Web Speech API) ──────────────────────────────────────────

const SPEECH_STORAGE_KEY = 'chatai_speech_enabled';
const SPEECH_VOICE_KEY   = 'chatai_speech_voice';
const SPEECH_RATE_KEY    = 'chatai_speech_rate';
const SPEECH_PITCH_KEY   = 'chatai_speech_pitch';
const speechSupported = 'speechSynthesis' in window;
let speechEnabled = speechSupported && localStorage.getItem(SPEECH_STORAGE_KEY) === 'true';

function updateSpeechBtn() {
  speechBtn.classList.toggle('active', speechEnabled);
  speechBtn.setAttribute('aria-pressed', String(speechEnabled));
}

function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}

// Picks a sensible default: a voice matching the UI language, preferring
// ones whose name suggests a higher-quality engine (OS-provided, not ours).
function pickDefaultVoice(voices) {
  const lang = I18n.LANG.toLowerCase();
  const matchesLang = v => v.lang.toLowerCase().startsWith(lang);
  return voices.find(v => matchesLang(v) && /enhanced|premium|natural/i.test(v.name))
      ?? voices.find(matchesLang)
      ?? null;
}

function populateVoiceSelect() {
  if (!speechSupported) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const stored = localStorage.getItem(SPEECH_VOICE_KEY) ?? '';
  speechVoiceSelect.innerHTML = '';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = I18n.t('chat_speech_voice_default');
  speechVoiceSelect.appendChild(defaultOpt);

  for (const v of [...voices].sort((a, b) => a.name.localeCompare(b.name))) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    speechVoiceSelect.appendChild(opt);
  }

  if (stored && [...speechVoiceSelect.options].some(o => o.value === stored)) {
    speechVoiceSelect.value = stored;
  } else {
    const preferred = pickDefaultVoice(voices);
    if (preferred) speechVoiceSelect.value = preferred.name;
  }
}

function getSelectedVoice() {
  if (!speechSupported) return null;
  const name = speechVoiceSelect.value;
  if (!name) return null;
  return window.speechSynthesis.getVoices().find(v => v.name === name) ?? null;
}

function speak(text) {
  if (!speechEnabled) return;
  const plain = new DOMParser().parseFromString(renderMarkdown(text), 'text/html')
    .body.textContent.trim();
  if (!plain) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(plain);
  const voice = getSelectedVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang  = voice.lang;
  } else {
    utterance.lang = I18n.LANG;
  }
  utterance.rate  = parseFloat(speechRateInput.value)  || 1;
  utterance.pitch = parseFloat(speechPitchInput.value) || 1;
  window.speechSynthesis.speak(utterance);
}

if (!speechSupported) {
  speechBtn.hidden = true;
  speechSettings.hidden = true;
} else {
  updateSpeechBtn();
  speechBtn.addEventListener('click', () => {
    speechEnabled = !speechEnabled;
    localStorage.setItem(SPEECH_STORAGE_KEY, String(speechEnabled));
    updateSpeechBtn();
    if (!speechEnabled) stopSpeaking();
  });

  const storedRate  = parseFloat(localStorage.getItem(SPEECH_RATE_KEY));
  const storedPitch = parseFloat(localStorage.getItem(SPEECH_PITCH_KEY));
  if (!Number.isNaN(storedRate))  speechRateInput.value  = storedRate;
  if (!Number.isNaN(storedPitch)) speechPitchInput.value = storedPitch;
  speechRateVal.textContent  = parseFloat(speechRateInput.value).toFixed(2);
  speechPitchVal.textContent = parseFloat(speechPitchInput.value).toFixed(2);

  speechRateInput.addEventListener('input', () => {
    speechRateVal.textContent = parseFloat(speechRateInput.value).toFixed(2);
    localStorage.setItem(SPEECH_RATE_KEY, speechRateInput.value);
  });
  speechPitchInput.addEventListener('input', () => {
    speechPitchVal.textContent = parseFloat(speechPitchInput.value).toFixed(2);
    localStorage.setItem(SPEECH_PITCH_KEY, speechPitchInput.value);
  });
  speechVoiceSelect.addEventListener('change', () => {
    localStorage.setItem(SPEECH_VOICE_KEY, speechVoiceSelect.value);
  });

  populateVoiceSelect();
  window.speechSynthesis.addEventListener('voiceschanged', populateVoiceSelect);
}

// ─── Init ────────────────────────────────────────────────────────────────────

{
  const sorted = [...chats].sort((a, b) => b.createdAt - a.createdAt);
  if (sorted.length > 0) {
    const first = sorted[0];
    currentChatId = first.id;
    history = [...first.history];
    renderHistoryIntoMessages(first.history);
    renderSidebar();
  } else {
    startNewChat();
  }
}

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

// ─── System prompt composition ───────────────────────────────────────────────

function buildSystemPrompt() {
  const role     = document.getElementById('chat-system-role').value.trim();
  const tonality = document.getElementById('chat-system-tonality').value.trim();
  const task     = document.getElementById('chat-system-task').value.trim();

  const sections = [];
  if (role)     sections.push(`# Role\n${role}`);
  if (tonality) sections.push(`# Tonality\n${tonality}`);
  if (task)     sections.push(`# Task\n${task}`);

  return sections.join('\n\n');
}

// ─── Settings export / import ────────────────────────────────────────────────

function buildSettingsExport() {
  const maxTokens = document.getElementById('chat-max-tokens').value.trim();
  const topK      = document.getElementById('chat-top-k').value.trim();
  const seed      = document.getElementById('chat-seed').value.trim();

  return {
    name:     document.getElementById('chat-system-name').value.trim(),
    role:     document.getElementById('chat-system-role').value.trim(),
    tonality: document.getElementById('chat-system-tonality').value.trim(),
    task:     document.getElementById('chat-system-task').value.trim(),
    model:              modelSelect.value,
    temperature:        parseFloat(document.getElementById('chat-temperature').value),
    top_p:              parseFloat(document.getElementById('chat-top-p').value),
    frequency_penalty:  parseFloat(document.getElementById('chat-freq-penalty').value),
    presence_penalty:   parseFloat(document.getElementById('chat-pres-penalty').value),
    max_tokens:         maxTokens ? parseInt(maxTokens, 10) : null,
    top_k:              topK ? parseInt(topK, 10) : null,
    seed:               seed ? parseInt(seed, 10) : null,
  };
}

function applySettingsImport(data) {
  document.getElementById('chat-system-name').value     = data.name ?? '';
  document.getElementById('chat-system-role').value     = data.role ?? '';
  document.getElementById('chat-system-tonality').value = data.tonality ?? '';
  document.getElementById('chat-system-task').value     = data.task ?? '';

  if (data.model) {
    let opt = [...modelSelect.options].find(o => o.value === data.model);
    if (!opt) {
      opt = document.createElement('option');
      opt.value       = data.model;
      opt.textContent = data.model;
      modelSelect.appendChild(opt);
    }
    modelSelect.value = data.model;
  }

  const sliders = [
    ['chat-temperature',  'chat-temperature-val',  data.temperature,       1],
    ['chat-top-p',        'chat-top-p-val',        data.top_p,             1],
    ['chat-freq-penalty', 'chat-freq-penalty-val', data.frequency_penalty, 0],
    ['chat-pres-penalty', 'chat-pres-penalty-val', data.presence_penalty,  0],
  ];
  for (const [id, valId, value, fallback] of sliders) {
    const v = (typeof value === 'number' && !Number.isNaN(value)) ? value : fallback;
    document.getElementById(id).value          = v;
    document.getElementById(valId).textContent = v.toFixed(2);
  }

  document.getElementById('chat-max-tokens').value = data.max_tokens ?? '';
  document.getElementById('chat-top-k').value      = data.top_k ?? '';
  document.getElementById('chat-seed').value       = data.seed ?? '';
}

// ─── Build request body ──────────────────────────────────────────────────────

function buildRequestBody(userContent) {
  const systemPrompt = buildSystemPrompt();
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

  // Auto-title the chat from its first user message
  if (history.length === 0) {
    const chat = chats.find(c => c.id === currentChatId);
    if (chat && chat.title === I18n.t('chat_new_chat')) {
      chat.title = content.length > 30 ? content.slice(0, 30) + '…' : content;
      renderSidebar();
    }
  }

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
    downloadBtn.disabled = false;
    speak(assistantContent);

    const chat = chats.find(c => c.id === currentChatId);
    if (chat) { chat.history = [...history]; saveChatsToStorage(); }

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

newChatBtn.addEventListener('click', startNewChat);
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
  stopSpeaking();
  history = [];
  const chat = chats.find(c => c.id === currentChatId);
  if (chat) {
    chat.history = [];
    chat.title   = I18n.t('chat_new_chat');
    saveChatsToStorage();
    renderSidebar();
  }
  messagesEl.innerHTML = `<div class="empty-state">${I18n.t('chat_empty_state')}</div>`;
  downloadBtn.disabled = true;
  chatInput.focus();
});

// ─── Conversation export (text / JSON) ────────────────────────────────────────

function currentSettings() {
  const maxTokens = document.getElementById('chat-max-tokens').value.trim();
  const topK      = document.getElementById('chat-top-k').value.trim();
  const seed      = document.getElementById('chat-seed').value.trim();
  return {
    model:              modelSelect.value,
    systemPrompt:       buildSystemPrompt(),
    temperature:        parseFloat(document.getElementById('chat-temperature').value),
    top_p:              parseFloat(document.getElementById('chat-top-p').value),
    frequency_penalty:  parseFloat(document.getElementById('chat-freq-penalty').value),
    presence_penalty:   parseFloat(document.getElementById('chat-pres-penalty').value),
    max_tokens:         maxTokens ? parseInt(maxTokens, 10) : null,
    top_k:              topK ? parseInt(topK, 10) : null,
    seed:               seed ? parseInt(seed, 10) : null,
  };
}

function exportMessages(settings) {
  const messages = [];
  if (settings.systemPrompt) messages.push({ role: 'system', content: settings.systemPrompt });
  messages.push(...history);
  return messages;
}

function buildTextExport() {
  const chat     = chats.find(c => c.id === currentChatId);
  const settings = currentSettings();

  const lines = [];
  for (const msg of history) {
    lines.push(`${msg.role === 'user' ? 'Human' : 'AI'}: ${msg.content}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('Metadata');
  lines.push(`Title: ${chat?.title ?? ''}`);
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Model: ${settings.model}`);
  lines.push(`System prompt: ${settings.systemPrompt || '(none)'}`);
  lines.push(`Temperature: ${settings.temperature}`);
  lines.push(`Top P: ${settings.top_p}`);
  lines.push(`Frequency penalty: ${settings.frequency_penalty}`);
  lines.push(`Presence penalty: ${settings.presence_penalty}`);
  lines.push(`Max tokens: ${settings.max_tokens ?? '(model default)'}`);
  lines.push(`Top K: ${settings.top_k ?? '(disabled)'}`);
  lines.push(`Seed: ${settings.seed ?? '(random)'}`);
  return lines.join('\n');
}

function buildJsonExport() {
  const chat     = chats.find(c => c.id === currentChatId);
  const settings = currentSettings();
  return JSON.stringify({
    title:       chat?.title ?? '',
    created_at:  chat ? new Date(chat.createdAt).toISOString() : new Date().toISOString(),
    exported_at: new Date().toISOString(),
    model:       settings.model,
    system_prompt: settings.systemPrompt || null,
    parameters: {
      temperature:       settings.temperature,
      top_p:             settings.top_p,
      frequency_penalty: settings.frequency_penalty,
      presence_penalty:  settings.presence_penalty,
      max_tokens:        settings.max_tokens,
      top_k:             settings.top_k,
      seed:              settings.seed,
    },
    messages: exportMessages(settings),
  }, null, 2);
}

function slugify(str) {
  const s = (str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return s || 'chat';
}

async function shareOrDownload(filename, content, mimeType) {
  try {
    const file = new File([content], filename, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function closeDownloadMenu() {
  downloadMenu.classList.remove('open');
  downloadBtn.setAttribute('aria-expanded', 'false');
}

downloadBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (downloadBtn.disabled) return;
  const open = downloadMenu.classList.toggle('open');
  downloadBtn.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', e => {
  if (!downloadMenu.contains(e.target) && e.target !== downloadBtn) closeDownloadMenu();
});

downloadTextBtn.addEventListener('click', () => {
  closeDownloadMenu();
  const chat = chats.find(c => c.id === currentChatId);
  shareOrDownload(`${slugify(chat?.title)}.txt`, buildTextExport(), 'text/plain');
});

downloadJsonBtn.addEventListener('click', () => {
  closeDownloadMenu();
  const chat = chats.find(c => c.id === currentChatId);
  shareOrDownload(`${slugify(chat?.title)}.json`, buildJsonExport(), 'application/json');
});

// ─── Settings export / import ────────────────────────────────────────────────

exportSettingsBtn.addEventListener('click', () => {
  const settings = buildSettingsExport();
  shareOrDownload(`${slugify(settings.name)}.json`, JSON.stringify(settings, null, 2), 'application/json');
});

importSettingsBtn.addEventListener('click', () => importSettingsFile.click());

importSettingsFile.addEventListener('change', async () => {
  const file = importSettingsFile.files[0];
  importSettingsFile.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    applySettingsImport(data);
  } catch {
    alert(I18n.t('chat_import_settings_error'));
  }
});

// ─── Info toggles ───────────────────────────────────────────────────────────
// Click toggles an inline info box between the label and the form control —
// works the same with touch and mouse, and needs no viewport positioning.

document.querySelectorAll('.info-icon').forEach(icon => {
  const info = icon.closest('.field-label-row').nextElementSibling;
  icon.addEventListener('click', () => {
    const open = icon.getAttribute('aria-expanded') === 'true';
    icon.setAttribute('aria-expanded', String(!open));
    info.hidden = open;
  });
});
