import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

let context: Partial<ResolverContext>

describe("collectionsConnection", () => {
  let query = gql`
    query {
      me {
        collectionsConnection(first: 1) {
          edges {
            node {
              internalID
              name
              default
              saves
              artworksCount
            }
          }
        }
      }
    }
  `

  const mockGravityCollections = {
    body: [
      {
        id: "123-abc",
        name: "Works for dining room",
        default: false,
        saves: true,
        artworks_count: 42,
      },
    ],
    headers: {
      "x-total-count": 1,
    },
  }

  beforeEach(() => {
    context = {
      meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
      collectionsLoader: jest.fn(() => Promise.resolve(mockGravityCollections)),
    }
  })

  it("passes correct args to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.collectionsLoader as jest.Mock).toHaveBeenCalledWith({
      user_id: "user-42",
      private: true,
      offset: 0,
      size: 1,
      total_count: true,
    })
  })

  it("returns correct data", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response).toEqual({
      me: {
        collectionsConnection: {
          edges: [
            {
              node: {
                internalID: "123-abc",
                name: "Works for dining room",
                default: false,
                saves: true,
                artworksCount: 42,
              },
            },
          ],
        },
      },
    })
  })
})

describe("collectionsConnection with artworksConnection", () => {
  let query = gql`
    query {
      me {
        collectionsConnection(first: 1) {
          edges {
            node {
              name
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
      }
    }
  `

  const mockGravityCollections = {
    body: [
      {
        id: "default-saves",
        name: "Default saves",
      },
    ],
    headers: {
      "x-total-count": "1",
    },
  }

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
    context = {
      meLoader: jest.fn(() => Promise.resolve({ id: "user-42" })),
      collectionsLoader: jest.fn(() => Promise.resolve(mockGravityCollections)),
      collectionArtworksLoader: jest.fn(() =>
        Promise.resolve(mockGravityCollectionArtworks)
      ),
    }
  })

  it("passes correct args to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.collectionsLoader as jest.Mock).toHaveBeenCalledWith({
      user_id: "user-42",
      private: true,
      offset: 0,
      size: 1,
      total_count: true,
    })

    expect(context.collectionArtworksLoader as jest.Mock).toHaveBeenCalledWith(
      "default-saves",
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

  it("returns correct data", async () => {
    const response = await runAuthenticatedQuery(query, context)

    expect(response).toEqual({
      me: {
        collectionsConnection: {
          edges: [
            {
              node: {
                name: "Default saves",
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
          ],
        },
      },
    })
  })
})
