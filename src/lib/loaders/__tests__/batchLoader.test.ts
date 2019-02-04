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
      const singleLoader = jest.fn(v => Promise.resolve([{ _id: v.id }]))
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
      const multipleLoader = jest.fn(v =>
        v.id.map(id => ({
          _id: id,
          ...v,
        }))
      )
      const batch = batchLoader({ multipleLoader })

      await batch({ id: "foo", param: "bar" })
      expect(multipleLoader).toBeCalledWith({
        id: ["foo"],
        param: "bar",
        size: 1,
      })
    })

    it("should group multiple calls together", async () => {
      const multipleLoader = jest.fn(paramSet =>
        paramSet.id.map(id => ({
          _id: id,
          ...paramSet,
        }))
      )
      const batch = batchLoader({ multipleLoader })

      await Promise.all([batch("123"), batch("456"), batch("789")])

      expect(multipleLoader).toBeCalledTimes(1)
    })

    it("should return a default value when an id is missing", async () => {
      const multipleLoader = jest.fn(({ id: ids }) =>
        ids.slice(1).map(id => ({
          _id: id,
        }))
      )
      const batch = batchLoader({ multipleLoader, defaultResult: {} })

      const results = await Promise.all([
        batch("123"),
        batch("456"),
        batch("789"),
      ])
      expect(results).toEqual([
        {},
        {
          _id: "456",
        },
        {
          _id: "789",
        },
      ])

      expect(multipleLoader).toBeCalledWith({
        id: ["123", "456", "789"],
        size: 3,
      })
    })
  })
})

const { groupKeys } = require("../batchLoader")
describe("groupKeys", () => {
  it("should handle a single key", () => {
    expect(groupKeys(["a"])).toEqual([
      {
        id: ["a"],
        size: 1,
      },
    ])
  })

  it("should group single keys together", () => {
    expect(groupKeys(["a", "b", "c"])).toEqual([
      {
        id: ["a", "b", "c"],
        size: 3,
      },
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
    expect(groupKeys(keys)).toEqual([
      {
        id: ["a", "b"],
        foo: "bar",
        size: 2,
      },
    ])
  })

  it("should separate keys with different parameters", () => {
    const keys = [
      "a",
      { id: "b", foo: "bar" },
      { id: "c", foo: "bar", boo: "baz" },
    ]

    expect(groupKeys(keys)).toEqual([
      {
        id: ["a"],
        size: 1,
      },
      {
        id: ["b"],
        foo: "bar",
        size: 1,
      },
      {
        id: ["c"],
        foo: "bar",
        boo: "baz",
        size: 1,
      },
    ])
  })
})
