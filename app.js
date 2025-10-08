class CatalogBuilder {
    constructor() {
        this.pages = [{ name: "Page 1", template: "cover", content: "Product Details", image: "", overlayColor: "#00000080", header: "Welcome", title: "Catalog 2025", footer: "© 2025 Company", html: "", css: "" }];
        this.currentPageIndex = 0;
        this.zoomLevel = 0.5;
        this.templates = {};
        this.init();
    }

    init() {
        this.editor = document.getElementById('editor');
        this.pageInfo = document.getElementById('page-info');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.statusEl = document.getElementById('status');
        this.modal = document.getElementById('template-modal');

        this.loadDefaultTemplates();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(0.9));
        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(1.1));
        document.getElementById('zoom-fit').addEventListener('click', () => this.fitToScreen());
        document.getElementById('load').addEventListener('click', () => this.loadCatalog());
        document.getElementById('save').addEventListener('click', () => this.saveCatalog());
        document.getElementById('export').addEventListener('click', () => this.showExportOptions());
        document.getElementById('create-template').addEventListener('click', () => this.openTemplateModal());
        document.getElementById('save-template').addEventListener('click', () => this.saveCustomTemplate());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('page-name').addEventListener('input', () => this.updatePageName());
        document.getElementById('template-select').addEventListener('change', () => this.updateTemplate());
        document.getElementById('classic-content').addEventListener('input', () => this.updateContent());
        document.getElementById('image-upload').addEventListener('change', (e) => this.updateImage(e.target.files[0]));
        document.getElementById('overlay-color').addEventListener('input', () => this.updateOverlayColor());
        document.getElementById('header-text').addEventListener('input', () => this.updateHeader());
        document.getElementById('main-title').addEventListener('input', () => this.updateTitle());
        document.getElementById('footer-text').addEventListener('input', () => this.updateFooter());

        this.editor.addEventListener('input', () => this.saveToHistory());
        window.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });
    }

    loadDefaultTemplates() {
        this.templates = {
            "cover": {
                html: '<div style="position: relative; width: 100%; height: 100%;"><img src="{{image}}" style="width: 100%; height: 100%; object-fit: cover;"><div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: {{overlayColor}}; display: flex; flex-direction: column; justify-content: space-between; color: white; padding: 20mm;"><div>{{header}}</div><div style="flex-grow: 1; display: flex; align-items: center; justify-content: center;"><h1>{{title}}</h1></div><div>{{footer}}</div></div></div>',
                css: 'img { max-height: 297mm; } h1 { font-size: 48px; margin: 0; }'
            },
            "content": {
                html: '<div style="padding: 20mm; text-align: center;"><h1>{{title}}</h1><p>{{content}}</p><p>{{footer}}</p><img src="{{image}}" style="max-width: 100%; height: auto;" /></div>',
                css: 'h1 { font-size: 32px; margin-bottom: 20px; } p { font-size: 18px; line-height: 1.6; }'
            }
        };
        this.updateTemplate();
    }

    updatePageName() {
        this.pages[this.currentPageIndex].name = document.getElementById('page-name').value;
        this.updateUI();
    }

    updateTemplate() {
        const template = document.getElementById('template-select').value;
        this.pages[this.currentPageIndex].template = template;
        this.renderCurrentPage();
    }

    updateContent() {
        this.pages[this.currentPageIndex].content = document.getElementById('classic-content').value;
        this.renderCurrentPage();
    }

    updateImage(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.pages[this.currentPageIndex].image = e.target.result;
                this.renderCurrentPage();
            };
            reader.readAsDataURL(file);
        }
    }

    updateOverlayColor() {
        this.pages[this.currentPageIndex].overlayColor = document.getElementById('overlay-color').value;
        this.renderCurrentPage();
    }

    updateHeader() {
        this.pages[this.currentPageIndex].header = document.getElementById('header-text').value;
        this.renderCurrentPage();
    }

    updateTitle() {
        this.pages[this.currentPageIndex].title = document.getElementById('main-title').value;
        this.renderCurrentPage();
    }

    updateFooter() {
        this.pages[this.currentPageIndex].footer = document.getElementById('footer-text').value;
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        const page = this.pages[this.currentPageIndex];
        const template = this.templates[page.template] || this.templates["cover"];
        let html = template.html
            .replace('{{image}}', page.image || 'https://via.placeholder.com/210x297')
            .replace('{{overlayColor}}', page.overlayColor)
            .replace('{{header}}', page.header)
            .replace('{{title}}', page.title)
            .replace('{{content}}', page.content)
            .replace('{{footer}}', page.footer);
        this.editor.innerHTML = html;
        this.injectCSS(template.css);
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

    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(this.zoomLevel, 2));
        this.applyZoom();
        this.updateUI();
    }

    applyZoom() {
        this.editor.style.transform = `scale(${this.zoomLevel})`;
    }

    fitToScreen() {
        const container = document.querySelector('.editor-container');
        const editorRect = this.editor.getBoundingClientRect();
        this.zoomLevel = container.clientWidth / editorRect.width;
        this.applyZoom();
        this.updateUI();
    }

    saveToHistory() {
        localStorage.setItem('catalog-builder-pages', JSON.stringify(this.pages));
    }

    saveCatalog() {
        localStorage.setItem('catalog-builder-pages', JSON.stringify(this.pages));
        this.showStatus('Saved!', 'success');
    }

    loadCatalog() {
        const saved = localStorage.getItem('catalog-builder-pages');
        if (saved) {
            this.pages = JSON.parse(saved);
            this.currentPageIndex = 0;
            this.renderCurrentPage();
            this.updateUI();
            this.showStatus('Loaded!', 'success');
        }
    }

    showExportOptions() {
        const format = prompt('Export as (png/jpg/html/pdf)?', 'pdf');
        if (format) {
            if (format.toLowerCase() === 'png') this.exportPNG();
            else if (format.toLowerCase() === 'jpg') this.exportJPG();
            else if (format.toLowerCase() === 'html') this.exportHTML();
            else if (format.toLowerCase() === 'pdf') this.exportPDF();
        }
    }

    async exportPNG() {
        const canvas = await html2canvas(this.editor, { scale: 2 });
        this.download(canvas.toDataURL('image/png'), 'catalog-page.png');
    }

    async exportJPG() {
        const canvas = await html2canvas(this.editor, { backgroundColor: '#ffffff', scale: 2 });
        this.download(canvas.toDataURL('image/jpeg', 0.9), 'catalog-page.jpg');
    }

    exportHTML() {
        const page = this.pages[this.currentPageIndex];
        const template = this.templates[page.template];
        const blob = new Blob([`<html><head><style>${template.css}</style></head><body>${this.editor.innerHTML}</body></html>`], { type: 'text/html' });
        this.download(URL.createObjectURL(blob), 'catalog-page.html');
    }

    async exportPDF() {
        this.showStatus('Generating PDF...', 'info');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const canvas = await html2canvas(this.editor, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        pdf.save('catalog.pdf');
        this.showStatus('PDF ready!', 'success');
    }

    download(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    openTemplateModal() {
        this.modal.style.display = 'block';
    }

    saveCustomTemplate() {
        const name = document.getElementById('template-name').value;
        const html = document.getElementById('template-html').value;
        const css = document.getElementById('template-css').value;
        if (name && html) {
            this.templates[name] = { html, css };
            localStorage.setItem('catalog-templates', JSON.stringify(this.templates));
            this.closeModal();
            const select = document.getElementById('template-select');
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
            this.showStatus('Template saved!', 'success');
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    updateUI() {
        this.pageInfo.textContent = `${this.pages[this.currentPageIndex].name} of ${this.pages.length}`;
        this.zoomLevelEl.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }

    showStatus(message, type = 'info') {
        this.statusEl.textContent = message;
        this.statusEl.className = `status ${type}`;
        this.statusEl.style.display = 'block';
        setTimeout(() => { this.statusEl.style.display = 'none'; }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => new CatalogBuilder());