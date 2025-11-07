// Compatibilità: file con nome corretto "navbar.js" per evitare 404 dovuti a typo
// Contenuto duplicato da navabar.js (mantieni sincronizzati o rimuovi il duplicato quando sistemi il nome definitivo)

class NavActive {
  constructor(selector = '.nav-link', activeClass = 'active') {
    this.selector = selector;
    this.activeClass = activeClass;
    this.links = [];
    // assicurati di inizializzare dopo il DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.links = Array.from(document.querySelectorAll(this.selector));
    if (!this.links.length) {
      console.debug('NavActive: nessun link trovato con selector', this.selector);
      return;
    }
    // Bind click per aggiornare lo stato immediatamente (utile in SPA o per feedback UX)
    this.bindClicks();
    // Osserva cambi di history (pushState/replaceState/popstate)
    this.observeHistory();
    // Applica lo stato iniziale
    this.applyByLocation();
  }

  bindClicks() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        // Se il link apre in nuova scheda o ha attributo esterno manteniamo default
        const target = link.getAttribute('target');
        const href = link.getAttribute('href') || '';
        if (target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        // Per link interni: impostiamo l'active subito (se la pagina viene ricaricata, il nuovo caricamento ristabilirà lo stato corretto)
        this.setActive(link);
      });
    });
  }

  applyByLocation() {
    const rawPath = location.pathname || '/';
    const path = (rawPath.replace(/\/+$/, '') || '/') ;
    // Prima prova corrispondenza esatta su data-path (se fornito) oppure su href
    let match = this.links.find(l => {
      const dataPath = l.dataset.path;
      if (dataPath) {
        const norm = (dataPath + '').replace(/\/+$/, '') || '/';
        return norm === path;
      }
      try {
        const href = l.getAttribute('href') || '';
        const hrefPath = new URL(href, location.origin).pathname.replace(/\/+$/, '') || '/';
        return hrefPath === path;
      } catch (e) {
        return false;
      }
    });

    // Fallback: startsWith per pagine figlie (es. /servizi/1 -> /servizi)
    if (!match) {
      match = this.links.find(l => {
        try {
          const hrefPath = new URL(l.getAttribute('href') || '', location.origin).pathname.replace(/\/+$/, '') || '/';
          return hrefPath !== '/' && path.startsWith(hrefPath);
        } catch (e) {
          return false;
        }
      });
    }

    this.setActive(match || null);
    console.debug('NavActive: applyByLocation', { rawPath, selected: match ? match.getAttribute('href') : null });
  }

  setActive(link) {
    this.links.forEach(l => {
      l.classList.remove(this.activeClass);
      l.removeAttribute('aria-current');
    });
    if (link) {
      link.classList.add(this.activeClass);
      link.setAttribute('aria-current', 'page');
    }
  }

  observeHistory() {
    // Intercetta pushState/replaceState
    const wrap = (type) => {
      const orig = history[type];
      history[type] = function(...args) {
        const rv = orig.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
        return rv;
      };
    };
    wrap('pushState');
    wrap('replaceState');
    window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
    window.addEventListener('locationchange', () => this.applyByLocation());
  }
}

// Inizializza per i link nella navbar (selector puntuale)
new NavActive('.navbar-nav .nav-link', 'active');

// Logout function
async function logout() {
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });
    if (response.ok) {
      // Redirect to home or login
      window.location.href = '/';
    } else {
      alert('Errore durante il logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Errore di rete durante il logout');
  }
}
