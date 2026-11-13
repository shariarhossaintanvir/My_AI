import '@testing-library/jest-dom';

// Polyfill window.matchMedia for JSDOM
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { },
      removeListener: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill crypto.randomUUID for JSDOM
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => '10000000-1000-4000-8000-100000000000',
    },
  });
}

