import { vi } from "vitest";

// Minimal chrome global — each test suite that needs specific behaviour
// configures mock return values with mockResolvedValue / mockImplementation.
vi.stubGlobal("chrome", {
  storage: {
    local: {
      get:    vi.fn(),
      set:    vi.fn(),
      remove: vi.fn(),
    },
  },
  runtime: {
    sendMessage:   vi.fn(),
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
  action: {
    setIcon: vi.fn(),
  },
});
