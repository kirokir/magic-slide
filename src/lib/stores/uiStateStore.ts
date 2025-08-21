
import { writable } from 'svelte/store';

export type ActivePanel = 'project' | 'branding' | 'addSlide' | 'generator' | 'export' | null;

export const activePanel = writable<ActivePanel>('project');