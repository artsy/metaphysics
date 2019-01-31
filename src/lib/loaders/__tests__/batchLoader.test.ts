import { batchLoader } from "../batchLoader"

describe("batchLoader", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe("when batching is disabled", () => {
    jest.doMock("config", () => ({
      ENABLE_RESOLVER_BATCHING: "false",
    }))

    it("should return a single loader if one is provided", () => {
      const singleLoader = () => {}
      expect(batchLoader({ singleLoader, multipleLoader: null })).toBe(
        singleLoader
      )
    })

    it("should return a multipleLoader if no singleLoader provided", () => {
      const multipleLoader = () => {}
      expect(batchLoader({ multipleLoader })).toBe(multipleLoader)
    })
  })

  it("should call the single loader when one item is batched", async () => {
    const singleLoader = jest.fn(v => Promise.resolve(v))
    const multipleLoader = jest.fn()
    const batch = batchLoader({ singleLoader, multipleLoader })

    await batch("foo")
    expect(multipleLoader).not.toBeCalled()
    expect(singleLoader).toBeCalledWith("foo")
  })

  /**
   * A list endpoint (like sales) shouldn't provide a singleLoader because the
   * multiple loader could support filtering options not supported by the single
   * endpoint.
   */
  it("should call the multiple loader when one argument when no single loader provided", async () => {
    const multipleLoader = jest.fn(v => Promise.resolve(v))
    const batch = batchLoader({ multipleLoader })
    const params = { id: "foo", param: "bar" }

    await batch(params)
    expect(multipleLoader).toBeCalledWith(params)
  })

  it("should group multiple calls together", async () => {
    const multipleLoader = jest.fn(v => Promise.resolve(v))
    const batch = batchLoader({ multipleLoader })

    await Promise.all([batch("123"), batch("456"), batch("789")])

    expect(multipleLoader).toBeCalledTimes(1)
  })
})
