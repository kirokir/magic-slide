// /src/lib/actions/historyActions.ts

import { get } from 'svelte/store';
import { slideStore, globalSettingsStore, selectionStore } from '$lib/stores/appStores';
import { historyStore } from '$lib/stores/historyStore';
import type { AppState, Element, GlobalSettings, Slide, BrandingKit, FilterSettings, Gradient } from '$lib/types';
import rfdc from 'rfdc';
import { createId } from '@paralleldrive/cuid2';

const clone = rfdc();

/**
 * Gets a snapshot of the current state from the main stores.
 * @returns The current application state.
 */
function getCurrentState(): AppState {
    return {
        slides: get(slideStore),
        globals: get(globalSettingsStore)
    };
}

/**
 * A centralized dispatcher that clones the current state, applies a mutation,
 * and pushes the new state to the history store. This is the core of the undo/redo system.
 * @param callback A function that receives a mutable clone of the state and returns it after modification.
 */
function dispatch(callback: (newState: AppState) => AppState) {
    const currentState = getCurrentState();
    const clonedState = clone(currentState);
    const nextState = callback(clonedState);
    historyStore.addSnapshot(nextState);
}

// === ELEMENT ACTIONS ===

/** Updates properties or styles of a specific element. */
export const updateElement = (slideId: string, elementId: string, updates: Partial<Element> | { styles: Partial<Element['styles']> }) => {
    dispatch(state => {
        const slide = state.slides.find(s => s.id === slideId);
        if (slide) {
            const element = slide.elements.find(e => e.id === elementId);
            if (element) {
                if ('styles' in updates && updates.styles) {
                    element.styles = { ...element.styles, ...updates.styles };
                } else if (!('styles' in updates)) {
                    Object.assign(element, updates);
                }
            }
        }
        return state;
    });
};

/** Adds a new element to a slide. */
export const addNewElement = (slideId: string, elementData: Omit<Element, 'id'>) => {
    dispatch(state => {
        const slide = state.slides.find(s => s.id === slideId);
        if (slide) {
            const newElement: Element = { ...elementData, id: createId() };
            slide.elements.push(newElement);
            // Auto-select the new element for a better user experience
            selectionStore.update(s => ({ ...s, selectedElementId: newElement.id }));
        }
        return state;
    });
};

/** Deletes an element from a slide. */
export const deleteElement = (slideId: string, elementId: string) => {
    dispatch(state => {
        const slide = state.slides.find(s => s.id === slideId);
        if (slide) {
            slide.elements = slide.elements.filter(e => e.id !== elementId);
            selectionStore.update(s => ({ ...s, selectedElementId: null }));
        }
        return state;
    });
};

/** Changes the stacking order (z-index) of an element. */
export const reorderElement = (slideId: string, elementId: string, direction: 'forward' | 'backward') => {
    dispatch(state => {
        const slide = state.slides.find(s => s.id === slideId);
        if (slide) {
            const elementsSorted = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
            const currentIndex = elementsSorted.findIndex(e => e.id === elementId);
            if (currentIndex === -1) return state;

            if (direction === 'forward' && currentIndex < elementsSorted.length - 1) {
                [elementsSorted[currentIndex], elementsSorted[currentIndex + 1]] = [elementsSorted[currentIndex + 1], elementsSorted[currentIndex]];
            } else if (direction === 'backward' && currentIndex > 0) {
                [elementsSorted[currentIndex], elementsSorted[currentIndex - 1]] = [elementsSorted[currentIndex - 1], elementsSorted[currentIndex]];
            }
            
            // Re-assign z-indices to the original elements to maintain a clean 0-based sequence
            elementsSorted.forEach((el, index) => {
                const originalElement = slide.elements.find(e => e.id === el.id);
                if(originalElement) originalElement.zIndex = index;
            });
        }
        return state;
    });
};

// === SLIDE ACTIONS ===

/** Adds a new slide to the presentation. */
export const addNewSlide = (slideData: Omit<Slide, 'id'>, atIndex?: number) => {
    dispatch(state => {
        const newSlide: Slide = { ...slideData, id: createId() };
        if (atIndex !== undefined) {
            state.slides.splice(atIndex, 0, newSlide);
        } else {
            state.slides.push(newSlide);
        }
        selectionStore.set({ selectedSlideId: newSlide.id, selectedElementId: null });
        return state;
    });
};

/** Deletes a slide from the presentation. */
export const deleteSlide = (slideId: string) => {
    dispatch(state => {
        if (state.slides.length <= 1) {
            console.warn("Cannot delete the last slide.");
            return state; // Don't delete the last slide
        }
        const currentIndex = state.slides.findIndex(s => s.id === slideId);
        if (currentIndex === -1) return state;

        state.slides = state.slides.filter(s => s.id !== slideId);
        
        // Intelligently select the next slide
        const newIndex = Math.max(0, currentIndex - 1);
        const newSelectedSlideId = state.slides[newIndex].id;
        selectionStore.set({ selectedSlideId: newSelectedSlideId, selectedElementId: null });
        return state;
    });
};

/** Updates properties of a specific slide, like background or filters. */
export const updateSlide = (slideId: string, updates: { backgroundImage?: string | null; filters?: FilterSettings | null }) => {
    dispatch(state => {
        const slide = state.slides.find(s => s.id === slideId);
        if (slide) {
            Object.assign(slide, updates);
        }
        return state;
    });
};

// === GLOBAL SETTINGS ACTIONS ===

/** Updates top-level global settings like aspect ratio or app background. */
export const updateGlobalSettings = (updates: Partial<GlobalSettings>) => {
    dispatch(state => {
        state.globals = { ...state.globals, ...updates };
        return state;
    });
};

/** Updates the nested branding kit object. */
export const updateBrandingKit = (updates: Partial<BrandingKit>) => {
    dispatch(state => {
        state.globals.brandingKit = { ...state.globals.brandingKit, ...updates };
        return state;
    });
};