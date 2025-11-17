class DocumentManager {
    constructor() {
        // Dati interni: inizialmente vuoti (nessun esempio)
        this.documents = [];
        this.nextId = 1;

        // Elementi DOM
        this.uploadForm = document.getElementById('uploadForm');
        this.documentsList = document.getElementById('documentsList');
        this.filterCategory = document.getElementById('filterCategory');
        this.searchDocs = document.getElementById('searchDocs');
        this.clearFilters = document.getElementById('clearFilters');
        this.editModalEl = document.getElementById('editDocumentModal');
        this.editModal = this.editModalEl ? new bootstrap.Modal(this.editModalEl) : null;
        this.editForm = document.getElementById('editDocumentForm');
        this.saveEditBtn = document.getElementById('saveEditDocument');

        this.editingDocumentId = null;
    }

    init() {
        // Attach listeners
        if (this.uploadForm) this.uploadForm.addEventListener('submit', this.handleUpload.bind(this));
        if (this.filterCategory) this.filterCategory.addEventListener('change', this.filterDocuments.bind(this));
        if (this.searchDocs) this.searchDocs.addEventListener('input', this.filterDocuments.bind(this));
        if (this.clearFilters) this.clearFilters.addEventListener('click', this.clearAllFilters.bind(this));
        if (this.saveEditBtn) this.saveEditBtn.addEventListener('click', this.saveEdit.bind(this));

        // Initial render (empty)
        this.renderDocuments();
    }

    handleUpload(e) {
        e.preventDefault();

        const fileNameInput = document.getElementById('fileName');
        const categoryInput = document.getElementById('fileCategory');
        const descriptionInput = document.getElementById('fileDescription');
        const fileInput = document.getElementById('fileUpload');

        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            this.showToast('Seleziona un file da caricare', 'error');
            return;
        }

        const file = fileInput.files[0];
        const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        const newDoc = {
            id: this.nextId++,
            name: (fileNameInput && fileNameInput.value) ? fileNameInput.value : file.name,
            description: descriptionInput && descriptionInput.value ? descriptionInput.value : 'Nessuna descrizione',
            category: categoryInput ? categoryInput.value : '',
            size: fileSize,
            uploadDate: new Date().toLocaleDateString('it-IT'),
            icon: this.getFileIcon(file.name)
        };

        this.documents.push(newDoc);
        this.filterDocuments();

        if (this.uploadForm) this.uploadForm.reset();
        this.showToast('Documento caricato con successo!', 'success');
    }

    renderDocuments(filteredDocs = null) {
        const docs = Array.isArray(filteredDocs) ? filteredDocs : this.documents;

        if (!this.documentsList) return;

        this.documentsList.innerHTML = '';

        if (docs.length === 0) {
            this.documentsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">Nessun documento trovato</h5>
                    <p class="text-muted">Carica un documento per iniziare</p>
                </div>
            `;
            return;
        }

        docs.forEach(doc => {
            const badgeClass = this.getBadgeClass(doc.category);
            const documentItem = document.createElement('div');
            documentItem.className = 'document-item';
            documentItem.setAttribute('data-category', doc.category);
            documentItem.setAttribute('data-id', doc.id);

            documentItem.innerHTML = `
                <div class="document-icon">
                    <i class="bi ${doc.icon}"></i>
                </div>
                <div class="document-info">
                    <h6 class="document-name">${doc.name}</h6>
                    <p class="document-desc">${doc.description}</p>
                    <div class="document-meta">
                        <span class="badge ${badgeClass}">${doc.category}</span>
                        <span class="file-size">${doc.size}</span>
                        <span class="upload-date">${doc.uploadDate}</span>
                    </div>
                </div>
                <div class="document-actions">
                    <button class="btn btn-sm btn-outline-primary me-2 edit-doc" data-id="${doc.id}" aria-label="Modifica documento">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-doc" data-id="${doc.id}" aria-label="Elimina documento">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            this.documentsList.appendChild(documentItem);
        });

        this.attachDocumentEventListeners();
    }

    getBadgeClass(category) {
        const badgeClasses = {
            'contratti': 'bg-success',
            'certificati': 'bg-info',
            'manuali': 'bg-warning',
            'procedure': 'bg-secondary',
            'modulistica': 'bg-primary',
            'altro': 'bg-dark'
        };
        return badgeClasses[category] || 'bg-secondary';
    }

    filterDocuments() {
        const categoryFilter = this.filterCategory ? this.filterCategory.value : '';
        const searchFilter = this.searchDocs ? this.searchDocs.value.toLowerCase() : '';

        let filtered = this.documents.slice();

        if (categoryFilter) {
            filtered = filtered.filter(doc => doc.category === categoryFilter);
        }

        if (searchFilter) {
            filtered = filtered.filter(doc =>
                (doc.name && doc.name.toLowerCase().includes(searchFilter)) ||
                (doc.description && doc.description.toLowerCase().includes(searchFilter))
            );
        }

        this.renderDocuments(filtered);
    }

    attachDocumentEventListeners() {
        // Edit
        this.documentsList.querySelectorAll('.edit-doc').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const id = parseInt(btn.getAttribute('data-id'));
                const doc = this.documents.find(d => d.id === id);
                if (doc) {
                    this.editingDocumentId = id;
                    const editName = document.getElementById('editFileName');
                    const editCategory = document.getElementById('editFileCategory');
                    const editDescription = document.getElementById('editFileDescription');
                    if (editName) editName.value = doc.name;
                    if (editCategory) editCategory.value = doc.category;
                    if (editDescription) editDescription.value = doc.description;
                    if (this.editModal) this.editModal.show();
                }
            });
        });

        // Delete
        this.documentsList.querySelectorAll('.delete-doc').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const id = parseInt(btn.getAttribute('data-id'));
                if (confirm('Sei sicuro di voler eliminare questo documento?')) {
                    this.documents = this.documents.filter(d => d.id !== id);
                    this.filterDocuments();
                    this.showToast('Documento eliminato con successo!', 'success');
                }
            });
        });
    }

    saveEdit() {
        if (!this.editingDocumentId) return;

        const newName = document.getElementById('editFileName') ? document.getElementById('editFileName').value : '';
        const newCategory = document.getElementById('editFileCategory') ? document.getElementById('editFileCategory').value : '';
        const newDescription = document.getElementById('editFileDescription') ? document.getElementById('editFileDescription').value : '';

        const idx = this.documents.findIndex(d => d.id === this.editingDocumentId);
        if (idx !== -1) {
            this.documents[idx].name = newName;
            this.documents[idx].category = newCategory;
            this.documents[idx].description = newDescription;
            this.documents[idx].icon = this.getFileIcon(newName);

            this.filterDocuments();
            if (this.editModal) this.editModal.hide();
            this.showToast('Documento modificato con successo!', 'success');
        }
    }

    clearAllFilters() {
        if (this.filterCategory) this.filterCategory.value = '';
        if (this.searchDocs) this.searchDocs.value = '';
        this.renderDocuments();
    }

    getFileIcon(fileName) {
        const ext = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'bi-file-earmark-pdf',
            'doc': 'bi-file-earmark-word',
            'docx': 'bi-file-earmark-word',
            'xls': 'bi-file-earmark-excel',
            'xlsx': 'bi-file-earmark-excel',
            'jpg': 'bi-file-earmark-image',
            'jpeg': 'bi-file-earmark-image',
            'png': 'bi-file-earmark-image'
        };
        return iconMap[ext] || 'bi-file-earmark';
    }

    showToast(message, type = 'info') {
        // Placeholder: usare una vera toast library o Bootstrap Toast in produzione
        // Tipo può essere 'success','error','info'
        alert(message);
    }
}

// Inizializzazione al DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const dm = new DocumentManager();
    dm.init();
});
