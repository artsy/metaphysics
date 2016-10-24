/* eslint-disable no-console */

const originalConsoleWarn = console.warn;
console.warn = jest.fn();

module.exports = jest.genMockFromModule('node-uuid');
console.warn = originalConsoleWarn;

/* eslint-enable no-console */
