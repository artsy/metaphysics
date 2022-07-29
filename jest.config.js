module.exports = {
  cacheDirectory: ".cache/jest",
  coverageDirectory: "coverage",
  collectCoverage: true,
  coverageReporters: ["lcov", "text-summary"],
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx"],
  setupFilesAfterEnv: ["jest-extended", "<rootDir>/src/test/helper.js"],
  testRegex: "(.test)\\.(js|ts)$",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
    "/src/test/helper.js",
    "/src/test/utils.js",
    "/src/test/gql.js",
    "/src/test/__mocks__",
    "src/schema/v2/__tests__/ecommerce/",
  ],
  transform: {
    "^.+\\.(js|ts)$": require.resolve("babel-jest"),
  },
}
