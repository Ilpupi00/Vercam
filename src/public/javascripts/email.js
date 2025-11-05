document.addEventListener('DOMContentLoaded', () => {
  /**
   * EmailForm: OOP handler per il form di contatto
   * Incapsula validazione, preparazione del payload e invio via fetch
   */
  class EmailForm {
    constructor(formSelector) {
      this.form = document.getElementById(formSelector) || document.querySelector(formSelector);
      if (!this.form) return null;
      this.submitBtn = this.form.querySelector('button[type="submit"]');
      this.modalEl = document.getElementById('vcMessageModal');
      this.init();
    }

    init() {
      this.form.setAttribute('novalidate', 'novalidate');
      this.bindEvents();
    }

    bindEvents() {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    showModal(type, message) {
      const iconSuccess = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      const iconDanger = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 9v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 17h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="0" fill="currentColor" opacity="0.08"/>
        </svg>`;

      const icon = type === 'success' ? iconSuccess : iconDanger;

      if (this.modalEl) {
        const modalTitle = this.modalEl.querySelector('#vcMessageModalLabel');
        const modalBody = this.modalEl.querySelector('#vcModalBody');
        const modalIcon = this.modalEl.querySelector('#vcModalIcon');
        if (modalTitle) modalTitle.textContent = type === 'success' ? 'Messaggio inviato' : 'Errore';
        if (modalBody) modalBody.innerHTML = `<p class="mb-0">${message}</p>`;
        if (modalIcon) modalIcon.innerHTML = icon;
        // eslint-disable-next-line no-undef
        const bsModal = new bootstrap.Modal(this.modalEl);
        bsModal.show();
        return;
      }

      // fallback
      // eslint-disable-next-line no-alert
      alert(message);
    }

    toggleSubmit(disabled = true, text) {
      if (!this.submitBtn) return;
      this.submitBtn.disabled = disabled;
      if (text !== undefined) this.submitBtn.innerHTML = text;
    }

    preparePayload() {
      const f = this.form.elements;
      return {
        name: (f['name'] && f['name'].value) || '',
        email: (f['email'] && f['email'].value) || '',
        subject: (f['subject'] && f['subject'].value) || '',
        message: (f['message'] && f['message'].value) || '',
        phone: (f['phone'] && f['phone'].value) || '',
        service: (f['service'] && f['service'].value) || '',
        privacy: Boolean(f['privacy'] && (f['privacy'].checked || f['privacy'].value)),
      };
    }

    async handleSubmit(e) {
      e.preventDefault();

      // Let browser show native validation bubbles if invalid
      if (!this.form.checkValidity()) {
        this.form.reportValidity();
        this.showModal('danger', 'Per favore compila tutti i campi obbligatori e accetta la privacy prima di inviare.');
        return;
      }

      const payload = this.preparePayload();

      // privacy must be true
      if (!payload.privacy) {
        this.showModal('danger', 'Devi accettare l\'informativa sulla privacy per procedere.');
        return;
      }

      try {
        this.toggleSubmit(true, 'Invio...');

        const res = await fetch('/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let json = {};
        try { json = await res.json(); } catch (e) { /* ignore json parse errors */ }

        if (res.ok && json && json.ok) {
          this.showModal('success', 'Messaggio inviato correttamente. Ti risponderemo al più presto.');
          this.form.reset();
        } else {
          const err = (json && json.error) ? json.error : 'Errore durante l\'invio del messaggio. Riprova più tardi.';
          this.showModal('danger', err);
        }
      } catch (err) {
        console.error('Errore invio form:', err);
        this.showModal('danger', 'Errore di rete durante l\'invio. Riprova più tardi.');
      } finally {
        this.toggleSubmit(false, this.submitBtn ? this.submitBtn.getAttribute('data-original-text') || this.submitBtn.innerHTML : undefined);
      }
    }
  }

  // instantiate for both possible form IDs
  const formsToInit = ['emailForm', 'contactForm'];
  formsToInit.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      // store original button text so we can restore it
      const btn = el.querySelector('button[type="submit"]');
      if (btn && !btn.hasAttribute('data-original-text')) btn.setAttribute('data-original-text', btn.innerHTML);
      /* eslint-disable no-new */
      new EmailForm(id);
      /* eslint-enable no-new */
    }
  });
});
