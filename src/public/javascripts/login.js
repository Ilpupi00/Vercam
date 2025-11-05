class LoginManager {
    constructor() {
        this.form = document.querySelector('.login-form');
    this.email = document.getElementById('email');
        this.password = document.getElementById('password');
        this.remember = document.getElementById('rememberMe');
        this.alertContainer = null; // will be created dynamically
    }

    init() {
        if (!this.form) return;
        this.createAlertContainer();
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.loadRemembered();
    }

    createAlertContainer() {
        // create a container at the top of the form for alerts
        this.alertContainer = document.createElement('div');
        this.alertContainer.setAttribute('aria-live', 'polite');
        this.alertContainer.style.minHeight = '1.5rem';
        this.form.prepend(this.alertContainer);
    }

    showAlert(message, type = 'danger', timeout = 4000) {
        if (!this.alertContainer) return;
        // Clear previous
        this.alertContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = `alert alert-${type} alert-sm py-2`;
        wrapper.role = 'alert';
        wrapper.textContent = message;

        this.alertContainer.appendChild(wrapper);

        if (timeout > 0) {
            setTimeout(() => {
                if (this.alertContainer.contains(wrapper)) wrapper.remove();
            }, timeout);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

    const usernameVal = this.email ? this.email.value.trim() : '';
        const passwordVal = this.password ? this.password.value : '';

        // Basic client-side validation
        if (!usernameVal) {
            this.showAlert('Inserisci l\'email', 'danger');
            if (this.email) this.email.focus();
            return;
        }
        if (!passwordVal) {
            this.showAlert('Inserisci la password', 'danger');
            if (this.password) this.password.focus();
            return;
        }

        // Remember me handling (store only email locally if requested)
        this.saveRemembered(this.remember && this.remember.checked ? usernameVal : null);

    // Prepare payload (server expects `email` field)
    const payload = { email: usernameVal, password: passwordVal };

        const action = this.form.getAttribute('action') || '/login';

        try {
            const res = await fetch(action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });

            // If server redirects (express might redirect on success), follow
            if (res.redirected) {
                window.location.href = res.url;
                return;
            }

            // Try parse JSON response
            let data = {};
            try { data = await res.json(); } catch (err) { /* ignore parse errors */ }

            if (res.ok) {
                // Success — server may provide a redirect URL
                if (data && data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    // fallback: reload
                    window.location.reload();
                }
            } else {
                // Error — show message from server or generic
                const msg = (data && (data.error || data.message)) ? (data.error || data.message) : 'Login non riuscito';
                this.showAlert(msg, 'danger');
            }
        } catch (err) {
            console.error('Login error:', err);
            this.showAlert('Errore di rete. Riprova più tardi.', 'danger');
        }
    }

    loadRemembered() {
        try {
            const remembered = localStorage.getItem('vercam_email');
            if (remembered && this.email) {
                this.email.value = remembered;
                if (this.remember) this.remember.checked = true;
            }
        } catch (err) {
            // ignore localStorage errors
        }
    }

    saveRemembered(username) {
        try {
            if (username) {
                localStorage.setItem('vercam_email', username);
            } else {
                localStorage.removeItem('vercam_email');
            }
        } catch (err) {
            // ignore storage errors
        }
    }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const lm = new LoginManager();
    lm.init();
});
