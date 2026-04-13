import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'app-theme';
let mediaQueryListener: ((event: MediaQueryListEvent) => void) | undefined;
let matches = false;

function createService(): ThemeService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ThemeService,
      {
        provide: DOCUMENT,
        useValue: document
      }
    ]
  });

  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  beforeEach(() => {
    mediaQueryListener = undefined;
    matches = false;
    globalThis.localStorage.clear();

    spyOn(globalThis, 'matchMedia').and.callFake(() =>
      ({
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          mediaQueryListener = listener;
        },
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }) as MediaQueryList
    );
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark-mode');
    globalThis.localStorage.clear();
  });

  it('uses the stored theme when available', () => {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = createService();
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBeTrue();
  });

  it('falls back to the OS preference when there is no stored theme', () => {
    matches = true;

    const service = createService();

    expect(service.theme()).toBe('dark');
  });

  it('toggleTheme updates the signal, document class, and localStorage', () => {
    const service = createService();
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');

    service.toggleTheme();
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(globalThis.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBeTrue();
  });

  it('reacts to OS theme changes when no stored theme exists', () => {
    const service = createService();

    mediaQueryListener?.({ matches: true } as MediaQueryListEvent);
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBeTrue();
  });

  it('ignores OS theme changes when a stored theme exists', () => {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const service = createService();
    TestBed.flushEffects();

    mediaQueryListener?.({ matches: true } as MediaQueryListEvent);
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark-mode')).toBeFalse();
  });
});
