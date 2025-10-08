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
function saveProject() { /* ... unchanged ... */ }
function loadProject(file) { /* ... unchanged ... */ }
async function exportImage(format = 'png') { /* ... unchanged ... */ }
async function exportPDF() { /* ... unchanged ... */ }

// --- CUSTOM TEMPLATES ---
function loadCustomTemplates() { /* ... unchanged ... */ }
function saveCustomTemplate() { /* ... unchanged ... */ }

// --- EVENT LISTENERS ---
function addEventListeners() {
    // --- Desktop Listeners ---
    getEl('add-page-btn').addEventListener('click', addNewPage);
    getEl('page-tabs').addEventListener('click', (e) => { /* ... unchanged ... */ });
    getEl('page-tabs').addEventListener('dblclick', (e) => { /* ... unchanged ... */ });
    getEl('undo-btn').addEventListener('click', undo);
    getEl('redo-btn').addEventListener('click', redo);
    getEl('save-project-btn').addEventListener('click', saveProject);
    const loadInput = getEl('load-project-input');
    getEl('load-project-btn').addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', (e) => { if (e.target.files?.[0]) loadProject(e.target.files[0]); e.target.value = null; });
    getEl('export-dropdown').addEventListener('click', (e) => { /* ... unchanged ... */ });
    getEl('zoom-in-btn').addEventListener('click', () => updateZoom(appState.zoomLevel + 0.1));
    getEl('zoom-out-btn').addEventListener('click', () => updateZoom(appState.zoomLevel - 0.1));
    getEl('zoom-fit-btn').addEventListener('click', () => { const panel = getEl('preview-panel'); updateZoom((panel.clientWidth - 60) / appState.pageDimensions.width); });

    // --- Mobile Listeners ---
    const inspectorPanel = getEl('inspector-panel');
    getEl('mobile-toggle-inspector').addEventListener('click', () => inspectorPanel.classList.toggle('is-open'));
    getEl('mobile-close-inspector').addEventListener('click', () => inspectorPanel.classList.remove('is-open'));
    getEl('mobile-page-switcher').addEventListener('change', (e) => switchPage(parseInt(e.target.value, 10)));
    
    // Mobile Dropdown Menu Logic
    const mobileMenuDropdown = getEl('mobile-menu-dropdown');
    getEl('mobile-more-actions').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the global click listener from firing immediately
        mobileMenuDropdown.classList.toggle('is-active');
    });
    
    // Wire up menu items to close menu on click
    const mobileMenuLinks = mobileMenuDropdown.querySelectorAll('a');
    const createMobileAction = (action) => (e) => {
        e.preventDefault();
        action();
        mobileMenuDropdown.classList.remove('is-active');
    };
    getEl('mobile-add-page-btn').addEventListener('click', createMobileAction(addNewPage));
    getEl('mobile-undo-btn').addEventListener('click', createMobileAction(undo));
    getEl('mobile-redo-btn').addEventListener('click', createMobileAction(redo));
    getEl('mobile-save-btn').addEventListener('click', createMobileAction(saveProject));
    getEl('mobile-load-btn').addEventListener('click', createMobileAction(() => getEl('load-project-input').click()));
    getEl('mobile-export-pdf-btn').addEventListener('click', createMobileAction(exportPDF));

    // --- Global Listeners ---
    document.addEventListener('click', () => {
        // Close mobile menu if open
        if (mobileMenuDropdown.classList.contains('is-active')) {
            mobileMenuDropdown.classList.remove('is-active');
        }
    });

    getEl('preview-canvas').addEventListener('click', (e) => { /* ... unchanged ... */ });
    getEl('preview-canvas').addEventListener('dblclick', (e) => { /* ... unchanged ... */ });
    getEl('preview-panel').addEventListener('scroll', () => { if (getEl('font-toolbar').style.display === 'flex') { import('./ui.js').then(ui => ui.updateFontToolbar()); }});
    getEl('font-toolbar').addEventListener('change', (e) => { /* ... unchanged ... */ });
    const templateModal = getEl('template-modal');
    templateModal.querySelector('.close-modal-btn').addEventListener('click', () => templateModal.style.display = 'none');
    getEl('save-template-btn').addEventListener('click', saveCustomTemplate);
    document.addEventListener('keydown', handleKeyboardShortcuts);
    new Sortable(getEl('page-tabs'), { /* ... unchanged ... */ });
}

function handleKeyboardShortcuts(e) { /* ... unchanged ... */ }

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

    } catch(error) {
        console.error("Failed to initialize application:", error);
        document.body.innerHTML = `<div style="padding: 20px; text-align: center;"><h1>Error</h1><p>Could not load required template files. Please check the console for details.</p></div>`;
    }
}

// --- START THE APP ---
document.addEventListener('DOMContentLoaded', init);