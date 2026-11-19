import gql from "lib/gql"
import { createBatchCollectionMembershipLoader } from "lib/loaders/batchCollectionMembershipLoader"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { CollectionSorts } from "../collectionsConnection"

let context: Partial<ResolverContext>

describe("collectionsConnection", () => {
  const query = gql`
    query {
      me {
        collectionsConnection(
          first: 1
          saves: true
          sort: CREATED_AT_DESC
          includesArtworkID: "123-abc"
        ) {
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

  beforeEach(() => {
    context = {
      meLoader: jest.fn(() => Promise.resolve(defaultMockUser)),
      collectionsLoader: jest
        .fn()
        .mockResolvedValue(defaultMockGravityCollections),
    }
  })

  it("passes correct args to Gravity", async () => {
    await runAuthenticatedQuery(query, context)

    expect(context.collectionsLoader as jest.Mock).toHaveBeenCalledWith({
      user_id: "user-42",
      private: true,
      saves: true,
      sort: "-created_at",
      offset: 0,
      size: 1,
      total_count: true,
      artwork_id: "123-abc",
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

describe("collectionsConnection with isSavedArtwork field", () => {
  const query = gql`
    query {
      me {
        collectionsConnection(first: 3, sort: CREATED_AT_DESC) {
          edges {
            node {
              internalID
              isSavedArtwork(artworkID: "artwork-id")
            }
          }
        }
      }
    }
  `

  const pageOfThreeLists = {
    body: [
      { id: "list-1", name: "List 1" },
      { id: "list-2", name: "List 2" },
      { id: "list-3", name: "List 3" },
    ],
    headers: { "x-total-count": "3" },
  }

  // Wires the real DataLoader-backed loader so the test exercises batching
  // across nodes, not a stub. `fetchCollections` stands in for the Gravity
  // `collections?artwork_id=` call and returns the lists containing the artwork.
  const setupContext = (fetchCollections: jest.Mock) => ({
    meLoader: jest.fn(() => Promise.resolve(defaultMockUser)),
    collectionsLoader: jest.fn().mockResolvedValue(pageOfThreeLists),
    collectionMembershipLoader: createBatchCollectionMembershipLoader(
      fetchCollections,
      "user-42"
    ),
  })

  it("resolves membership for the whole page with a single Gravity call", async () => {
    const fetchCollections = jest
      .fn()
      .mockResolvedValue([{ id: "list-1" }, { id: "list-3" }])
    context = setupContext(fetchCollections)

    const response = await runAuthenticatedQuery(query, context)

    // One call despite three nodes each checking membership — no per-node fan-out.
    expect(fetchCollections).toHaveBeenCalledTimes(1)
    expect(fetchCollections).toHaveBeenCalledWith(
      expect.objectContaining({ artwork_id: "artwork-id" })
    )
    expect(response).toEqual({
      me: {
        collectionsConnection: {
          edges: [
            { node: { internalID: "list-1", isSavedArtwork: true } },
            { node: { internalID: "list-2", isSavedArtwork: false } },
            { node: { internalID: "list-3", isSavedArtwork: true } },
          ],
        },
      },
    })
  })
})

describe("collectionsConnection with artworksConnection", () => {
  const query = gql`
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
      meLoader: jest.fn(() => Promise.resolve(defaultMockUser)),
      collectionsLoader: jest.fn(() => Promise.resolve(mockGravityCollections)),
      collectionArtworksLoader: jest
        .fn()
        .mockResolvedValue(mockGravityCollectionArtworks),
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

describe("CollectionSorts", () => {
  it("correctly maps external sort values to sort options", () => {
    expect(CollectionSorts.getValue("CREATED_AT_ASC")?.value).toEqual(
      "created_at"
    )
    expect(CollectionSorts.getValue("CREATED_AT_DESC")?.value).toEqual(
      "-created_at"
    )
    expect(CollectionSorts.getValue("UPDATED_AT_ASC")?.value).toEqual(
      "updated_at"
    )
    expect(CollectionSorts.getValue("UPDATED_AT_DESC")?.value).toEqual(
      "-updated_at"
    )
  })
})

const defaultMockGravityCollections = {
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

const defaultMockUser = {
  id: "user-42",
}
