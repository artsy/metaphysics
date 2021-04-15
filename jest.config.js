const v2Config = require("./jest.config.v2").projects[0]
const v1Config = require("./jest.config.v1").projects[0]

module.exports = {
  projects: [v1Config, v2Config],
}
