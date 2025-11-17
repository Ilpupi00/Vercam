class DocumentiManager {
    constructor(options = {}) {
        this.container = document.getElementById(options.containerId || 'documentsContainer');
        this.noDocumentsEl = document.getElementById(options.noDocumentsId || 'noDocumentsMessage');
        this.searchInput = document.getElementById(options.searchId || 'docSearch');
        this.searchBtn = document.getElementById(options.searchBtnId || 'docSearchBtn');
        this.categorySelect = document.getElementById(options.categoryId || 'categoryFilter');
        this.clearBtn = document.getElementById(options.clearBtnId || 'clearDocFilters');
        this.documents = [];
        this.originalHTML = '';
    }

    async init() {
        if (this.searchInput) this.searchInput.addEventListener('input', () => this.filterDocuments());
        if (this.searchBtn) this.searchBtn.addEventListener('click', () => this.filterDocuments());
        if (this.categorySelect) this.categorySelect.addEventListener('change', () => this.filterDocuments());
        if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.clearFilters());

        // Salva l'HTML originale per poterlo ripristinare
        if (this.container) {
            this.originalHTML = this.container.innerHTML;
        }

        // Leggi i documenti dal DOM invece di fare fetch
        this.loadDocumentsFromDOM();
        // Non chiamare renderDocuments() qui perché i documenti sono già renderizzati
    }

    loadDocumentsFromDOM() {
        if (!this.container) return;

        // Trova tutte le card documenti nel DOM
        const cards = this.container.querySelectorAll('.card');
        this.documents = Array.from(cards).map(card => {
            const titleEl = card.querySelector('.card-title');
            const descEl = card.querySelector('.card-text');
            // Trova il badge della categoria (non quello "Nuovo")
            const badges = card.querySelectorAll('.badge');
            let categoryBadge = null;
            for (let badge of badges) {
                if (badge.textContent.trim() !== 'Nuovo') {
                    categoryBadge = badge;
                    break;
                }
            }
            const downloadBtn = card.querySelector('a[href]');
            const uploadDateEl = card.querySelector('small.text-muted');

            return {
                element: card.parentElement, // Il col-12 wrapper
                name: titleEl ? titleEl.textContent.trim() : '',
                description: descEl ? descEl.textContent.trim() : '',
                category: this.getCategoryFromBadge(categoryBadge ? categoryBadge.textContent.trim() : ''),
                path: downloadBtn ? downloadBtn.getAttribute('href') : '',
                uploadDate: uploadDateEl ? uploadDateEl.textContent.replace('Caricato: ', '').trim() : ''
            };
        });

        console.log('Documenti caricati dal DOM:', this.documents.length);
    }

    getCategoryFromBadge(badgeText) {
        const map = {
            'Contratti': 'contratti',
            'Certificati': 'certificati',
            'Manuali': 'manuali',
            'Procedure': 'procedure',
            'Modulistica': 'modulistica',
            'Altro': 'altro'
        };
        return map[badgeText] || 'altro';
    }

    filterDocuments() {
        const term = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        const category = this.categorySelect ? this.categorySelect.value : '';

        // Mostra tutto se non ci sono filtri
        if (!term && !category) {
            this.showAllDocuments();
            return;
        }

        // Filtra i documenti
        this.documents.forEach(doc => {
            const matchesSearch = !term ||
                (doc.name && doc.name.toLowerCase().includes(term)) ||
                (doc.description && doc.description.toLowerCase().includes(term));

            const matchesCategory = !category || doc.category === category;

            if (matchesSearch && matchesCategory) {
                doc.element.style.display = '';
            } else {
                doc.element.style.display = 'none';
            }
        });

        // Gestisci le categorie vuote
        this.updateCategoryVisibility();
    }

    showAllDocuments() {
        this.documents.forEach(doc => {
            doc.element.style.display = '';
        });
        this.updateCategoryVisibility();
    }

    updateCategoryVisibility() {
        // Trova tutte le sezioni categoria
        const categorySections = this.container.querySelectorAll('.category-section');

        categorySections.forEach(section => {
            const cards = section.querySelectorAll('.card');
            const visibleCards = Array.from(cards).filter(card => card.parentElement.style.display !== 'none');

            const collapseDiv = section.querySelector('.collapse');
            const header = section.querySelector('.category-header');

            if (visibleCards.length === 0) {
                // Nascondi tutta la sezione categoria
                section.style.display = 'none';
            } else {
                // Mostra la sezione e aggiorna il badge del conteggio
                section.style.display = '';
                const badge = header.querySelector('.badge');
                if (badge) {
                    badge.textContent = `${visibleCards.length} documento${visibleCards.length !== 1 ? 'i' : ''}`;
                }
            }
        });

        // Controlla se ci sono documenti visibili
        const visibleSections = Array.from(categorySections).filter(section => section.style.display !== 'none');
        if (this.noDocumentsEl) {
            this.noDocumentsEl.style.display = visibleSections.length === 0 ? '' : 'none';
        }
    }

    clearFilters() {
        if (this.searchInput) this.searchInput.value = '';
        if (this.categorySelect) this.categorySelect.value = '';
        this.showAllDocuments();
    }

    // Metodi di supporto (mantenuti per compatibilità)
    getCategoryName(category) {
        const names = {
            'contratti': 'Contratti',
            'certificati': 'Certificati',
            'manuali': 'Manuali',
            'procedure': 'Procedure',
            'modulistica': 'Modulistica',
            'altro': 'Altro'
        };
        return names[category] || category;
    }

    getBadgeClass(category) {
        const classes = {
            'contratti': 'bg-success',
            'certificati': 'bg-info',
            'manuali': 'bg-warning',
            'procedure': 'bg-secondary',
            'modulistica': 'bg-primary',
            'altro': 'bg-dark'
        };
        return classes[category] || 'bg-secondary';
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"'`]/g, function (s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;","`":"&#96;"})[s];
        });
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const manager = new DocumentiManager();
    manager.init();

    // Gestione animazione chevron nelle categorie
    document.addEventListener('show.bs.collapse', function (event) {
        const header = event.target.previousElementSibling;
        const chevron = header ? header.querySelector('.category-chevron') : null;
        if (chevron) {
            chevron.style.transform = 'rotate(180deg)';
        }
    });

    document.addEventListener('hide.bs.collapse', function (event) {
        const header = event.target.previousElementSibling;
        const chevron = header ? header.querySelector('.category-chevron') : null;
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
    });
});
