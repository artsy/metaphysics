import readDirRecursive from "fs-readdir-recursive"

describe("loaders should always export functions", () => {
  it("validates all the libs", () => {
    const loaderPath = "lib/loaders"
    const loaderPaths = readDirRecursive(loaderPath)
    const skipPrefix = "api/"
    const loaders = loaderPaths
      .filter(l => {return !l.startsWith("__")})
      .filter(l => {return !l.startsWith(skipPrefix)})

    loaders.forEach(path => {
      const value = require(`../../../${loaderPath}/${path}`)
      expect([path, value.default]).toEqual([path, expect.any(Function)])
    })
  })
})
