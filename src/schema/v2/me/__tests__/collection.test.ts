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
    context.collectionArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        headers: {
          "x-total-count": 1,
        },
      })
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
    context.collectionArtworksLoader = jest.fn(() => {
      return Promise.resolve({
        headers: {
          "x-total-count": 0,
        },
      })
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
    context.collectionArtworksLoader = jest.fn(() =>
      Promise.resolve(mockGravityCollectionArtworks)
    )

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
