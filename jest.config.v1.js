module.exports = {
  projects: [
    {
      displayName: "v1",
      moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx"],
      setupFilesAfterEnv: ["jest-extended", "<rootDir>/src/test/helper.js"],
      testMatch: ["**/v1/**/?(*.)+(test).[jt]s"],
      testPathIgnorePatterns: ["/node_modules/", "/build/"],
      transform: {
        "^.+\\.(js|ts)$": require.resolve("babel-jest"),
      },
    },
  ],
}
