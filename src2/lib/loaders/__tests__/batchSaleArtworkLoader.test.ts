import {
  groupByParams,
  createBatchSaleArtworkLoader,
} from "../batchSaleArtworkLoader"

describe("groupByParams", () => {
  it("groups incoming sale/artwork tuples by sale and de-dupes", () => {
    const params = [
      { artworkId: "art1", saleId: "sale1" },
      { artworkId: "art2", saleId: "sale1" },
      { artworkId: "art3", saleId: "sale2" },
      { artworkId: "art1", saleId: "sale1" }, // duplicate sale/artwork pair
    ]
    const result = groupByParams(params)
    const expected = {
      sale1: ["art1", "art2"],
      sale2: ["art3"],
    }
    expect(result).toEqual(expected)
  })
})

describe("createBatchSaleArtworkLoader", () => {
  let mockSaleArtworksLoader: jest.Mock

  beforeEach(() => {
    mockSaleArtworksLoader = jest.fn((saleId, { artwork_ids }) => {
      return Promise.resolve(
        artwork_ids.map((artworkId) => ({
          artwork: { _id: artworkId },
          saleId,
        }))
      )
    })
  })

  it("makes the right batched requests", async () => {
    const batchSaleArtworkLoader = createBatchSaleArtworkLoader(
      mockSaleArtworksLoader
    )

    const key1 = { artworkId: "art1", saleId: "sale1" }
    const key2 = { artworkId: "art2", saleId: "sale1" }
    const key3 = { artworkId: "art3", saleId: "sale2" }
    const key4 = { artworkId: "art1", saleId: "sale1" } // duplicate sale/artwork pair

    const [result1, result2, result3, result4] = await Promise.all([
      batchSaleArtworkLoader(key1),
      batchSaleArtworkLoader(key2),
      batchSaleArtworkLoader(key3),
      batchSaleArtworkLoader(key4),
    ])

    // One call per sale with the correct artworks and no dupes
    const expectedCalls = [
      ["sale1", { artwork_ids: ["art1", "art2"], size: 2 }],
      ["sale2", { artwork_ids: ["art3"], size: 1 }],
    ]
    expectedCalls.forEach((call) => {
      expect(mockSaleArtworksLoader).toHaveBeenCalledWith(...call)
    })
    expect(mockSaleArtworksLoader).toHaveBeenCalledTimes(2)

    expect(result1).toEqual({ artwork: { _id: "art1" }, saleId: "sale1" })
    expect(result2).toEqual({ artwork: { _id: "art2" }, saleId: "sale1" })
    expect(result3).toEqual({ artwork: { _id: "art3" }, saleId: "sale2" })
    expect(result4).toEqual({ artwork: { _id: "art1" }, saleId: "sale1" })
  })

  it("handles failures gracefully without rejecting the whole batch", async () => {
    mockSaleArtworksLoader = jest.fn((saleId, { artwork_ids }) => {
      if (saleId === "sale1") {
        return Promise.reject(new Error("Cats in the server room"))
      }
      return Promise.resolve(
        artwork_ids.map((artworkId) => ({
          artwork: { _id: artworkId },
          saleId,
        }))
      )
    })

    const batchSaleArtworkLoader = createBatchSaleArtworkLoader(
      mockSaleArtworksLoader
    )

    const key1 = { artworkId: "art1", saleId: "sale1" }
    const key2 = { artworkId: "art2", saleId: "sale2" }

    const [result1, result2] = await Promise.all([
      batchSaleArtworkLoader(key1),
      batchSaleArtworkLoader(key2),
    ])

    expect(result1).toBeUndefined()
    expect(result2).toEqual({ artwork: { _id: "art2" }, saleId: "sale2" })
  })
})
