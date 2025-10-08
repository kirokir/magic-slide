import {
    appState,
    resetState,
    recordState,
    debouncedRecordState,
    undo,
    redo,
    getEl,
    getCurrentPage,
    getSelectedElement,
    deselectAll
} from './state.js';

import {
    render,
    showToast
} from './ui.js';

// --- CORE LOGIC & STATE UPDATERS ---
export function updatePageProperty(prop, value, shouldRecord = true) {
    const page = getCurrentPage();
    if (page && page[prop] !== value) {
        if (shouldRecord) recordState();
        page[prop] = value;
        render();
    }
}
export function updatePageContentProperty(prop, value, shouldRecord = true) {
    const page = getCurrentPage();
    if (page && page.content[prop] !== value) {
        if (shouldRecord) recordState();
        page.content[prop] = value;
        render();
    }
}
export function updateElementProperty(prop, value, shouldDebounceRecord = false) {
    const el = getSelectedElement();
    if (el && el[prop] !== value) {
        if (shouldDebounceRecord) debouncedRecordState();
        else recordState();
        el[prop] = value;
        render();
    }
}
export function updateElementStyleProperty(prop, value) {
    const el = getSelectedElement();
    if (el && el.style[prop] !== value) {
        recordState();
        el.style[prop] = value;
        render();
    }
}

// --- PAGE & ELEMENT MANAGEMENT ---
function addNewPage() {
    recordState();
    const newPage = { id: `page_${Date.now()}`, name: `Page ${appState.pages.length + 1}`, template: 'freestyle', content: {}, products: [], elements: [] };
    appState.pages.push(newPage);
    switchPage(appState.pages.length - 1);
}
function switchPage(index) {
    if (index < 0 || index >= appState.pages.length || appState.currentPageIndex === index) return;
    appState.currentPageIndex = index;
    deselectAll();
    render();
}
function deletePage(index) {
    if (appState.pages.length <= 1) { showToast("Cannot delete the last page."); return; }
    if (confirm(`Are you sure you want to delete page "${appState.pages[index].name}"?`)) {
        recordState();
        appState.pages.splice(index, 1);
        if (appState.currentPageIndex >= index) {
            appState.currentPageIndex = Math.max(0, appState.currentPageIndex - 1);
        }
        render();
    }
}
function renamePage(index, newName) { if (newName && newName.trim() !== '') { updatePageProperty('name', newName.trim()); } }
export function addElement(type, options = {}) {
    recordState();
    const page = getCurrentPage();
    const newElement = { id: `el_${Date.now()}`, type, x: 50, y: 50, zIndex: page.elements.length, width: 200, height: 100, content: '', style: {}, isVisible: true };
    if (type === 'text') { newElement.content = 'New Text'; newElement.style = { fontFamily: 'Arial', fontSize: '16px', color: '#000000' }; }
    else if (type === 'shape') { newElement.width = 100; newElement.height = 100; newElement.content = '<svg viewBox="0 0 100 100"><rect width="100" height="100"></rect></svg>'; newElement.style = { color: '#cccccc' }; }
    else if (type === 'image') { newElement.width = 300; newElement.height = 200; newElement.src = options.src || 'https://via.placeholder.com/300x200'; }
    page.elements.push(newElement);
    selectElement(newElement.id);
}
export function deleteElement(id) {
    recordState();
    const page = getCurrentPage();
    const index = page.elements.findIndex(el => el.id === id);
    if (index > -1) { page.elements.splice(index, 1); if (appState.selectedElementId === id) deselectAll(); render(); }
}
export function selectElement(id) { if (appState.selectedElementId === id) return; deselectAll(); appState.selectedElementId = id; render(); }

// --- ZOOM & UI ---
export function updateZoom(newZoomLevel) {
    appState.zoomLevel = Math.max(0.1, Math.min(3, newZoomLevel));
    getEl('preview-canvas-wrapper').style.transform = `scale(${appState.zoomLevel})`;
    getEl('zoom-display').textContent = `${Math.round(appState.zoomLevel * 100)}%`;
}

// --- PROJECT SAVE/LOAD/EXPORT ---
const commitPendingChanges = () => document.activeElement?.blur();
function saveProject() {
    commitPendingChanges();
    const dataToSave = { ...appState, templates: {} };
    const data = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog-project.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Project Saved!');
}
function loadProject(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const loadedState = JSON.parse(event.target.result);
            if (loadedState?.pages && Array.isArray(loadedState.pages)) {
                loadedState.templates = appState.templates;
                loadedState.pages.forEach(p => { if (p.elements) p.elements.forEach(el => { el.isVisible = el.isVisible ?? true; }); });
                Object.assign(appState, loadedState);
                recordState();
                render();
                showToast('Project Loaded Successfully.');
            } else { throw new Error('Invalid format'); }
        } catch (error) { console.error('Error loading project:', error); alert('Failed to load project file.'); }
    };
    reader.readAsText(file);
}
async function exportImage(format = 'png') {
    commitPendingChanges();
    deselectAll();
    render();
    await new Promise(r => setTimeout(r, 100));
    const canvas = await html2canvas(getEl('preview-canvas'));
    const a = document.createElement('a');
    a.href = canvas.toDataURL(`image/${format}`);
    a.download = `${getCurrentPage().name}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
}
async function exportPDF() {
    commitPendingChanges();
    deselectAll();
    render();
    await new Promise(r => setTimeout(r, 100));
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [appState.pageDimensions.width, appState.pageDimensions.height] });
    const loadingOverlay = getEl('loading-overlay');
    loadingOverlay.style.display = 'flex';
    const originalIndex = appState.currentPageIndex;
    for (let i = 0; i < appState.pages.length; i++) {
        getEl('loading-message').textContent = `Processing page ${i + 1} of ${appState.pages.length}...`;
        switchPage(i);
        await new Promise(resolve => setTimeout(resolve, 200));
        const canvas = await html2canvas(getEl('preview-canvas'), { scale: 2 });
        if (i > 0) pdf.addPage([appState.pageDimensions.width, appState.pageDimensions.height], 'p');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, appState.pageDimensions.width, appState.pageDimensions.height);
    }
    pdf.save('catalog.pdf');
    loadingOverlay.style.display = 'none';
    showToast('PDF Exported Successfully!');
    switchPage(originalIndex);
}

// --- CUSTOM TEMPLATES ---
function loadCustomTemplates() {
    const custom = localStorage.getItem('custom-catalog-templates');
    if (custom) { try { Object.assign(appState.templates, JSON.parse(custom)); } catch (e) { console.error("Could not load custom templates", e); } }
}
function saveCustomTemplate() {
    const name = getEl('template-name-input').value.trim(), id = name.toLowerCase().replace(/[\s_]+/g, '-'), type = getEl('template-type-select').value, html = getEl('template-html-input').value, css = getEl('template-css-input').value;
    if (!name || !id) { alert('Template name is required.'); return; }
    const newTemplate = { name, type, html, css };
    const custom = JSON.parse(localStorage.getItem('custom-catalog-templates') || '{}');
    custom[id] = newTemplate;
    localStorage.setItem('custom-catalog-templates', JSON.stringify(custom));
    appState.templates[id] = newTemplate;
    getEl('template-modal').style.display = 'none';
    render();
    showToast(`Template "${name}" saved!`);
}

// --- EVENT LISTENERS ---
function addEventListeners() {
    // --- Desktop Listeners ---
    getEl('add-page-btn').addEventListener('click', addNewPage);
    getEl('page-tabs').addEventListener('click', (e) => { const tab = e.target.closest('.page-tab'); if (!tab) return; const index = parseInt(tab.dataset.index); if (e.target.classList.contains('close-tab-btn')) { deletePage(index); } else { switchPage(index); } });
    getEl('page-tabs').addEventListener('dblclick', (e) => { const nameSpan = e.target.closest('.tab-name'); if (nameSpan) { const index = parseInt(nameSpan.closest('.page-tab').dataset.index); const newName = prompt('Enter new page name:', appState.pages[index].name); if (newName) renamePage(index, newName); } });
    getEl('undo-btn').addEventListener('click', undo);
    getEl('redo-btn').addEventListener('click', redo);
    getEl('save-project-btn').addEventListener('click', saveProject);
    const loadInput = getEl('load-project-input');
    getEl('load-project-btn').addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', (e) => { if (e.target.files?.[0]) loadProject(e.target.files[0]); e.target.value = null; });
    getEl('export-dropdown').addEventListener('click', (e) => { e.preventDefault(); const id = e.target.id; if (id === 'export-png-btn') exportImage('png'); if (id === 'export-jpeg-btn') exportImage('jpeg'); if (id === 'export-pdf-btn') exportPDF(); e.target.closest('.dropdown').blur(); });
    getEl('zoom-in-btn').addEventListener('click', () => updateZoom(appState.zoomLevel + 0.1));
    getEl('zoom-out-btn').addEventListener('click', () => updateZoom(appState.zoomLevel - 0.1));
    getEl('zoom-fit-btn').addEventListener('click', () => { const panel = getEl('preview-panel'); updateZoom((panel.clientWidth - 60) / appState.pageDimensions.width); });

    // --- Mobile Listeners ---
    const inspectorPanel = getEl('inspector-panel');
    getEl('mobile-toggle-inspector').addEventListener('click', () => inspectorPanel.classList.toggle('is-open'));
    getEl('mobile-close-inspector').addEventListener('click', () => inspectorPanel.classList.remove('is-open'));
    getEl('mobile-page-switcher').addEventListener('change', (e) => switchPage(parseInt(e.target.value, 10)));
    const mobileMenuDropdown = getEl('mobile-menu-dropdown');
    getEl('mobile-more-actions').addEventListener('click', (e) => { e.stopPropagation(); mobileMenuDropdown.classList.toggle('is-active'); });
    const createMobileAction = (action) => (e) => { e.preventDefault(); action(); mobileMenuDropdown.classList.remove('is-active'); };
    getEl('mobile-add-page-btn').addEventListener('click', createMobileAction(addNewPage));
    getEl('mobile-undo-btn').addEventListener('click', createMobileAction(undo));
    getEl('mobile-redo-btn').addEventListener('click', createMobileAction(redo));
    getEl('mobile-save-btn').addEventListener('click', createMobileAction(saveProject));
    getEl('mobile-load-btn').addEventListener('click', createMobileAction(() => getEl('load-project-input').click()));
    getEl('mobile-export-pdf-btn').addEventListener('click', createMobileAction(exportPDF));

    // --- Global Listeners ---
    document.addEventListener('click', () => { if (mobileMenuDropdown.classList.contains('is-active')) { mobileMenuDropdown.classList.remove('is-active'); } });
    getEl('preview-canvas').addEventListener('click', (e) => { const iEl = e.target.closest('.interactive-element'), pCard = e.target.closest('.product-card'); if (iEl) { selectElement(iEl.dataset.id); } else if (pCard) { deselectAll(); appState.selectedProductIndex = parseInt(pCard.dataset.index); render(); } else if (appState.selectedElementId || appState.selectedProductIndex > -1) { deselectAll(); render(); } });
    getEl('preview-canvas').addEventListener('dblclick', (e) => { const elDiv = e.target.closest('.interactive-element'); if (!elDiv) return; const el = getSelectedElement(); if (el?.type === 'text') { const cDiv = elDiv.querySelector('.element-content'); if (cDiv) { cDiv.contentEditable = true; cDiv.focus(); } } });
    getEl('preview-panel').addEventListener('scroll', () => { if (getEl('font-toolbar').style.display === 'flex') { import('./ui.js').then(ui => ui.updateFontToolbar()); }});
    getEl('font-toolbar').addEventListener('change', (e) => { const el = getSelectedElement(); if (!el || el.type !== 'text') return; const pMap = { 'font-family-select': 'fontFamily', 'font-size-input': 'fontSize', 'font-color-input': 'color' }; const prop = pMap[e.target.id]; const val = e.target.id === 'font-size-input' ? `${e.target.value}px` : e.target.value; updateElementStyleProperty(prop, val); });
    const templateModal = getEl('template-modal');
    templateModal.querySelector('.close-modal-btn').addEventListener('click', () => templateModal.style.display = 'none');
    getEl('save-template-btn').addEventListener('click', saveCustomTemplate);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    new Sortable(getEl('page-tabs'), { animation: 150, onEnd: (evt) => { recordState(); const page = appState.pages.splice(evt.oldIndex, 1)[0]; appState.pages.splice(evt.newIndex, 0, page); const id = getCurrentPage().id; appState.currentPageIndex = appState.pages.findIndex(p => p.id === id); render(); } });
}

function handleKeyboardShortcuts(e) {
    if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlCmd = isMac ? e.metaKey : e.ctrlKey;
    if (ctrlCmd) { switch (e.key.toLowerCase()) { case 'z': e.preventDefault(); undo(); break; case 'y': e.preventDefault(); redo(); break; case 's': e.preventDefault(); saveProject(); break; } }
    else { const el = getSelectedElement(); if(!el) return; switch (e.key) { case 'Delete': case 'Backspace': e.preventDefault(); deleteElement(el.id); break; case 'Escape': e.preventDefault(); deselectAll(); render(); break; case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': e.preventDefault(); const a = e.shiftKey ? 10 : 1; if (e.key === 'ArrowUp') el.y -= a; if (e.key === 'ArrowDown') el.y += a; if (e.key === 'ArrowLeft') el.x -= a; if (e.key === 'ArrowRight') el.x += a; debouncedRecordState(); render(); break; } }
}

// --- INITIALIZATION ---
async function init() {
    try {
        const response = await fetch('./templates.json');
        const defaultTemplates = await response.json();
        
        resetState();
        appState.templates = defaultTemplates;
        loadCustomTemplates();
        
        const newPage = { id: `page_${Date.now()}`, name: `Page 1`, template: 'freestyle', content: {}, products: [], elements: [] };
        appState.pages.push(newPage);
        appState.currentPageIndex = 0;
        
        addEventListeners();
        recordState();
        render();

        // Register the PWA Service Worker
        if ('serviceWorker' in navigator) {
            // Use ./ for relative path, fixing the 404 error on GitHub Pages
            navigator.serviceWorker.register('./service-worker.js').then(registration => {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
              console.log('ServiceWorker registration failed: ', err);
            });
        }

    } catch(error) {
        console.error("Failed to initialize application:", error);
        document.body.innerHTML = `<div style="padding: 20px; text-align: center;"><h1>Error</h1><p>Could not load required template files. Please check the console for details.</p></div>`;
    }
}

// --- START THE APP ---
// This listener ensures the init function is called only after the HTML is fully parsed.
document.addEventListener('DOMContentLoaded', init);