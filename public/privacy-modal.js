(function () {
  const overlay = document.createElement('div');
  overlay.id = 'privacy-overlay';
  overlay.innerHTML = `
    <div class="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <div class="privacy-modal-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <h2 id="privacy-title">Data Protection Notice</h2>
      <p>
        For your privacy, <strong>no information is stored beyond this browser session</strong>.
        Your API key, conversations, and generated images exist only in your browser's memory
        and will be permanently lost when you close or reload this page.
      </p>
      <button id="privacy-ok" class="btn-primary">I understand</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('privacy-ok').addEventListener('click', function () {
    overlay.remove();
  });
})();
