// Catalog Builder App - Vanilla JS Implementation
class CatalogBuilder {
    constructor() {
        this.pages = [{ html: '<h1>{{title}}</h1><p>{{description}}</p>', css: 'h1 { font-size: 24px; }' }]; // Multi-page support
        this.currentPageIndex = 0;
        this.zoomLevel = 1;
        this.history = []; // For undo/redo
        this.historyIndex = -1;
        this.templates = {}; // Loaded templates
        this.init();
    }

    init() {
        this.editor = document.getElementById('editor');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.pageCountEl = document.getElementById('page-count');
        this.statusEl = document.getElementById('status');
        this.modal = document.getElementById('template-modal');

        // Load default templates from file (fetch for client-side)
        this.loadDefaultTemplates();

        // Event Listeners
        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('zoom-fit').addEventListener('click', () => this.fitToScreen());
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());
        document.getElementById('load').addEventListener('click', () => this.loadCatalog());
        document.getElementById('save').addEventListener('click', () => this.saveCatalog());
        document.getElementById('export-png').addEventListener('click', () => this.exportPNG());
        document.getElementById('export-jpg').addEventListener('click', () => this.exportJPG());
        document.getElementById('export-html').addEventListener('click', () => this.exportHTML());
        document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());
        document.getElementById('font-selector').addEventListener('change', (e) => this.applyFont(e.target.value));
        document.getElementById('create-template').addEventListener('click', () => this.openTemplateModal());
        document.getElementById('save-template').addEventListener('click', () => this.saveCustomTemplate());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('add-page').addEventListener('click', () => this.addPage());
        document.getElementById('prev-page').addEventListener('click', () => this.prevPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Editor events
        this.editor.addEventListener('input', () => this.saveToHistory());
        this.editor.addEventListener('keyup', () => this.replacePlaceholders()); // Auto-replace on type

        // Modal close on outside click
        window.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });

        // Initial render
        this.renderCurrentPage();
        this.updateUI();
    }

    // Template Management
    async loadDefaultTemplates() {
        try {
            const response = await fetch('templates.json');
            this.templates = await response.json();
        } catch (e) {
            // Fallback empty
            this.templates = { default: { type: 'static', html: '<h1>{{title}}</h1><p>{{description}}</p>', css: 'h1 { font-size: 24px; }' } };
        }
    }

    openTemplateModal(template = null) {
        if (template) {
            document.getElementById('template-name').value = template.name || '';
            document.getElementById('template-type').value = template.type || 'static';
            document.getElementById('template-html').value = template.html || '';
            document.getElementById('template-css').value = template.css || '';
        }
        this.modal.style.display = 'block';
    }

    saveCustomTemplate() {
        const name = document.getElementById('template-name').value;
        const type = document.getElementById('template-type').value;
        const html = document.getElementById('template-html').value;
        const css = document.getElementById('template-css').value;

        if (!name || !html) {
            this.showStatus('Name and HTML required', 'error');
            return;
        }

        this.templates[name] = { type, html, css };
        localStorage.setItem('catalog-templates', JSON.stringify(this.templates));
        this.closeModal();
        this.showStatus('Template saved!', 'success');
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    // Editor & Pages
    renderCurrentPage() {
        const page = this.pages[this.currentPageIndex];
        this.editor.innerHTML = page.html;
        this.injectCSS(page.css); // Apply page-specific CSS
        this.replacePlaceholders();
        this.applyZoom();
    }

    injectCSS(css) {
        let style = document.getElementById('page-css');
        if (!style) {
            style = document.createElement('style');
            style.id = 'page-css';
            document.head.appendChild(style);
        }
        style.textContent = css;
    }

    replacePlaceholders() {
        // Simple placeholder replacement (extend as needed, e.g., prompt for values)
        this.editor.innerHTML = this.editor.innerHTML.replace(/{{title}}/g, 'Sample Title').replace(/{{description}}/g, 'Sample Description');
    }

    addPage() {
        this.pages.push({ html: '<h1>New Page</h1><p>Edit me...</p>', css: '' });
        this.currentPageIndex = this.pages.length - 1;
        this.renderCurrentPage();
        this.updateUI();
        this.saveToHistory();
    }

    prevPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.renderCurrentPage();
            this.updateUI();
        }
    }

    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.renderCurrentPage();
            this.updateUI();
        }
    }

    updateUI() {
        this.pageCountEl.textContent = `Page ${this.currentPageIndex + 1}/${this.pages.length}`;
        this.zoomLevelEl.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    // Zoom & Fit
    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(this.zoomLevel, 3)); // Clamp 10%-300%
        this.applyZoom();
        this.updateUI();
    }

    applyZoom() {
        this.editor.style.transform = `scale(${this.zoomLevel})`;
    }

    fitToScreen() {
        const container = document.querySelector('.editor-container');
        const editorRect = this.editor.getBoundingClientRect();
        const scaleX = container.clientWidth / editorRect.width;
        const scaleY = (container.clientHeight - 60) / editorRect.height; // Account for nav
        this.zoomLevel = Math.min(scaleX, scaleY);
        this.applyZoom();
        this.updateUI();
    }

    // Undo/Redo
    saveToHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(this.pages))); // Deep copy
        this.historyIndex++;
        if (this.history.length > 50) this.history.shift(); // Limit history
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.pages = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderCurrentPage();
            this.updateUI();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.pages = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderCurrentPage();
            this.updateUI();
        }
    }

    // Save/Load
    saveCatalog() {
        localStorage.setItem('catalog-builder-pages', JSON.stringify(this.pages));
        this.showStatus('Catalog saved!', 'success');
    }

    loadCatalog() {
        const saved = localStorage.getItem('catalog-builder-pages');
        if (saved) {
            this.pages = JSON.parse(saved);
            this.currentPageIndex = 0;
            this.renderCurrentPage();
            this.updateUI();
            this.showStatus('Catalog loaded!', 'success');
        } else {
            this.showStatus('No saved catalog found', 'error');
        }
    }

    // Font Application
    applyFont(font) {
        if (window.getSelection().rangeCount > 0) {
            const selection = window.getSelection().getRangeAt(0);
            const span = document.createElement('span');
            span.className = `font-${font.toLowerCase().replace(' ', '-')}`;
            span.style.fontFamily = font;
            selection.surroundContents(span);
            window.getSelection().removeAllRanges();
        }
    }

    // Exports
    async exportPNG() {
        const canvas = await html2canvas(this.editor);
        this.download(canvas.toDataURL('image/png'), 'catalog-page.png');
    }

    async exportJPG() {
        const canvas = await html2canvas(this.editor, { backgroundColor: '#ffffff' });
        this.download(canvas.toDataURL('image/jpeg', 0.8), 'catalog-page.jpg');
    }

    exportHTML() {
        const page = this.pages[this.currentPageIndex];
        const blob = new Blob([`<html><head><style>${page.css}</style></head><body>${page.html}</body></html>`], { type: 'text/html' });
        this.download(URL.createObjectURL(blob), 'catalog-page.html');
    }

    async exportPDF() {
        this.showStatus('Generating PDF...', 'info');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        for (let i = 0; i < this.pages.length; i++) {
            if (i > 0) pdf.addPage();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.pages[i].html;
            tempDiv.style.cssText = this.pages[i].css + '; width: 210mm; height: 297mm;'; // A4
            document.body.appendChild(tempDiv);
            const canvas = await html2canvas(tempDiv, { scale: 2 });
            document.body.removeChild(tempDiv);
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        }
        pdf.save('catalog.pdf');
        this.showStatus('PDF exported!', 'success');
    }

    download(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    showStatus(message, type = 'info') {
        this.statusEl.textContent = message;
        this.statusEl.className = `status ${type}`;
        this.statusEl.style.display = 'block';
        setTimeout(() => { this.statusEl.style.display = 'none'; }, 3000);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => new CatalogBuilder());