import { writable } from 'svelte/store';

type ToastType = 'info' | 'success' | 'error';

interface ToastMessage {
	id: number;
	type: ToastType;
	message: string;
}

export const toasts = writable<ToastMessage[]>([]);

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
	const id = Date.now();
	toasts.update((all) => [...all, { id, type, message }]);

	setTimeout(() => {
		toasts.update((all) => all.filter((t) => t.id !== id));
	}, duration);
}