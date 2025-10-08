// Enhanced Magic Slide Catalog Builder
class MagicSlideBuilder {
    constructor() {
        this.pages = [{ html: '<h1>{{title}}</h1><p>{{description}}</p>', css: '', elements: [] }];
        this.currentPageIndex = 0;
        this.zoomLevel = 1;
        this.history = [];
        this.historyIndex = -1;
        this.templates = {};
        this.customFonts = new Map(); // For uploaded fonts
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.editor = document.getElementById('editor');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.pageCountEl = document.getElementById('page-count');
        this.statusEl = document.getElementById('status');
        this.modal = document.getElementById('template-modal');
        this.fontModal = document.getElementById('font-editor-modal');
        this.layerList = document.getElementById('layer-list');

        this.loadDefaultTemplates();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUI();
        this.startAutoSave();
    }

    setupEventListeners() {
        // WYSIWYG Tools
        document.getElementById('bold').addEventListener('click', () => document.execCommand('bold'));
        document.getElementById('italic').addEventListener('click', () => document.execCommand('italic'));
        document.getElementById('underline').addEventListener('click', () => document.execCommand('underline'));
        document.getElementById('ul-list').addEventListener('click', () => document.execCommand('insertUnorderedList'));
        document.getElementById('ol-list').addEventListener('click', () => document.execCommand('insertOrderedList'));
        document.getElementById('align-left').addEventListener('click', () => document.execCommand('justifyLeft'));
        document.getElementById('align-center').addEventListener('click', () => document.execCommand('justifyCenter'));
        document.getElementById('align-right').addEventListener('click', () => document.execCommand('justifyRight'));
        document.getElementById('text-color').addEventListener('change', (e) => document.execCommand('foreColor', false, e.target.value));
        document.getElementById('accent-color').addEventListener('change', (e) => this.updateAccentColor(e.target.value));

        // Other buttons (zoom, undo, etc. - expanded from previous)
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
        document.querySelector('.close').addEventListener('click', () => this.closeModal()); // Works for both modals
        document.getElementById('add-page').addEventListener('click', () => this.addPage());
        document.getElementById('prev-page').addEventListener('click', () => this.prevPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // New Features
        document.getElementById('templates-btn').addEventListener('click', () => this.populateTemplateList());
        document.getElementById('template-list').addEventListener('change', (e) => this.loadTemplate(e.target.value));
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('font-editor').addEventListener('click', () => this.openFontModal());
        document.getElementById('font-upload').addEventListener('change', (e) => this.loadCustomFont(e.target.files[0]));
        document.getElementById('apply-custom-font').addEventListener('click', () => this.applyCustomFont());
        document.getElementById('image-upload').addEventListener('click', () => this.uploadImage());
        document.getElementById('add-text').addEventListener('click', () => this.addElement('text'));
        document.getElementById('add-image').addEventListener('click', () => this.addElement('image'));
        document.getElementById('add-shape').addEventListener('click', () => this.addElement('shape'));
        document.getElementById('preview-mobile').addEventListener('click', () => this.togglePreview('mobile'));
        document.getElementById('preview-desktop').addEventListener('click', () => this.togglePreview('desktop'));

        // Editor events
        this.editor.addEventListener('input', () => this.saveToHistory());
        this.editor.addEventListener('keyup', () => this.replacePlaceholders());
        this.editor.addEventListener('DOMSubtreeModified', () => this.updateLayers());

        window.addEventListener('click', (e) => { 
            if (e.target === this.modal || e.target === this.fontModal) this.closeModal(); 
        });
        window.addEventListener('dragover', (e) => e.preventDefault());
        window.addEventListener('drop', (e) => { e.preventDefault(); this.handleDrop(e); });
    }

    // Template Management (Enhanced with Preloads)
    async loadDefaultTemplates() {
        try {
            const response = await fetch('templates.json');
            this.templates = await response.json();
            this.populateTemplateList();
        } catch (e) {
            this.templates = {
                "product-card": { type: "static", html: '<div class="product-card"><img src="{{image}}"><h2>{{title}}</h2><p>{{price}}</p></div>', css: '.product-card { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }' },
                "newsletter": { type: "interactive", html: '<table><tr><td><h1>{{header}}</td></tr><tr><td>{{content}}</td></tr></table>', css: 'table { width: 100%; border-collapse: collapse; }' },
                "flyer": { type: "static", html: '<div class="flyer"><h1>{{event}}</h1><p>{{details}} <img src="{{logo}}"></p></div>', css: '.flyer { text-align: center; background: linear-gradient(to bottom, #fff, #f0f0f0); }' },
                // Add more preloads as needed
            };
        }
    }

    populateTemplateList() {
        const select = document.getElementById('template-list');
        select.innerHTML = '<option value="">Load Preloaded Template</option>';
        Object.keys(this.templates).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key.replace('-', ' ').toUpperCase();
            select.appendChild(option);
        });
    }

    loadTemplate(name) {
        if (!name) return;
        const template = this.templates[name];
        this.pages[this.currentPageIndex] = { html: template.html, css: template.css, elements: [] };
        this.renderCurrentPage();
        this.showStatus(`Loaded template: ${name}`, 'success');
    }

    // WYSIWYG & Editor Enhancements
    updateAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
        this.saveToHistory();
    }

    addElement(type) {
        let html = '';
        if (type === 'text') html = '<p contenteditable="true">New Text</p>';
        else if (type === 'image') html = '<img src="" alt="New Image" draggable="true">';
        else if (type === 'shape') html = '<div style="width:100px;height:100px;background:#007bff;border-radius:50%;"></div>';
        this.editor.insertAdjacentHTML('beforeend', html);
        this.updateLayers();
    }

    updateLayers() {
        const elements = Array.from(this.editor.children).map((el, i) => ({ id: i, tag: el.tagName, content: el.textContent?.substring(0,20) || el.src || 'Shape' }));
        this.layerList.innerHTML = elements.map(el => `<li draggable="true" data-id="${el.id}">${el.tag}: ${el.content}</li>`).join('');
    }

    handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) this.uploadImage(files[0]);
    }

    uploadImage(file = null) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (!file) input.click();
        else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '200px';
                this.editor.appendChild(img);
                this.updateLayers();
            };
            reader.readAsDataURL(file);
        }
        input.onchange = (e) => this.uploadImage(e.target.files[0]);
    }

    // Font Editor
    openFontModal() {
        this.fontModal.style.display = 'block';
    }

    loadCustomFont(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const fontName = file.name.replace(/\.[^/.]+$/, '');
            const fontFace = new FontFace(fontName, e.target.result);
            fontFace.load().then(() => {
                document.fonts.add(fontFace);
                this.customFonts.set(fontName, fontName);
                document.getElementById('font-preview').style.fontFamily = fontName;
                this.showStatus(`Font ${fontName} loaded`, 'success');
            });
        };
        reader.readAsArrayBuffer(file);
    }

    applyCustomFont() {
        const fontName = document.getElementById('font-upload').files[0]?.name.replace(/\.[^/.]+$/, '') || '';
        if (this.customFonts.has(fontName)) {
            document.execCommand('fontName', false, fontName);
            this.closeModal();
        }
    }

    // Theme & Preview
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        document.querySelector('.toolbar').classList.toggle('dark-theme');
        // Toggle icon
        document.getElementById('theme-toggle').textContent = document.body.classList.contains('dark-theme') ? '☀' : '🌙';
    }

    togglePreview(mode) {
        this.editor.className = `catalog-editor neumorphic ${mode === 'mobile' ? 'preview-mobile' : 'preview-desktop'}`;
    }

    // Auto-Save
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => this.saveCatalog(true), 30000); // 30s
    }

    // Core Functions (From Previous, Slightly Enhanced)
    renderCurrentPage() {
        const page = this.pages[this.currentPageIndex];
        this.editor.innerHTML = page.html;
        this.injectCSS(page.css);
        this.replacePlaceholders();
        this.applyZoom();
        this.updateLayers();
    }

    injectCSS(css) {
        let style = document.getElementById('page-css');
        if (!style) {
            style = document.createElement('style');
            style.id = 'page-css';
            document.head.appendChild(style);
        }
        style.textContent = `:root { --accent-color: ${document.documentElement.style.getPropertyValue('--accent-color') || '#007bff'}; } ${css}`;
    }

    replacePlaceholders() {
        this.editor.innerHTML = this.editor.innerHTML
            .replace(/{{title}}/g, 'Sample Title')
            .replace(/{{description}}/g, 'Sample Description')
            .replace(/{{price}}/g, '$19.99')
            .replace(/{{event}}/g, 'Event Name')
            .replace(/{{header}}/g, 'Newsletter Header')
            .replace(/{{content}}/g, 'Your content here...')
            .replace(/{{image}}/g, 'https://via.placeholder.com/300x200')
            .replace(/{{logo}}/g, 'https://via.placeholder.com/100x50');
    }

    // Zoom, Undo/Redo, Save/Load, Exports (Same as before, but with auto-save flag)
    zoom(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.1, Math.min(this.zoomLevel, 3));
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
        const scaleY = (container.clientHeight - 60) / editorRect.height;
        this.zoomLevel = Math.min(scaleX, scaleY);
        this.applyZoom();
        this.updateUI();
    }

    saveToHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(this.pages)));
        this.historyIndex++;
        if (this.history.length > 50) this.history.shift();
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

    saveCatalog(silent = false) {
        localStorage.setItem('magic-slide-pages', JSON.stringify(this.pages));
        localStorage.setItem('magic-slide-history', JSON.stringify({ history: this.history, index: this.historyIndex }));
        if (!silent) this.showStatus('Auto-saved!', 'success');
    }

    loadCatalog() {
        const saved = localStorage.getItem('magic-slide-pages');
        if (saved) {
            this.pages = JSON.parse(saved);
            const hist = localStorage.getItem('magic-slide-history');
            if (hist) {
                const { history, index } = JSON.parse(hist);
                this.history = history;
                this.historyIndex = index;
            }
            this.currentPageIndex = 0;
            this.renderCurrentPage();
            this.updateUI();
            this.showStatus('Loaded!', 'success');
        }
    }

    applyFont(font) {
        document.execCommand('fontName', false, font);
    }

    // Exports (Enhanced with higher res)
    async exportPNG() {
        const canvas = await html2canvas(this.editor, { scale: 2 });
        this.download(canvas.toDataURL('image/png'), 'magic-slide.png');
    }

    async exportJPG() {
        const canvas = await html2canvas(this.editor, { backgroundColor: '#ffffff', scale: 2 });
        this.download(canvas.toDataURL('image/jpeg', 0.9), 'magic-slide.jpg');
    }

    exportHTML() {
        const page = this.pages[this.currentPageIndex];
        const fullCSS = document.getElementById('page-css')?.textContent || page.css;
        const blob = new Blob([`<html><head><style>${fullCSS}</style></head><body>${page.html}</body></html>`], { type: 'text/html' });
        this.download(URL.createObjectURL(blob), 'magic-slide.html');
    }

    async exportPDF() {
        this.showStatus('Generating PDF...', 'info');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        for (let i = 0; i < this.pages.length; i++) {
            if (i > 0) pdf.addPage();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.pages[i].html;
            tempDiv.style.cssText = this.pages[i].css + '; width: 210mm; height: 297mm; padding: 20mm;';
            document.body.appendChild(tempDiv);
            const canvas = await html2canvas(tempDiv, { scale: 2 });
            document.body.removeChild(tempDiv);
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        }
        pdf.save('magic-slide.pdf');
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

    // Page Navigation (Unchanged)
    addPage() {
        this.pages.push({ html: '<p>New Page</p>', css: '', elements: [] });
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

    // Modals (Generic Close)
    openTemplateModal() {
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
        localStorage.setItem('magic-slide-templates', JSON.stringify(this.templates));
        this.closeModal();
        this.populateTemplateList();
        this.showStatus('Template saved!', 'success');
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.fontModal.style.display = 'none';
    }

    showStatus(message, type = 'info') {
        this.statusEl.textContent = message;
        this.statusEl.className = `status neumorphic ${type}`;
        this.statusEl.style.display = 'block';
        setTimeout(() => { this.statusEl.style.display = 'none'; }, 3000);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => new MagicSlideBuilder());