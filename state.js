import { render } from './ui.js';

// --- APPLICATION STATE ---
export let appState = {};
export let history = [];
export let redoStack = [];
let isNavigatingHistory = false;

export const getEl = (id) => document.getElementById(id);

export function resetState() {
    appState = {
        pages: [],
        currentPageIndex: -1,
        selectedElementId: null,
        selectedProductIndex: -1,
        zoomLevel: 1.0,
        pageDimensions: { width: 827, height: 1169 },
        templates: {}
    };
    history = [];
    redoStack = [];
}

// --- HISTORY MANAGEMENT ---
export const recordState = () => {
    if (isNavigatingHistory) return;
    try {
        const stateString = JSON.stringify(appState);
        const lastStateString = history.length > 0 ? JSON.stringify(history[history.length - 1]) : null;
        if (stateString === lastStateString) return;

        history.push(JSON.parse(stateString));
        redoStack = [];
        if (history.length > 50) history.shift();
        updateUndoRedoButtons();
    } catch (e) {
        console.error("Failed to record state. State might be too large or complex.", e);
    }
};

export const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

export const debouncedRecordState = debounce(recordState, 500);

export function undo() {
    if (history.length <= 1) return;
    isNavigatingHistory = true;
    redoStack.push(JSON.parse(JSON.stringify(appState)));
    history.pop();
    appState = JSON.parse(JSON.stringify(history[history.length - 1]));
    render();
    isNavigatingHistory = false;
    updateUndoRedoButtons();
}

export function redo() {
    if (redoStack.length === 0) return;
    isNavigatingHistory = true;
    const nextState = redoStack.pop();
    history.push(JSON.parse(JSON.stringify(nextState)));
    appState = nextState;
    render();
    isNavigatingHistory = false;
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    getEl('undo-btn').disabled = history.length <= 1;
    getEl('redo-btn').disabled = redoStack.length === 0;
}

// --- STATE GETTERS & SETTERS ---
export const getCurrentPage = () => appState.pages[appState.currentPageIndex];
export const getSelectedElement = () => getCurrentPage()?.elements.find(e => e.id === appState.selectedElementId);

export function deselectAll() {
    appState.selectedElementId = null;
    appState.selectedProductIndex = -1;
    const previewCanvas = getEl('preview-canvas');
    const editable = previewCanvas.querySelector('[contenteditable="true"]');
    if (editable) editable.contentEditable = false;
}