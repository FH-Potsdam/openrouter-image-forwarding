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
      key_submit_image: 'Images',
      key_submit_chat: 'Chat',
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
      chat_system_name_label: 'Name',
      chat_system_name_placeholder: 'e.g. Support agent',
      chat_system_name_hint: 'For your reference only — not sent to the model.',
      chat_system_role_label: 'Role',
      chat_system_role_placeholder: 'You are a helpful assistant.',
      chat_system_tonality_label: 'Tonality',
      chat_system_tonality_placeholder: 'Friendly, concise, and professional.',
      chat_system_task_label: 'Task',
      chat_system_task_placeholder: "Answer the user's questions as accurately as possible.",
      chat_params_summary: 'Parameters',
      chat_info_toggle_aria: 'More information',
      chat_temperature_label: 'Temperature',
      chat_temperature_tooltip: 'Temperature controls the randomness with which the language model selects tokens. The higher the temperature, the more likely it is to select tokens that actually have a lower probability.',
      chat_top_p_label: 'Top P',
      chat_top_p_tooltip: 'Top P is an alternative to temperature. The model considers the most probable tokens until their combined probability reaches the value p, then picks the next token from that group. A higher top-p value means more tokens are available to choose from.',
      chat_freq_label: 'Frequency penalty',
      chat_freq_tooltip: 'The frequency penalty reduces the probability that tokens already used will be generated again. The higher the value, the less likely repetitions become.',
      chat_pres_label: 'Presence penalty',
      chat_pres_tooltip: 'The presence penalty reduces the probability that tokens already used will occur again. Here, only whether the token has appeared before matters, not how often.',
      chat_max_tokens_label: 'Max tokens',
      chat_max_tokens_placeholder: 'Model default',
      chat_max_tokens_tooltip: 'Max tokens sets the maximum number of tokens the language model may generate in a response.',
      chat_top_k_label: 'Top K',
      chat_top_k_placeholder: 'Disabled',
      chat_top_k_tooltip: 'Top K restricts the selection to the k most probable tokens. The next token is then chosen from this restricted set.',
      chat_seed_label: 'Seed',
      chat_seed_placeholder: 'Random',
      chat_seed_tooltip: 'The seed sets the starting value for the random process used in token selection. Using the same seed, the same input, and the same model parameters will generally produce the same responses.',
      chat_clear: 'Clear conversation',
      chat_export_settings: 'Export',
      chat_import_settings: 'Import',
      chat_import_settings_error: 'Could not import settings — the file is not valid.',
      chat_input_placeholder: 'Message…',
      chat_send: 'Send',
      chat_input_hint: '⌘↵ or Ctrl↵ to send',
      chat_download: 'Download',
      chat_download_text: 'Download as text',
      chat_download_json: 'Download as JSON',
      chat_download_empty: 'This conversation has no messages yet.',
      chat_speech_label: 'Speech',
      chat_speech_aria: 'Read responses aloud',
      chat_speech_unsupported: 'Speech output is not supported in this browser.',
      chat_speech_summary: 'Speech output',
      chat_speech_voice_label: 'Voice',
      chat_speech_voice_default: 'System default',
      chat_speech_rate_label: 'Rate',
      chat_speech_pitch_label: 'Pitch',

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

      // privacy-modal.js
      privacy_title: 'Data Protection Notice',
      privacy_body: 'For your privacy, <strong>no information is stored beyond this browser session</strong>. Your API key, conversations, and generated images exist only in your browser\'s memory and will be permanently lost when you close or reload this page.',
      privacy_ok: 'I understand',
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
      key_submit_image: 'Bilder',
      key_submit_chat: 'Chat',
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
      chat_system_name_label: 'Name',
      chat_system_name_placeholder: 'z. B. Support-Agent',
      chat_system_name_hint: 'Nur zu Ihrer Orientierung — wird nicht an das Modell gesendet.',
      chat_system_role_label: 'Rolle',
      chat_system_role_placeholder: 'Du bist ein hilfreicher Assistent.',
      chat_system_tonality_label: 'Tonalität',
      chat_system_tonality_placeholder: 'Freundlich, prägnant und professionell.',
      chat_system_task_label: 'Aufgabe',
      chat_system_task_placeholder: 'Beantworte die Fragen der Nutzenden so genau wie möglich.',
      chat_params_summary: 'Parameter',
      chat_info_toggle_aria: 'Weitere Informationen',
      chat_temperature_label: 'Temperatur',
      chat_temperature_tooltip: 'Temperature reguliert die Zufälligkeit mit der das Sprachmodell Token auswählt. Je höher die Temperature, desto eher werden auch Token ausgewählt, die eigentlich eine geringere Wahrscheinlichkeit haben.',
      chat_top_p_label: 'Top P',
      chat_top_p_tooltip: 'Top p ist eine Alternative zur Temperature. Das Modell berücksichtigt die wahrscheinlichsten Token so lange, bis ihre gemeinsame Wahrscheinlichkeit den Wert p erreicht. Anschließend wählt es das nächste Token aus dieser Gruppe aus. Ein höherer Top-p-Wert bedeutet, dass mehr Token zur Auswahl stehen.',
      chat_freq_label: 'Häufigkeitsstrafe',
      chat_freq_tooltip: 'Die Frequency Penalty reguliert die Wahrscheinlichkeit, dass bereits verwendete Token erneut erzeugt werden. Je höher der Wert, desto unwahrscheinlicher werden Wiederholungen.',
      chat_pres_label: 'Präsenzstrafe',
      chat_pres_tooltip: 'Die Presence Penalty reguliert die Wahrscheinlichkeit, dass bereits verwendete Token erneut auftreten. Dabei spielt nur eine Rolle, ob das Token bereits vorkam.',
      chat_max_tokens_label: 'Max. Token',
      chat_max_tokens_placeholder: 'Modell-Standard',
      chat_max_tokens_tooltip: 'Max Tokens legt fest, wie viele Token das Sprachmodell höchstens in einer Antwort erzeugen darf.',
      chat_top_k_label: 'Top K',
      chat_top_k_placeholder: 'Deaktiviert',
      chat_top_k_tooltip: 'Top k begrenzt die Auswahl auf die k wahrscheinlichsten Token. Das nächste Token wird anschließend aus dieser Auswahl bestimmt.',
      chat_seed_label: 'Seed',
      chat_seed_placeholder: 'Zufällig',
      chat_seed_tooltip: 'Der Seed legt den Startwert für den Zufallsprozess bei der Tokenauswahl fest. Werden derselbe Seed, dieselbe Eingabe und dieselben Modellparameter verwendet, entstehen in der Regel dieselben Antworten.',
      chat_clear: 'Gespräch löschen',
      chat_export_settings: 'Export',
      chat_import_settings: 'Import',
      chat_import_settings_error: 'Einstellungen konnten nicht importiert werden — die Datei ist ungültig.',
      chat_input_placeholder: 'Nachricht…',
      chat_send: 'Senden',
      chat_input_hint: '⌘↵ oder Ctrl↵ zum Senden',
      chat_download: 'Herunterladen',
      chat_download_text: 'Als Text herunterladen',
      chat_download_json: 'Als JSON herunterladen',
      chat_download_empty: 'Dieses Gespräch enthält noch keine Nachrichten.',
      chat_speech_label: 'Sprachausgabe',
      chat_speech_aria: 'Antworten vorlesen',
      chat_speech_unsupported: 'Sprachausgabe wird von diesem Browser nicht unterstützt.',
      chat_speech_summary: 'Sprachausgabe',
      chat_speech_voice_label: 'Stimme',
      chat_speech_voice_default: 'Systemstandard',
      chat_speech_rate_label: 'Geschwindigkeit',
      chat_speech_pitch_label: 'Tonhöhe',

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

      // privacy-modal.js
      privacy_title: 'Datenschutzhinweis',
      privacy_body: 'Zu Ihrem Schutz werden <strong>keine Daten über diese Browsersitzung hinaus gespeichert</strong>. Ihr API-Schlüssel, Ihre Gespräche und generierten Bilder existieren nur im Speicher Ihres Browsers und gehen beim Schließen oder Neuladen dieser Seite unwiderruflich verloren.',
      privacy_ok: 'Verstanden',
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
