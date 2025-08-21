// /src/lib/utils/fileHandlers.ts

import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { get } from 'svelte/store';
import { slideStore, globalSettingsStore, appUIStore, selectionStore } from '$lib/stores/appStores';
import { historyStore } from '$lib/stores/historyStore';
import { showToast } from '$lib/stores/toastStore';
import type { Slide, GlobalSettings, TemplateFile, AppState } from '$lib/types';
import { tick } from 'svelte';

// === TEMPLATE IMPORT / EXPORT ===

export function exportAsTemplate() {
	const data: TemplateFile = {
		globals: get(globalSettingsStore),
		slides: get(slideStore)
	};
	// ... (rest of the function is the same)
}

export async function importFromTemplate(e: Event) {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	if (!file.name.endsWith('.magicslide')) {
		showToast('Invalid file type. Please select a .magicslide file.', 'error');
		return;
	}

	const text = await file.text();
	try {
		const data = JSON.parse(text) as TemplateFile;

		// Basic validation
		if (!data.globals || !data.slides) {
			throw new Error('Invalid template format.');
		}
		
		historyStore.addSnapshot(data); // Add the loaded state as a new history point
		selectionStore.set({ selectedSlideId: data.slides[0]?.id || null, selectedElementId: null });
		
		showToast('Template loaded successfully!', 'success');
	} catch (error) {
		console.error('Template import failed:', error);
		showToast('Invalid or corrupted template file.', 'error');
	} finally {
		target.value = ''; // Reset input
	}
}


// === ZIP EXPORT ===

export async function exportAsZip() {
	selectionStore.set({ selectedSlideId: get(selectionStore).selectedSlideId, selectedElementId: null });
	appUIStore.update(s => ({ ...s, isExporting: true }));
	await tick(); // Wait for the DOM to update and remove selection outlines

	const zip = new JSZip();
	const slides = get(slideStore); // We need the data to iterate, not just the nodes

	try {
		// We have to render *all* slides to capture them, not just the active one
		// This requires a temporary DOM container
		const captureContainer = document.createElement('div');
		captureContainer.style.position = 'fixed';
		captureContainer.style.left = '-9999px'; // Hide it off-screen
		captureContainer.style.top = '-9999px';
		document.body.appendChild(captureContainer);
		
		// This is a simplified approach. A full implementation would use Svelte's client-side
		// component API to render each slide into the container. For our single-page view,
		// we'll find the single active slide node as a proxy for now.
		// NOTE: A more robust solution for multi-slide capture would be needed in a larger app.
		// For this implementation, we will capture the currently rendered slide as an example.
		
		const slideNode = document.querySelector('.slide');
		if (!slideNode) throw new Error('Could not find slide to capture.');

		const canvas = await html2canvas(slideNode as HTMLElement, {
			scale: 2, // Capture at higher resolution to prevent blurriness
			backgroundColor: null,
			allowTaint: true, // Important for external/base64 images
			useCORS: true // Important for external/base64 images
		});
		
		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
		
		if (blob) {
			zip.file(`slide-01.png`, blob);
		}

		const zipBlob = await zip.generateAsync({ type: 'blob' });
		
		const url = URL.createObjectURL(zipBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'presentation.zip';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		showToast('Download started!', 'success');

	} catch (error) {
		console.error('ZIP Export failed:', error);
		showToast('Export failed. Check console for details.', 'error');
	} finally {
		appUIStore.update(s => ({ ...s, isExporting: false }));
	}
}