import { runAuthenticatedQuery } from "../test/utils"

describe("collection", () => {
  const collection = {
    id: "collection-id",
    name: "Dining room",
    private: false,
    shareable_with_partners: true,
    slug: "dining-room",
  }

  const context = {
    collectionLoader: jest.fn().mockResolvedValue(collection),
    collectionArtworksLoader: jest.fn().mockResolvedValue({
      headers: { "x-total-count": "1" },
      body: [{ id: "artwork-id" }],
    }),
  }

  it("fetches a collection by id", async () => {
    const query = `
      {
        collection(id: "collection-id", userID: "user-42") {
          name
          private
          shareableWithPartners
          slug
        }
      }
    `

    await runAuthenticatedQuery(query, context)

    expect(context.collectionLoader).toHaveBeenCalledWith("collection-id", {
      user_id: "user-42",
    })
  })

  it("returns a collection", async () => {
    const query = `
      {
        collection(id: "collection-id", userID: "user-42") {
          name
          private
          shareableWithPartners
          slug
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      collection: {
        name: "Dining room",
        private: false,
        shareableWithPartners: true,
        slug: "dining-room",
      },
    })
  })

  it("uses the injected userID when fetching artworks", async () => {
    const query = `
      {
        collection(id: "collection-id", userID: "user-42") {
          artworksConnection(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, context)

    expect(context.collectionArtworksLoader).toHaveBeenCalledWith(
      "collection-id",
      expect.objectContaining({
        user_id: "user-42",
      })
    )
  })
})
