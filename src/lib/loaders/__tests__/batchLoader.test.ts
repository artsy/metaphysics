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
      })
    })
  })
})

describe("groupKeys", () => {
  const { groupKeys } = require("../batchLoader")
  it("should handle a single key", () => {
    expect(groupKeys([{ id: "a" }])).toEqual([
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
    expect(groupKeys(keys)).toEqual([
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
    expect(groupKeys(keys)).toEqual([
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

    expect(groupKeys(keys)).toEqual([
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
  it("should treat strings and objects with only an id key the same", () => {
    expect(cacheKeyFn("123")).toEqual(cacheKeyFn({ id: "123" }))
  })

  it("should treat strings and objects with params as different", () => {
    expect(cacheKeyFn("123")).not.toEqual(cacheKeyFn({ id: "123", foo: "bar" }))
  })

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

describe("normalizeKeys", () => {
  const { normalizeKeys } = require("../batchLoader")

  it("should turn a string into an object with an id", () => {
    expect(normalizeKeys(["123"])).toEqual([{ id: "123" }])
  })

  it("should preserve an object with an id", () => {
    const keys = [{ id: "123", foo: "bar" }]
    expect(normalizeKeys(keys)).toEqual(keys)
  })
})
