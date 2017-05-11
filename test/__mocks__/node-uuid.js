/* eslint-disable no-console */

// node-uuid does a console.warn on every import
// which gets noisy very quickly, so this suppresses it

const originalConsoleWarn = console.warn
console.warn = jest.fn()

module.exports = jest.genMockFromModule("node-uuid")
console.warn = originalConsoleWarn

/* eslint-enable no-console */
