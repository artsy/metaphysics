const fs = require("fs")
const babelRC = fs.readFileSync("./.babelrc")

module.exports = wallaby => {
  return {
    files: [".env.test", "config.js", "src/**/*.js", "src/**/*.json", "src/**/*.snap", "!src/**/*.test.js"],
    tests: ["src/**/*.test.js"],

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
