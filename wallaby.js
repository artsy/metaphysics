const fs = require("fs")
const babelRC = fs.readFileSync("./.babelrc")

module.exports = wallaby => {
  return {
    files: [
      ".env.test",
      "config.js",
      "lib/**/*.js",
      "schema/**/*.js",
      "test/**/*.js",
      "test/**/*.json",
      "schema/**/*.snap",
      "lib/**/*.snap",
      "!lib/**/*.test.js",
      "!schema/**/*.test.js",
    ],
    tests: ["lib/**/*.test.js", "schema/**/*.test.js"],

    preprocessors: {
      "**/*.js": wallaby.compilers.babel(JSON.parse(babelRC)),
    },

    env: {
      type: "node",
      runner: "node",
    },

    testFramework: "jest",
    // debug: true,
  }
}
