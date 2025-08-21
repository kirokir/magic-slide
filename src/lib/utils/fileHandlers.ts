import { get, writable } from 'svelte/store';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { slideStore, globalSettingsStore, deselectAll } from '$lib/stores/appStores';
import { showToast } from './../stores/toastStore';
import type { Slide, GlobalSettings, TemplateFile } from '$lib/types';
import { tick } from 'svelte';


// === TEMPLATE IMPORT / EXPORT ===

export function exportAsTemplate(slides: Slide[], globals: GlobalSettings) {
	const data: TemplateFile = { globals, slides };
	const jsonString = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = 'presentation.magicslide';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	showToast('Template saved!', 'success');
}

export async function importFromTemplate(file: File) {
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

		globalSettingsStore.set(data.globals);
		slideStore.set(data.slides);
		deselectAll();
		
		showToast('Template loaded successfully!', 'success');
	} catch (error) {
		console.error('Template import failed:', error);
		showToast('Invalid or corrupted template file.', 'error');
	}
}


// === ZIP EXPORT ===

export async function exportAsZip(slides: Slide[], globals: GlobalSettings) {
	deselectAll();
	await tick(); // Wait for the DOM to update and remove selection outlines

	const zip = new JSZip();
	const slideNodes = document.querySelectorAll('.slide');

	if (slideNodes.length !== slides.length) {
		throw new Error("Mismatch between slide data and rendered slides.");
	}

	const canvasPromises = Array.from(slideNodes).map(node =>
		html2canvas(node as HTMLElement, {
			scale: 1, // Capture at native resolution
			backgroundColor: null, // Use the element's background
			logging: false
		})
	);

	const canvases = await Promise.all(canvasPromises);

	const blobPromises = canvases.map(canvas => 
		new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
	);
	
	const blobs = await Promise.all(blobPromises);

	blobs.forEach((blob, index) => {
		if (blob) {
			const slideNumber = String(index + 1).padStart(2, '0');
			zip.file(`slide-${slideNumber}.png`, blob);
		}
	});

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'presentation.zip';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}