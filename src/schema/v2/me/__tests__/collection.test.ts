import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

let query = gql`
  query {
    me {
      collection(id: "123-abc") {
        internalID
        name
        default
        saves
        artworksCount
      }
    }
  }
`

const mockGravityCollection = {
  id: "123-abc",
  name: "Works for dining room",
  default: false,
  saves: true,
  artworks_count: 42,
  visible_artworks_count: 39,
}

let context: Partial<ResolverContext>

beforeEach(() => {
  context = {
    meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
    collectionLoader: jest.fn(() => Promise.resolve(mockGravityCollection)),
  }
})

it("passes correct args to Gravity", async () => {
  await runAuthenticatedQuery(query, context)

  expect(context.collectionLoader as jest.Mock).toHaveBeenCalledWith(
    mockGravityCollection.id,
    {
      user_id: "user-42",
      private: true,
    }
  )
})

it("returns collection attributes", async () => {
  const response = await runAuthenticatedQuery(query, context)

  expect(response).toEqual({
    me: {
      collection: {
        internalID: "123-abc",
        name: "Works for dining room",
        default: false,
        saves: true,
        artworksCount: 42,
      },
    },
  })
})

describe("name field", () => {
  it("should return `Saved Artworks` for default collection", async () => {
    context.collectionLoader = jest.fn(() => {
      return Promise.resolve({
        ...mockGravityCollection,
        default: true,
        saves: true,
      })
    })

    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.collection.name).toBe("Saved Artworks")
  })

  it("should return name received from gravity", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response.me.collection.name).toBe("Works for dining room")
  })
})

describe("isSavedArtwork field", () => {
  beforeEach(() => {
    query = gql`
      query {
        me {
          collection(id: "123-abc") {
            isSavedArtwork(artworkID: "artwork-id")
          }
        }
      }
    `
  })

  it("should return true if artwork is included in the collection", async () => {
    context.collectionArtworksLoader = jest.fn().mockResolvedValue({
      headers: {
        "x-total-count": 1,
      },
    })

    const response = await runAuthenticatedQuery(query, context)

    expect(response).toEqual({
      me: {
        collection: {
          isSavedArtwork: true,
        },
      },
    })
  })

  it("should return false if artwork is included in the collection", async () => {
    context.collectionArtworksLoader = jest.fn().mockResolvedValue({
      headers: {
        "x-total-count": 0,
      },
    })
    const response = await runAuthenticatedQuery(query, context)

    expect(response).toEqual({
      me: {
        collection: {
          isSavedArtwork: false,
        },
      },
    })
  })
})

describe("artworksCount field", () => {
  it("should return visible_artworks_count if onlyVisible is true", async () => {
    const countQuery = gql`
      query {
        me {
          collection(id: "123-abc") {
            artworksCount(onlyVisible: true)
          }
        }
      }
    `
    const response = await runAuthenticatedQuery(countQuery, context)

    expect(response.me.collection.artworksCount).toBe(
      mockGravityCollection.visible_artworks_count
    )
  })

  it("should return artworks_count if onlyVisible is false or not passed", async () => {
    let countQuery = gql`
      query {
        me {
          collection(id: "123-abc") {
            artworksCount(onlyVisible: false)
          }
        }
      }
    `
    let response = await runAuthenticatedQuery(countQuery, context)
    expect(response.me.collection.artworksCount).toBe(
      mockGravityCollection.artworks_count
    )

    countQuery = gql`
      query {
        me {
          collection(id: "123-abc") {
            artworksCount
          }
        }
      }
    `
    response = await runAuthenticatedQuery(countQuery, context)
    expect(response.me.collection.artworksCount).toBe(
      mockGravityCollection.artworks_count
    )
  })
})

describe("artworksConnection", () => {
  const mockGravityCollectionArtworks = {
    headers: {
      "x-total-count": 42,
    },
    body: [
      {
        _id: "11",
        id: "first-artwork",
        title: "First Artwork",
      },
      {
        _id: "22",
        id: "second-artwork",
        title: "Second Artwork",
      },
    ],
  }

  beforeEach(() => {
    context.collectionArtworksLoader = jest
      .fn()
      .mockResolvedValue(mockGravityCollectionArtworks)

    query = gql`
      query {
        me {
          collection(id: "123-abc") {
            artworksConnection(first: 2, sort: SAVED_AT_DESC) {
              totalCount
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      }
    `
  })

  it("passes correct args to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.collectionArtworksLoader as jest.Mock).toHaveBeenCalledWith(
      mockGravityCollection.id,
      {
        page: 1,
        size: 2,
        sort: "-created_at",
        user_id: "user-42",
        private: true,
        total_count: true,
      }
    )
  })

  it("returns artwork data as a connection", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response).toEqual({
      me: {
        collection: {
          artworksConnection: {
            totalCount: 42,
            edges: [
              {
                node: {
                  slug: "first-artwork",
                },
              },
              {
                node: {
                  slug: "second-artwork",
                },
              },
            ],
          },
        },
      },
    })
  })

  describe("pagination", () => {
    it("supports page and size params", async () => {
      query = gql`
        query {
          me {
            collection(id: "123-abc") {
              artworksConnection(page: 2, sort: SAVED_AT_DESC) {
                totalCount
                edges {
                  node {
                    slug
                  }
                }
              }
            }
          }
        }
      `

      await runAuthenticatedQuery(query, context)

      expect(
        context.collectionArtworksLoader as jest.Mock
      ).toHaveBeenCalledWith(mockGravityCollection.id, {
        page: 2,
        sort: "-created_at",
        user_id: "user-42",
        private: true,
        total_count: true,
      })
    })
  })
})
