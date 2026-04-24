module.exports = {
  cacheDirectory: ".cache/jest",
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx", "mjs"],
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
    "^.+\\.(js|ts|mjs)$": require.resolve("babel-jest"),
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(apollo-upload-client|extract-files)/)",
  ],
}
