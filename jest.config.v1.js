module.exports = {
  projects: [
    {
      displayName: "v1",
      moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx"],
      setupFilesAfterEnv: ["jest-extended", "<rootDir>/src/test/helper.js"],
      testMatch: ["**/v1/**/?(*.)+(test).[jt]s"],
      transform: {
        "^.+\\.(js|ts)$": "babel-jest",
      },
    },
  ],
}
