import readDirRecursive from "fs-readdir-recursive"
import _ from "lodash"

describe("loaders should always export functions", () => {
  it("validates all the libs", () => {
    const loaderPath = "lib/loaders"
    const loaderPaths = readDirRecursive(loaderPath)
    const skipPrefix = "api/"
    const skip = ["legacy/impulse.js", "legacy/index.js"]
    const loaders = loaderPaths.filter(l => !l.startsWith(skipPrefix)).filter(l => !_.includes(skip, l))

    loaders.forEach(path => {
      const value = require("../../../" + loaderPath + "/" + path)
      expect([path, value.default]).toEqual([path, expect.any(Function)])
    })
  })
})
