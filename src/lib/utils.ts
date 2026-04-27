import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToastStore } from '@/lib/stores/toastStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function notifyError(message: string) {
  useToastStore.getState().push({ message, variant: 'error' });
}

export function notifySuccess(message: string) {
  useToastStore.getState().push({ message, variant: 'success' });
}
