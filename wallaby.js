const fs = require("fs")
const babelRC = fs.readFileSync("./.babelrc")

module.exports = wallaby => {
  return {
    files: [
      ".env.test",
      "config.js",
      "src/**/*.graphql",
      "src/**/*.js",
      "src/**/*.ts",
      "src/**/*.json",
      "src/**/*.snap",
      "!src/**/*.test.js",
      "!src/**/*.test.ts",
    ],
    tests: ["src/**/*.test.js", "src/**/*.test.ts"],

    preprocessors: {
      "**/*.js": wallaby.compilers.babel(JSON.parse(babelRC)),
      "**/*.ts": wallaby.compilers.babel(JSON.parse(babelRC)),
    },

    env: {
      type: "node",
      runner: "node",
    },

    testFramework: "jest",
  }
}
