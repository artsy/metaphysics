describe("batchLoader", () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe("when batching is disabled", () => {
    let batchLoader
    beforeEach(() => {
      jest.doMock("config", () => ({
        ENABLE_RESOLVER_BATCHING: false,
      }))
      batchLoader = require("../batchLoader").batchLoader
    })

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

  describe("when batching is enabled", () => {
    let batchLoader
    beforeEach(() => {
      jest.doMock("config", () => ({
        ENABLE_RESOLVER_BATCHING: true,
      }))
      batchLoader = require("../batchLoader").batchLoader
    })

    it("should call the single loader when one item is batched", async () => {
      const singleLoader = jest.fn((v) => Promise.resolve([{ _id: v.id }]))
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
      const multipleLoader = jest.fn((v) =>
        v.id.map((id) => ({
          _id: id,
          ...v,
        }))
      )
      const batch = batchLoader({ multipleLoader })

      await batch({ id: ["foo"], param: "bar" })
      expect(multipleLoader).toBeCalledWith({
        batched: true,
        id: ["foo"],
        param: "bar",
      })
    })

    it("should skip batching when called without an id", async () => {
      const multipleLoader = jest.fn()
      const DL = jest.genMockFromModule("dataloader")
      const dataLoaderMock = {
        load: jest.fn(),
      }
      const loaderOptions = { sort: "latest" }
      // @ts-ignore
      DL.mockImplementation(() => dataLoaderMock)
      const batch = batchLoader({ multipleLoader, DL })
      await batch(loaderOptions)
      expect(dataLoaderMock.load).not.toBeCalled()
      expect(multipleLoader).toBeCalledWith(loaderOptions)
    })

    it("should group multiple calls together", async () => {
      const multipleLoader = jest.fn((paramSet) =>
        paramSet.id.map((id) => ({
          _id: id,
          ...paramSet,
        }))
      )
      const batch = batchLoader({ multipleLoader })

      await Promise.all([batch("123"), batch("456"), batch("789")])

      expect(multipleLoader).toBeCalledTimes(1)
    })
  })
})

describe("serializeParams", () => {
  const { serializeParams } = require("../batchLoader")

  it("should return an empty string for a param object with only id", () => {
    expect(serializeParams({ id: "a" })).toBe("")
  })
  it("should return key=value for every entry in the params object", () => {
    expect(serializeParams({ id: "a", foo: "bar", bleep: "bloop" })).toBe(
      "bleep=bloop&foo=bar"
    )
  })
})

describe("groupByParams", () => {
  const { groupByParams } = require("../batchLoader")
  it("should handle a single key", () => {
    expect(groupByParams([{ id: "a" }])).toEqual([
      [""],
      [
        [
          {
            id: "a",
          },
        ],
      ],
    ])
  })

  it("should group single keys together", () => {
    const keys = [
      {
        id: "a",
      },
      {
        id: "b",
      },
    ]
    expect(groupByParams(keys)).toEqual([
      [""],
      [
        [
          {
            id: "a",
          },
          {
            id: "b",
          },
        ],
      ],
    ])
  })

  it("should group keys with the same parameters together", () => {
    const keys = [
      {
        id: "a",
        foo: "bar",
      },
      {
        id: "b",
        foo: "bar",
      },
    ]
    expect(groupByParams(keys)).toEqual([
      ["foo=bar"],
      [
        [
          {
            id: "a",
            foo: "bar",
          },

          {
            id: "b",
            foo: "bar",
          },
        ],
      ],
    ])
  })

  it("should separate keys with different parameters", () => {
    const keys = [
      { id: "a" },
      { id: "b", foo: "bar" },
      { id: "c", foo: "bar", boo: "baz" },
    ]

    expect(groupByParams(keys)).toEqual([
      ["", "foo=bar", "boo=baz&foo=bar"],
      [
        [
          {
            id: "a",
          },
        ],
        [
          {
            id: "b",
            foo: "bar",
          },
        ],
        [
          {
            id: "c",
            foo: "bar",
            boo: "baz",
          },
        ],
      ],
    ])
  })
})

describe("cacheKeyFn", () => {
  const { cacheKeyFn } = require("../batchLoader")
  it("should not treat two objects with the same id but different params as different", () => {
    expect(cacheKeyFn({ id: "123" })).not.toEqual(
      cacheKeyFn({ id: "123", foo: "bar" })
    )
  })

  it("should treat two objects with the same params and id as equal", () => {
    expect(cacheKeyFn({ id: "123", foo: "bar" })).toEqual(
      cacheKeyFn({ id: "123", foo: "bar" })
    )
  })

  it("should treat two objects with different ids as different", () => {
    expect(cacheKeyFn({ id: "456", foo: "bar" })).not.toEqual({
      id: "567",
      foo: "bar",
    })
  })
})
