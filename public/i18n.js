(function () {
  'use strict';

  const SUPPORTED = ['en', 'de'];
  const params = new URLSearchParams(location.search);
  const LANG = SUPPORTED.includes(params.get('lang')) ? params.get('lang') : 'en';

  const T = {
    en: {
      // Page titles
      page_title_key: 'OpenRouter Chat — Enter API Key',
      page_title_image: 'Image AI',
      page_title_chat: 'Chat AI',
      page_title_credits: 'OpenRouter — Credits',

      // Logos
      logo_chat: 'OpenRouter Chat',
      logo_image: 'Image AI',
      logo_chat_app: 'Chat AI',

      // key.html
      key_heading: 'Enter your API key',
      key_subtitle: 'Your key is used to authenticate requests to the OpenRouter API. It is appended to the URL and never stored on the server.',
      key_label: 'Magnific API Key',
      key_placeholder: 'sk-or-…',
      key_toggle_aria: 'Show/hide key',
      key_submit: 'Open app',
      key_error_empty: 'Please enter your API key.',

      // image.html nav
      nav_generate: 'Generate Image',
      nav_i2p: 'Image to Prompt',
      nav_improve: 'Improve Prompt',

      // image.html — generate panel
      gen_prompt_label: 'Prompt',
      gen_prompt_placeholder: 'Describe the image you want to generate…',
      gen_model_label: 'Model',
      gen_aspect_label: 'Aspect Ratio',
      gen_aspect_default: 'Default',
      gen_aspect_square: 'Square 1:1',
      gen_aspect_wide: 'Widescreen 16:9',
      gen_aspect_portrait916: 'Portrait 9:16',
      gen_aspect_classic43: 'Classic 4:3',
      gen_aspect_classic34: 'Classic 3:4',
      gen_aspect_landscape: 'Landscape 3:2',
      gen_aspect_portrait23: 'Portrait 2:3',
      gen_aspect_cinema: 'Cinematic 21:9',
      gen_ref_summary: 'Upload reference image (optional)',
      gen_ref_hint: 'Upload a reference image to guide the style or composition of the output. Only supported by multimodal generation models.',
      gen_drop_text: 'Drop image or <u>browse</u>',
      gen_ref_image_label: 'Reference image',
      gen_remove: '× Remove',
      gen_submit: 'Generate',
      gen_empty: 'Your generated image will appear here',

      // image.html — image-to-prompt panel
      i2p_image_label: 'Image',
      i2p_url_label: 'Or paste an image URL',
      i2p_url_placeholder: 'https://example.com/photo.jpg',
      i2p_model_label: 'Vision model',
      i2p_submit: 'Generate Prompt',
      i2p_empty: 'The generated prompt will appear here',

      // image.html — improve-prompt panel
      ip_prompt_label: 'Prompt',
      ip_prompt_placeholder: 'Enter a rough prompt to improve, e.g. “dog in forest”…',
      ip_model_label: 'Model',
      ip_submit: 'Improve Prompt',
      ip_empty: 'The improved prompt will appear here',

      // app.js dynamic strings
      app_no_key_title: 'API key required',
      app_no_key_body: 'Open this app with your OpenRouter API key as a URL parameter:',
      app_working: 'Working…',
      app_generating: 'Generating image…',
      app_analysing: 'Analysing image…',
      app_improving: 'Improving prompt…',
      app_use_as_ref: 'Use as reference',
      app_selected: 'Selected ✓',
      app_download: 'Download',
      app_copy: 'Copy',
      app_copied: 'Copied!',
      app_use_as_prompt: 'Use as prompt →',
      app_no_image: 'No image returned. The selected model may not support image generation.',
      app_no_ref: 'Please upload an image, paste a URL, or select a reference image.',
      app_ref_used: 'ref used',

      // error messages (app.js extractError)
      err_401: 'Invalid or missing API key — check the ?key= parameter in your URL.',
      err_402: 'Insufficient credits on your OpenRouter account. Add credits at openrouter.ai.',
      err_403: 'Access denied. Your key may lack permission for this model.',
      err_bad_request_prefix: 'Bad request: ',
      err_bad_request_default: 'The request was rejected. Check your inputs.',
      err_429: 'Rate limit reached. Please wait a moment and try again.',
      err_500: 'OpenRouter internal error. Try again shortly.',
      err_unavailable: 'OpenRouter is temporarily unavailable. Try again later.',
      err_unexpected_prefix: 'Unexpected error (HTTP ',

      // chat.html
      chat_tab_chat: 'Chat',
      chat_tab_images: 'Images',
      chat_model_label: 'Model',
      chat_system_summary: 'System prompt',
      chat_system_placeholder: 'You are a helpful assistant.',
      chat_params_summary: 'Parameters',
      chat_temperature_label: 'Temperature',
      chat_temperature_hint: 'Randomness — 0 is deterministic, 2 is most creative.',
      chat_top_p_label: 'Top P',
      chat_top_p_hint: 'Nucleus sampling — restrict to top P probability mass.',
      chat_freq_label: 'Frequency penalty',
      chat_freq_hint: 'Penalise already-frequent tokens to reduce repetition.',
      chat_pres_label: 'Presence penalty',
      chat_pres_hint: 'Encourage new topics by penalising already-mentioned tokens.',
      chat_max_tokens_label: 'Max tokens',
      chat_max_tokens_placeholder: 'Model default',
      chat_max_tokens_hint: 'Maximum tokens to generate. Leave empty for model default.',
      chat_top_k_label: 'Top K',
      chat_top_k_placeholder: 'Disabled',
      chat_top_k_hint: 'Limit sampling pool to top K tokens. Empty = disabled.',
      chat_seed_label: 'Seed',
      chat_seed_placeholder: 'Random',
      chat_seed_hint: 'Fixed seed for reproducible outputs.',
      chat_clear: 'Clear conversation',
      chat_input_placeholder: 'Message…',
      chat_send: 'Send',
      chat_input_hint: '⌘↵ or Ctrl↵ to send',

      // chat.js dynamic
      chat_no_key_title: 'API key required',
      chat_no_key_body: 'Pass your OpenRouter key as a URL parameter:',
      chat_empty_state: 'Start a conversation by typing a message below.',
      chat_new_chat: 'New chat',
      chat_delete_chat: 'Delete chat',
      chat_err_401: 'Invalid API key — check the ?key= URL parameter.',
      chat_err_402: 'Insufficient credits on your OpenRouter account.',
      chat_err_429: 'Rate limit hit — wait a moment and try again.',

      // credits.html
      credits_title: 'Credits',
      credits_subtitle: 'Current balance and usage for the API key in the URL.',
      credits_loading: 'Loading…',
      credits_no_key: 'No API key found in URL.',
      credits_enter_key: 'Enter a key',
      credits_row_label: 'Label',
      credits_row_limit: 'Limit',
      credits_row_limit_remaining: 'Limit remaining',
      credits_row_limit_reset: 'Limit reset',
      credits_row_usage: 'Usage (all time)',
      credits_row_usage_today: 'Usage (today)',
      credits_row_usage_week: 'Usage (this week)',
      credits_row_usage_month: 'Usage (this month)',
      credits_row_byok_usage: 'BYOK usage (all time)',
      credits_row_byok_today: 'BYOK usage (today)',
      credits_row_byok_week: 'BYOK usage (this week)',
      credits_row_byok_month: 'BYOK usage (this month)',
      credits_row_free_tier: 'Free tier',
      credits_row_byok_limit: 'BYOK counts toward limit',
      credits_unlimited: 'Unlimited',
      credits_never: 'Never',
      credits_yes: 'Yes',
      credits_no: 'No',

      // common
      loading_models: 'Loading models…',
    },

    de: {
      // Page titles
      page_title_key: 'OpenRouter Chat — API-Schlüssel eingeben',
      page_title_image: 'Image AI',
      page_title_chat: 'Chat AI',
      page_title_credits: 'OpenRouter — Guthaben',

      // Logos
      logo_chat: 'OpenRouter Chat',
      logo_image: 'Image AI',
      logo_chat_app: 'Chat AI',

      // key.html
      key_heading: 'API-Schlüssel eingeben',
      key_subtitle: 'Ihr Schlüssel wird zur Authentifizierung von Anfragen an die OpenRouter API verwendet. Er wird an die URL angehängt und nie auf dem Server gespeichert.',
      key_label: 'Magnific API-Schlüssel',
      key_placeholder: 'sk-or-…',
      key_toggle_aria: 'Schlüssel anzeigen/verbergen',
      key_submit: 'App öffnen',
      key_error_empty: 'Bitte geben Sie Ihren API-Schlüssel ein.',

      // image.html nav
      nav_generate: 'Bild generieren',
      nav_i2p: 'Bild zu Prompt',
      nav_improve: 'Prompt verbessern',

      // image.html — generate panel
      gen_prompt_label: 'Prompt',
      gen_prompt_placeholder: 'Beschreiben Sie das Bild, das Sie generieren möchten…',
      gen_model_label: 'Modell',
      gen_aspect_label: 'Seitenverhältnis',
      gen_aspect_default: 'Standard',
      gen_aspect_square: 'Quadratisch 1:1',
      gen_aspect_wide: 'Breitbild 16:9',
      gen_aspect_portrait916: 'Hochformat 9:16',
      gen_aspect_classic43: 'Klassisch 4:3',
      gen_aspect_classic34: 'Klassisch 3:4',
      gen_aspect_landscape: 'Querformat 3:2',
      gen_aspect_portrait23: 'Hochformat 2:3',
      gen_aspect_cinema: 'Kinoformat 21:9',
      gen_ref_summary: 'Referenzbild hochladen (optional)',
      gen_ref_hint: 'Laden Sie ein Referenzbild hoch, um Stil oder Komposition des Ergebnisses zu steuern. Nur von multimodalen Generierungsmodellen unterstützt.',
      gen_drop_text: 'Bild ablegen oder <u>durchsuchen</u>',
      gen_ref_image_label: 'Referenzbild',
      gen_remove: '× Entfernen',
      gen_submit: 'Generieren',
      gen_empty: 'Ihr generiertes Bild erscheint hier',

      // image.html — image-to-prompt panel
      i2p_image_label: 'Bild',
      i2p_url_label: 'Oder eine Bild-URL einfügen',
      i2p_url_placeholder: 'https://example.com/photo.jpg',
      i2p_model_label: 'Vision-Modell',
      i2p_submit: 'Prompt generieren',
      i2p_empty: 'Der generierte Prompt erscheint hier',

      // image.html — improve-prompt panel
      ip_prompt_label: 'Prompt',
      ip_prompt_placeholder: 'Geben Sie einen ungefähren Prompt ein, z. B. „Hund im Wald“…',
      ip_model_label: 'Modell',
      ip_submit: 'Prompt verbessern',
      ip_empty: 'Der verbesserte Prompt erscheint hier',

      // app.js dynamic strings
      app_no_key_title: 'API-Schlüssel erforderlich',
      app_no_key_body: 'Öffnen Sie diese App mit Ihrem OpenRouter API-Schlüssel als URL-Parameter:',
      app_working: 'Wird verarbeitet…',
      app_generating: 'Bild wird generiert…',
      app_analysing: 'Bild wird analysiert…',
      app_improving: 'Prompt wird verbessert…',
      app_use_as_ref: 'Als Referenz verwenden',
      app_selected: 'Ausgewählt ✓',
      app_download: 'Herunterladen',
      app_copy: 'Kopieren',
      app_copied: 'Kopiert!',
      app_use_as_prompt: 'Als Prompt verwenden →',
      app_no_image: 'Kein Bild zurückgegeben. Das ausgewählte Modell unterstützt möglicherweise keine Bildgenerierung.',
      app_no_ref: 'Bitte laden Sie ein Bild hoch, fügen Sie eine URL ein oder wählen Sie ein Referenzbild aus.',
      app_ref_used: 'Referenz verwendet',

      // error messages (app.js extractError)
      err_401: 'Ungültiger oder fehlender API-Schlüssel — prüfen Sie den ?key= Parameter in Ihrer URL.',
      err_402: 'Unzureichendes Guthaben auf Ihrem OpenRouter-Konto. Fügen Sie Guthaben bei openrouter.ai hinzu.',
      err_403: 'Zugriff verweigert. Ihr Schlüssel hat möglicherweise keine Berechtigung für dieses Modell.',
      err_bad_request_prefix: 'Ungültige Anfrage: ',
      err_bad_request_default: 'Die Anfrage wurde abgelehnt. Überprüfen Sie Ihre Eingaben.',
      err_429: 'Anfragelimit erreicht. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
      err_500: 'Interner OpenRouter-Fehler. Versuchen Sie es in Kürze erneut.',
      err_unavailable: 'OpenRouter ist vorübergehend nicht verfügbar. Versuchen Sie es später erneut.',
      err_unexpected_prefix: 'Unerwarteter Fehler (HTTP ',

      // chat.html
      chat_tab_chat: 'Chat',
      chat_tab_images: 'Bilder',
      chat_model_label: 'Modell',
      chat_system_summary: 'System-Prompt',
      chat_system_placeholder: 'Du bist ein hilfreicher Assistent.',
      chat_params_summary: 'Parameter',
      chat_temperature_label: 'Temperatur',
      chat_temperature_hint: 'Zufälligkeit — 0 ist deterministisch, 2 ist am kreativsten.',
      chat_top_p_label: 'Top P',
      chat_top_p_hint: 'Nucleus-Sampling — auf die obere P Wahrscheinlichkeitsmasse beschränken.',
      chat_freq_label: 'Häufigkeitsstrafe',
      chat_freq_hint: 'Häufig verwendete Token bestrafen, um Wiederholungen zu reduzieren.',
      chat_pres_label: 'Präsenzstrafe',
      chat_pres_hint: 'Neue Themen fördern, indem bereits erwähnte Token bestraft werden.',
      chat_max_tokens_label: 'Max. Token',
      chat_max_tokens_placeholder: 'Modell-Standard',
      chat_max_tokens_hint: 'Maximal zu generierende Token. Leer lassen für Modell-Standard.',
      chat_top_k_label: 'Top K',
      chat_top_k_placeholder: 'Deaktiviert',
      chat_top_k_hint: 'Sampling-Pool auf die obersten K Token begrenzen. Leer = deaktiviert.',
      chat_seed_label: 'Seed',
      chat_seed_placeholder: 'Zufällig',
      chat_seed_hint: 'Fester Seed für reproduzierbare Ausgaben.',
      chat_clear: 'Gespräch löschen',
      chat_input_placeholder: 'Nachricht…',
      chat_send: 'Senden',
      chat_input_hint: '⌘↵ oder Ctrl↵ zum Senden',

      // chat.js dynamic
      chat_no_key_title: 'API-Schlüssel erforderlich',
      chat_no_key_body: 'Übergeben Sie Ihren OpenRouter-Schlüssel als URL-Parameter:',
      chat_empty_state: 'Starten Sie ein Gespräch, indem Sie unten eine Nachricht eingeben.',
      chat_new_chat: 'Neuer Chat',
      chat_delete_chat: 'Chat löschen',
      chat_err_401: 'Ungültiger API-Schlüssel — prüfen Sie den ?key= URL-Parameter.',
      chat_err_402: 'Unzureichendes Guthaben auf Ihrem OpenRouter-Konto.',
      chat_err_429: 'Anfragelimit erreicht — warten Sie einen Moment und versuchen Sie es erneut.',

      // credits.html
      credits_title: 'Guthaben',
      credits_subtitle: 'Aktuelles Guthaben und Nutzung für den API-Schlüssel in der URL.',
      credits_loading: 'Wird geladen…',
      credits_no_key: 'Kein API-Schlüssel in der URL gefunden.',
      credits_enter_key: 'Schlüssel eingeben',
      credits_row_label: 'Bezeichnung',
      credits_row_limit: 'Limit',
      credits_row_limit_remaining: 'Verbleibendes Limit',
      credits_row_limit_reset: 'Limit-Reset',
      credits_row_usage: 'Nutzung (gesamt)',
      credits_row_usage_today: 'Nutzung (heute)',
      credits_row_usage_week: 'Nutzung (diese Woche)',
      credits_row_usage_month: 'Nutzung (diesen Monat)',
      credits_row_byok_usage: 'BYOK-Nutzung (gesamt)',
      credits_row_byok_today: 'BYOK-Nutzung (heute)',
      credits_row_byok_week: 'BYOK-Nutzung (diese Woche)',
      credits_row_byok_month: 'BYOK-Nutzung (diesen Monat)',
      credits_row_free_tier: 'Kostenlose Stufe',
      credits_row_byok_limit: 'BYOK zählt zum Limit',
      credits_unlimited: 'Unbegrenzt',
      credits_never: 'Nie',
      credits_yes: 'Ja',
      credits_no: 'Nein',

      // common
      loading_models: 'Modelle werden geladen…',
    },
  };

  function t(key) {
    return T[LANG]?.[key] ?? T.en[key] ?? key;
  }

  // Appends or updates the lang param in a URL string.
  function addLangParam(url) {
    try {
      const u = new URL(url, location.href);
      u.searchParams.set('lang', LANG);
      return u.pathname + u.search;
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}lang=${LANG}`;
    }
  }

  // Injects EN/DE toggle buttons into a container element.
  function buildLangToggle(container) {
    if (!container) return;
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'lang-toggle';
    SUPPORTED.forEach(lang => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = lang.toUpperCase();
      if (lang === LANG) btn.classList.add('active');
      btn.addEventListener('click', () => {
        const next = new URLSearchParams(location.search);
        next.set('lang', lang);
        location.search = next.toString();
      });
      wrap.appendChild(btn);
    });
    container.appendChild(wrap);
  }

  // Apply all data-i18n* attributes and build the toggle.
  function applyI18n() {
    document.documentElement.lang = LANG;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      el.label = t(el.dataset.i18nLabel);
    });

    buildLangToggle(document.getElementById('lang-toggle'));
  }

  document.addEventListener('DOMContentLoaded', applyI18n);

  window.I18n = { t, LANG, addLangParam, buildLangToggle, applyI18n, SUPPORTED };
})();
