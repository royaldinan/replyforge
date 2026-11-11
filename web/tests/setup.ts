import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, vi } from 'vitest';

// Setiap test: tidak boleh ada console.error / console.warn (mis. warning key, act(), DOM nesting).
let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
  window.history.replaceState(null, '');
});
afterEach(() => {
  const errs = errorSpy.mock.calls.map((c) => String(c[0]).slice(0, 200));
  const warns = warnSpy.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errorSpy.mockRestore();
  warnSpy.mockRestore();
  expect(errs, 'console.error calls').toEqual([]);
  expect(warns, 'console.warn calls').toEqual([]);
});
