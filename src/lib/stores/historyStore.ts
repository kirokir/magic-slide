

import { writable, get, derived } from 'svelte/store';
import type { AppState } from '$lib/types';
import { slideStore, globalSettingsStore } from './appStores';
import rfdc from 'rfdc';

// Initialize a fast deep-clone function. This is crucial for immutability.
const clone = rfdc();

// Set a reasonable limit to prevent excessive memory usage in a long session.
const MAX_HISTORY_LENGTH = 100;

/**
 * Creates a custom Svelte store to manage the application's state history
 * for undo and redo functionality.
 */
const createHistoryStore = () => {
	// Private writable stores that manage the core logic.
	const history = writable<AppState[]>([], (set) => {
        // When the store is first subscribed to, initialize the history
        // with the application's starting state.
        const initialState: AppState = {
            slides: get(slideStore),
            globals: get(globalSettingsStore)
        };
        set([initialState]);
    });
	const currentIndex = writable<number>(0);

	/**
	 * A private helper function to update the main application stores
	 * with a given state from the history timeline.
	 * @param state The AppState object to apply.
	 */
	const updateStoresFromState = (state: AppState) => {
		// By setting the stores here, we trigger Svelte's reactivity,
		// and the entire UI updates to reflect the new state.
		slideStore.set(state.slides);
		globalSettingsStore.set(state.globals);
	};

	/**
	 * Adds a new state snapshot to the history timeline. This is the primary
	 * method called by the `historyActions` dispatcher.
	 * @param newState The new state of the application to save.
	 */
	const addSnapshot = (newState: AppState) => {
		const currentState = get(history);
		const currentIdx = get(currentIndex);
		
		// If the user has undone some actions and then makes a new change,
		// we must discard the "future" history that is no longer valid.
		const newHistory = currentState.slice(0, currentIdx + 1);
		newHistory.push(newState);

        // To prevent unbounded memory growth, we cap the history length.
        if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift(); // Remove the oldest state
        }

		history.set(newHistory);
		// The new state is always at the end of the new timeline.
		currentIndex.set(newHistory.length - 1);
        // Immediately update the UI to reflect this new state.
        updateStoresFromState(newState);
	};

	/**
	 * Moves one step back in the history timeline.
	 */
	const undo = () => {
		const currentIdx = get(currentIndex);
		if (currentIdx > 0) {
			const newIndex = currentIdx - 1;
			currentIndex.set(newIndex);
			const historyState = get(history)[newIndex];
			updateStoresFromState(historyState);
		}
	};

	/**
	 * Moves one step forward in the history timeline.
	 */
	const redo = () => {
		const currentIdx = get(currentIndex);
		const historyState = get(history);
		if (currentIdx < historyState.length - 1) {
			const newIndex = currentIdx + 1;
			currentIndex.set(newIndex);
			updateStoresFromState(historyState[newIndex]);
		}
	};

    // Publicly readable derived stores. UI components can bind to these
    // to dynamically enable or disable the undo/redo buttons.
    const canUndo = derived(currentIndex, $currentIndex => $currentIndex > 0);
    const canRedo = derived([currentIndex, history], ([$currentIndex, $history]) => $currentIndex < $history.length - 1);


	// Expose only the public methods and derived stores. The internal `history`
	// and `currentIndex` writables are kept private to the store's closure.
	return {
		subscribe: history.subscribe, // Allows debugging or direct observation if needed
		addSnapshot,
		undo,
		redo,
        canUndo,
        canRedo
	};
};

// Export a singleton instance of the store for the entire application to use.
export const historyStore = createHistoryStore();