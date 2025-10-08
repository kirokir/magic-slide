import {
    appState,
    getCurrentPage,
    getSelectedElement,
    getEl,
    deselectAll,
    recordState,
    debounce
} from './state.js';

import {
    updatePageProperty,
    updatePageContentProperty,
    updateElementProperty,
    updateElementStyleProperty,
    addElement,
    deleteElement,
    selectElement
} from './app.js';

// --- MAIN RENDER FUNCTION ---
export function render() {
    if (appState.currentPageIndex < 0 && appState.pages.length > 0) {
        appState.currentPageIndex = 0;
    }
    const inspectorPanel = getEl('inspector-panel');
    const previewCanvas = getEl('preview-canvas');
    const pageTabs = getEl('page-tabs');

    if (appState.currentPageIndex < 0) {
        inspectorPanel.innerHTML = '<h2>No Page Selected</h2><p>Create a new page to begin.</p>';
        previewCanvas.innerHTML = '';
        pageTabs.innerHTML = '';
        return;
    }
    renderTabs();
    renderPreview();
    renderInspector();
    updateZoomDisplay();
    updateFontToolbar();
    setupInteract(); // Re-setup interactjs for the current view
}

// --- RENDERING SUB-ROUTINES ---
function renderTabs() {
    const pageTabs = getEl('page-tabs');
    const mobileSwitcher = getEl('mobile-page-switcher');

    // --- Desktop Tabs Rendering (existing code) ---
    pageTabs.innerHTML = '';
    const fragment = document.createDocumentFragment();
    appState.pages.forEach((page, index) => {
        const li = document.createElement('li');
        li.className = 'page-tab';
        li.dataset.index = index;
        if (index === appState.currentPageIndex) li.classList.add('active-tab');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = page.name;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-tab-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Close Page';
        closeBtn.setAttribute('aria-label', `Close ${page.name}`);

        li.append(nameSpan, closeBtn);
        fragment.appendChild(li);
    });
    pageTabs.appendChild(fragment);

    // --- NEW: Mobile Page Switcher Population ---
    mobileSwitcher.innerHTML = '';
    appState.pages.forEach((page, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = page.name;
        if (index === appState.currentPageIndex) {
            option.selected = true;
        }
        mobileSwitcher.appendChild(option);
    });
}

function renderPreview() {
    const page = getCurrentPage();
    if (!page) return;

    const previewCanvas = getEl('preview-canvas');
    previewCanvas.style.width = `${appState.pageDimensions.width}px`;
    previewCanvas.style.height = `${appState.pageDimensions.height}px`;
    previewCanvas.innerHTML = '';

    const template = appState.templates[page.template];
    if (!template) {
        previewCanvas.innerHTML = `<p style="color:red;padding:20px;">Template not found: ${page.template}</p>`;
        return;
    }

    const styleTag = document.createElement('style');
    styleTag.textContent = applyPlaceholders(template.css, page.content);
    previewCanvas.appendChild(styleTag);

    if (template.type === 'static' || template.type === 'index' || template.type === 'product') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = applyPlaceholders(template.html, page.content);
        while (tempDiv.firstChild) {
            previewCanvas.appendChild(tempDiv.firstChild);
        }
        if (template.type === 'index') renderIndexTemplate();
        if (template.type === 'product') renderProductTemplate();
    } else if (template.type === 'interactive') {
        renderInteractiveElements();
    }
}

function applyPlaceholders(str, data) {
    if (!str) return '';
    return str.replace(/{{([^}]+)}}/g, (match, key) => {
        const [prop, defaultValue] = key.split('|').map(s => s.trim());
        return data[prop] !== undefined ? data[prop] : (defaultValue !== undefined ? defaultValue : '');
    });
}

function renderInteractiveElements() {
    const page = getCurrentPage();
    const previewCanvas = getEl('preview-canvas');
    const fragment = document.createDocumentFragment();
    const visibleElements = page.elements.filter(el => el.isVisible !== false);

    visibleElements.forEach(el => {
        const elDiv = document.createElement('div');
        elDiv.className = 'interactive-element';
        elDiv.dataset.id = el.id;
        if (el.id === appState.selectedElementId) elDiv.classList.add('selected');

        Object.assign(elDiv.style, {
            transform: `translate(${el.x}px, ${el.y}px)`,
            width: `${el.width}px`,
            height: `${el.height}px`,
            zIndex: el.zIndex,
        });

        let content;
        switch (el.type) {
            case 'text':
                content = document.createElement('div');
                content.className = 'element-content';
                content.innerHTML = el.content;
                content.addEventListener('blur', (e) => {
                    if (el.content !== e.target.innerHTML) {
                        recordState();
                        el.content = e.target.innerHTML;
                    }
                    e.target.contentEditable = false;
                });
                break;
            case 'image':
                content = document.createElement('img');
                content.src = el.src;
                content.alt = "User uploaded image";
                break;
            case 'shape':
                content = document.createElement('div');
                content.className = 'element-shape';
                content.style.color = el.style.color;
                content.innerHTML = el.content;
                break;
        }

        if (content) {
            Object.assign(content.style, el.style);
            elDiv.appendChild(content);
        }
        fragment.appendChild(elDiv);
    });
    previewCanvas.appendChild(fragment);
}

function renderIndexTemplate() {
    const tocList = getEl('preview-canvas').querySelector('#toc-list');
    if (!tocList) return;
    tocList.innerHTML = ''; // Clear previous entries
    appState.pages.forEach((p, index) => {
        if (p.template === 'product-list' && p.products.length > 0) {
            p.products.forEach(prod => {
                tocList.innerHTML += `<div class="toc-item"><span class="toc-product-name">${prod.name}</span><span class="toc-page-number">${index + 1}</span></div>`;
            });
        }
    });
}

function renderProductTemplate() {
    const grid = getEl('preview-canvas').querySelector('.product-grid');
    const page = getCurrentPage();
    if (!grid || !page) return;
    grid.innerHTML = ''; // Clear previous entries

    const fragment = document.createDocumentFragment();
    page.products.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.index = index;
        card.innerHTML = `<img src="${prod.image}" alt="${prod.name}"><h3 class="product-name">${prod.name}</h3><p class="product-code">${prod.code}</p>`;
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);

    new Sortable(grid, {
        animation: 150,
        onEnd: (evt) => {
            recordState();
            const movedItem = page.products.splice(evt.oldIndex, 1)[0];
            page.products.splice(evt.newIndex, 0, movedItem);
            render();
        }
    });
}

// --- INSPECTOR RENDERING ---
function renderInspector() {
    const page = getCurrentPage();
    const selectedElement = getSelectedElement();
    const selectedProduct = (page?.template === 'product-list' && appState.selectedProductIndex > -1) ? page.products[appState.selectedProductIndex] : null;

    const inspectorPanel = getEl('inspector-panel');
    const mobileCloseButton = inspectorPanel.querySelector('#mobile-close-inspector');
    inspectorPanel.innerHTML = '';
    if (mobileCloseButton) {
        inspectorPanel.prepend(mobileCloseButton);
    }


    if (selectedElement) renderElementInspector(selectedElement);
    else if (selectedProduct) renderProductInspector(selectedProduct);
    else if (page) renderPageInspector(page);
}

function renderPageInspector(page) {
    const inspectorPanel = getEl('inspector-panel');
    const container = document.createDocumentFragment();
    
    const h2 = document.createElement('h2');
    h2.textContent = "Page Properties";
    container.appendChild(h2);

    container.appendChild(createInputGroup('Page Name', 'page-name-input', page.name, 'text', (val) => updatePageProperty('name', val)));
    container.appendChild(createSelectGroup('Template', 'page-template-select', page.template, Object.keys(appState.templates).map(k => ({ value: k, text: appState.templates[k].name })), (val) => updatePageProperty('template', val)));

    const template = appState.templates[page.template];
    if (template.type === 'static') {
        container.appendChild(document.createElement('hr'));
        createStaticContentInputs(page, template).forEach(el => container.appendChild(el));
    } else if (template.type === 'interactive') {
        container.appendChild(document.createElement('hr'));
        createInteractiveControls(page).forEach(el => container.appendChild(el));
    } else if (template.type === 'product') {
        container.appendChild(document.createElement('hr'));
        createProductControls().forEach(el => container.appendChild(el));
    }
    
    container.appendChild(document.createElement('hr'));
    const customTplBtn = document.createElement('button');
    customTplBtn.className = 'btn';
    customTplBtn.textContent = 'Create Custom Template';
    customTplBtn.onclick = () => getEl('template-modal').style.display = 'flex';
    container.appendChild(customTplBtn);
    
    inspectorPanel.appendChild(container);
}

function createStaticContentInputs(page, template) {
    const elements = [document.createElement('h3')];
    elements[0].textContent = "Template Content";
    
    const combinedTemplate = (template.html || '') + (template.css || '');
    const placeholders = [...new Set(Array.from(combinedTemplate.matchAll(/{{(.*?)}}/g), m => m[1].split('|')[0].trim()))];
    
    placeholders.forEach(key => {
        let type = 'text';
        if (key.toLowerCase().includes('color')) type = 'color';
        else if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url')) type = 'file';

        elements.push(createInputGroup(key, `content-input-${key}`, page.content[key] || '', type, (val) => {
            if (type === 'file' && val[0]) {
                const reader = new FileReader();
                reader.onload = (re) => updatePageContentProperty(key, re.target.result);
                reader.readAsDataURL(val[0]);
            } else {
                updatePageContentProperty(key, val, type !== 'color');
            }
        }));
    });
    return elements;
}

function createInteractiveControls(page) {
    const title = document.createElement('h3');
    title.textContent = "Add Elements";

    const addTextBtn = document.createElement('button');
    addTextBtn.className = 'btn'; addTextBtn.textContent = 'Add Text';
    addTextBtn.onclick = () => addElement('text');

    const addShapeBtn = document.createElement('button');
    addShapeBtn.className = 'btn'; addShapeBtn.textContent = 'Add Shape';
    addShapeBtn.onclick = () => addElement('shape');

    const addImageInput = document.createElement('input');
    addImageInput.type = 'file'; addImageInput.id = 'add-image-input'; addImageInput.accept="image/*"; addImageInput.style.display = 'none';
    addImageInput.onchange = (e) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (re) => addElement('image', { src: re.target.result });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const addImageLabel = document.createElement('label');
    addImageLabel.htmlFor = 'add-image-input'; addImageLabel.className = 'btn'; addImageLabel.textContent = 'Add Image';
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'inspector-group-actions';
    controlsContainer.append(addTextBtn, addShapeBtn, addImageLabel, addImageInput);

    const layersTitle = document.createElement('h3');
    layersTitle.textContent = "Layers";

    const layerList = document.createElement('ul');
    layerList.id = "layer-list";
    layerList.className = 'layer-list';
    
    const fragment = document.createDocumentFragment();
    [...page.elements].sort((a, b) => b.zIndex - a.zIndex).forEach(el => {
        const li = document.createElement('li');
        li.className = `layer-item ${el.id === appState.selectedElementId ? 'selected' : ''}`;
        li.dataset.id = el.id;
        li.onclick = () => selectElement(el.id);

        const typeSpan = document.createElement('span');
        typeSpan.textContent = el.type.charAt(0).toUpperCase() + el.type.slice(1);

        const visBtn = document.createElement('button');
        visBtn.className = 'layer-visibility-btn';
        visBtn.setAttribute('aria-label', `Toggle visibility for ${el.type} element`);
        visBtn.onclick = (e) => { e.stopPropagation(); recordState(); el.isVisible = !(el.isVisible !== false); render(); };
        
        const visIcon = document.createElement('span');
        visIcon.setAttribute('aria-hidden', 'true');
        visIcon.textContent = el.isVisible !== false ? '👁️' : '🙈';
        visBtn.appendChild(visIcon);
        
        li.append(typeSpan, visBtn);
        fragment.appendChild(li);
    });
    layerList.appendChild(fragment);

    new Sortable(layerList, {
        animation: 150,
        onEnd: (evt) => {
            recordState();
            const elementsInViewOrder = Array.from(evt.target.children).map(li => li.dataset.id);
            const maxZ = page.elements.length - 1;
            elementsInViewOrder.forEach((id, viewIndex) => {
                const element = page.elements.find(el => el.id === id);
                if (element) element.zIndex = maxZ - viewIndex;
            });
            render();
        }
    });

    return [title, controlsContainer, document.createElement('hr'), layersTitle, layerList];
}

function createProductControls() {
    const title = document.createElement('h3');
    title.textContent = "Products";
    
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.textContent = "Add Product";
    addBtn.onclick = () => {
        recordState();
        getCurrentPage().products.push({ id: `prod_${Date.now()}`, name: 'New Product', code: 'SKU-000', image: 'https://via.placeholder.com/300x200.png?text=New+Product', features: '', description: '' });
        render();
    };

    const helpText = document.createElement('p');
    helpText.style.cssText = "margin-top: 10px; color: var(--text-secondary);";
    helpText.textContent = "Click a product in the preview to edit. Drag to reorder.";

    return [title, addBtn, helpText];
}

function renderProductInspector(product) {
    const inspectorPanel = getEl('inspector-panel');
    const container = document.createDocumentFragment();
    const page = getCurrentPage();
    const updateProductProp = (prop, value, shouldRecord) => {
        if (product[prop] !== value) {
            if (shouldRecord) recordState();
            product[prop] = value;
            renderPreview();
        }
    };

    const header = document.createElement('h2');
    header.textContent = "Product Editor";
    const backBtn = document.createElement('button');
    backBtn.className = 'btn';
    backBtn.style.cssText = 'float: right; padding: 5px 10px;';
    backBtn.textContent = 'Back';
    backBtn.onclick = () => { deselectAll(); render(); };
    header.append(backBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.cssText = "background-color: var(--danger-color); color: white;";
    deleteBtn.textContent = "Delete Product";
    deleteBtn.onclick = () => {
         if (confirm(`Are you sure you want to delete this product?`)) {
            recordState();
            page.products.splice(appState.selectedProductIndex, 1);
            deselectAll();
            render();
        }
    };
    
    container.appendChild(header);
    container.appendChild(createInputGroup('Name', 'prod-name', product.name, 'text', (val) => updateProductProp('name', val, false), true));
    container.appendChild(createInputGroup('Code', 'prod-code', product.code, 'text', (val) => updateProductProp('code', val, false), true));
    container.appendChild(createTextAreaGroup('Description', 'prod-desc', product.description, (val) => updateProductProp('description', val, false), true));
    container.appendChild(createTextAreaGroup('Features (one per line)', 'prod-feat', product.features, (val) => updateProductProp('features', val, false), true));
    container.appendChild(createInputGroup('Image', 'prod-img', '', 'file', (val) => {
        if (val[0]) {
            const reader = new FileReader();
            reader.onload = (re) => updateProductProp('image', re.target.result, true);
            reader.readAsDataURL(val[0]);
        }
    }));
    container.appendChild(document.createElement('hr'));
    container.appendChild(deleteBtn);
    inspectorPanel.appendChild(container);
}

function renderElementInspector(el) {
    const inspectorPanel = getEl('inspector-panel');
    const container = document.createDocumentFragment();

    const header = document.createElement('h2');
    header.textContent = `Element: ${el.type}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.cssText = 'background-color: var(--danger-color); color: white;';
    deleteBtn.textContent = "Delete Element";
    deleteBtn.onclick = () => deleteElement(el.id);
    
    container.appendChild(header);
    container.appendChild(createInputGroup('X', 'el-x', Math.round(el.x), 'number', (val) => updateElementProperty('x', parseFloat(val), true)));
    container.appendChild(createInputGroup('Y', 'el-y', Math.round(el.y), 'number', (val) => updateElementProperty('y', parseFloat(val), true)));
    container.appendChild(createInputGroup('Width', 'el-width', Math.round(el.width), 'number', (val) => updateElementProperty('width', parseFloat(val), true)));
    container.appendChild(createInputGroup('Height', 'el-height', Math.round(el.height), 'number', (val) => updateElementProperty('height', parseFloat(val), true)));
    container.appendChild(createInputGroup('Z-Index', 'el-z', el.zIndex, 'number', (val) => updateElementProperty('zIndex', parseInt(val), false)));
    container.appendChild(document.createElement('hr'));
    container.appendChild(deleteBtn);
    inspectorPanel.appendChild(container);
}

// --- DOM ELEMENT CREATION HELPERS ---
function createInputGroup(label, id, value, type='text', onChange, useDebounce = false) {
    const group = document.createElement('div');
    group.className = 'inspector-group';
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id; labelEl.textContent = label;
    const inputEl = document.createElement('input');
    inputEl.type = type; inputEl.id = id;
    if (type !== 'file') inputEl.value = value;
    if (type === 'file') inputEl.accept = "image/*";
    
    const changeHandler = (e) => {
        const val = type === 'file' ? e.target.files : e.target.value;
        onChange(val);
    };
    
    if (useDebounce) {
        inputEl.addEventListener('input', debounce(changeHandler, 300));
    } else {
        inputEl.addEventListener('change', changeHandler);
    }
    
    group.append(labelEl, inputEl);
    return group;
}

function createTextAreaGroup(label, id, value, onChange, useDebounce = false) {
     const group = document.createElement('div');
    group.className = 'inspector-group';
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id; labelEl.textContent = label;
    const textareaEl = document.createElement('textarea');
    textareaEl.id = id; textareaEl.value = value;
    const debouncedOnChange = debounce(e => onChange(e.target.value), 300);
    textareaEl.addEventListener(useDebounce ? 'input' : 'change', useDebounce ? debouncedOnChange : e => onChange(e.target.value));
    group.append(labelEl, textareaEl);
    return group;
}

function createSelectGroup(label, id, selectedValue, options, onChange) {
    const group = document.createElement('div');
    group.className = 'inspector-group';
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id; labelEl.textContent = label;
    const selectEl = document.createElement('select');
    selectEl.id = id;
    options.forEach(o => {
        const option = document.createElement('option');
        option.value = o.value; option.textContent = o.text;
        if (o.value === selectedValue) option.selected = true;
        selectEl.appendChild(option);
    });
    selectEl.addEventListener('change', (e) => onChange(e.target.value));
    group.append(labelEl, selectEl);
    return group;
}

// --- UI FEEDBACK & HELPERS ---
export function updateFontToolbar() {
    const selectedEl = getSelectedElement();
    const fontToolbar = getEl('font-toolbar');
    if (selectedEl && selectedEl.type === 'text') {
        const elDOM = document.querySelector(`.interactive-element[data-id="${selectedEl.id}"]`);
        if(!elDOM) { fontToolbar.style.display = 'none'; return; }

        const elRect = elDOM.getBoundingClientRect();
        const panelRect = getEl('preview-panel').getBoundingClientRect();
        const scrollTop = getEl('preview-panel').scrollTop;
        const scrollLeft = getEl('preview-panel').scrollLeft;

        fontToolbar.style.display = 'flex';
        fontToolbar.style.top = `${elRect.top - panelRect.top + scrollTop - fontToolbar.offsetHeight - 10}px`;
        fontToolbar.style.left = `${elRect.left - panelRect.left + scrollLeft}px`;

        getEl('font-family-select').value = selectedEl.style.fontFamily || 'Arial';
        getEl('font-size-input').value = parseInt(selectedEl.style.fontSize) || 16;
        getEl('font-color-input').value = selectedEl.style.color || '#000000';
    } else {
        fontToolbar.style.display = 'none';
    }
}

export function updateZoomDisplay() {
    getEl('zoom-display').textContent = `${Math.round(appState.zoomLevel * 100)}%`;
}

export function showToast(message, duration = 3000) {
    const toastContainer = getEl('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.animationDuration = `${duration / 1000}s`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// --- SETUP LIBRARIES (part of UI as it manipulates DOM directly) ---
export function setupInteract() {
    interact('.interactive-element')
    .draggable({
        listeners: {
            move(event) {
                const el = getSelectedElement();
                if (!el) return;
                el.x += event.dx / appState.zoomLevel;
                el.y += event.dy / appState.zoomLevel;
                event.target.style.transform = `translate(${el.x}px, ${el.y}px)`;
                updateFontToolbar();
            },
            end(event) { recordState(); renderInspector(); }
        },
        modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent' }) ]
    })
    .resizable({
        edges: { top: true, left: true, bottom: true, right: true },
        listeners: {
            move(event) {
                const el = getSelectedElement();
                if (!el) return;
                el.width = event.rect.width / appState.zoomLevel;
                el.height = event.rect.height / appState.zoomLevel;
                el.x += event.deltaRect.left / appState.zoomLevel;
                el.y += event.deltaRect.top / appState.zoomLevel;
                event.target.style.width = `${el.width}px`;
                event.target.style.height = `${el.height}px`;
                event.target.style.transform = `translate(${el.x}px, ${el.y}px)`;
                updateFontToolbar();
            },
            end(event) { recordState(); renderInspector(); }
        },
        modifiers: [ interact.modifiers.restrictEdges({ outer: 'parent' }) ]
    });
}