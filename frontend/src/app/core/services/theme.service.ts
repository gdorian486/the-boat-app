import { effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'login-theme';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  readonly theme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    // Apply `dark-mode` class to <html> reactively whenever the theme changes
    effect(() => {
      this.document.documentElement.classList.toggle('dark-mode', this.theme() === 'dark');
    });

    // Keep in sync with OS preference when no stored value
    this.mediaQuery.addEventListener('change', (event) => {
      if (!window.localStorage.getItem(this.storageKey)) {
        this.theme.set(event.matches ? 'dark' : 'light');
      }
    });
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    window.localStorage.setItem(this.storageKey, next);
  }

  private getInitialTheme(): 'light' | 'dark' {
    const stored = window.localStorage.getItem(this.storageKey);
    if (stored === 'light' || stored === 'dark') return stored;
    return this.mediaQuery.matches ? 'dark' : 'light';
  }
}

