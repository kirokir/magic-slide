import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { get } from 'svelte/store';
import { slideStore, globalSettingsStore, appUIStore, selectionStore, defaultGlobals } from '$lib/stores/appStores';
import { historyStore } from '$lib/stores/historyStore';
import { showToast } from '$lib/stores/toastStore';
import type { Slide, GlobalSettings, TemplateFile, AppState } from '$lib/types';
import { tick } from 'svelte';
import { createId } from '@paralleldrive/cuid2';

export function exportAsTemplate() {
	const data: TemplateFile = {
		globals: get(globalSettingsStore),
		slides: get(slideStore)
	};
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
		const data = JSON.parse(text) as Partial<TemplateFile>;

		const mergedGlobals: GlobalSettings = {
			...defaultGlobals,
			...(data.globals || {}),
			brandingKit: {
				...defaultGlobals.brandingKit,
				...(data.globals?.brandingKit || {})
			},
			filters: {
				...defaultGlobals.filters,
				...(data.globals?.filters || {})
			}
		};

		const validatedSlides = (data.slides || []).map(slide => ({
			...slide,
			id: slide.id || createId(),
			elements: (slide.elements || []).map(el => ({
				...el,
				id: el.id || createId()
			}))
		}));

		if (validatedSlides.length === 0) {
			showToast('Template has no slides. Loading defaults instead.', 'info');
			const defaultSlides = parseTextToSlides("h1: Empty Template", "#4f46e5");
			historyStore.addSnapshot({ globals: mergedGlobals, slides: defaultSlides });
			selectionStore.set({ selectedSlideId: defaultSlides[0]?.id || null, selectedElementId: null });
		} else {
			historyStore.addSnapshot({ globals: mergedGlobals, slides: validatedSlides });
			selectionStore.set({ selectedSlideId: validatedSlides[0]?.id || null, selectedElementId: null });
		}
		
		showToast('Template loaded successfully!', 'success');
	} catch (error) {
		console.error('Template import failed:', error);
		showToast('Invalid or corrupted template file.', 'error');
	} finally {
		target.value = '';
	}
}

export async function exportAsZip() {
	selectionStore.update(s => ({...s, selectedElementId: null}));
	appUIStore.update(s => ({ ...s, isExporting: true }));
	await tick();

	const zip = new JSZip();
	const slideNode = document.querySelector('.slide');
	
	if (!slideNode) {
		showToast('Could not find slide to export.', 'error');
		appUIStore.update(s => ({ ...s, isExporting: false }));
		return;
	}

	try {
		const canvas = await html2canvas(slideNode as HTMLElement, {
			scale: 2,
			backgroundColor: null,
			allowTaint: true,
			useCORS: true
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