import { runQuery } from "schema/v2/test/utils"

describe("discoveryCategoryArtworksConnection", () => {
  const mockFilterArtworksLoader = jest.fn().mockResolvedValue({
    hits: [
      {
        _id: "artwork-1",
        id: "artwork-1",
        slug: "artwork-1",
        title: "Test Artwork 1",
      },
      {
        _id: "artwork-2",
        id: "artwork-2",
        slug: "artwork-2",
        title: "Test Artwork 2",
      },
    ],
    aggregations: {
      total: {
        value: 2,
      },
    },
    total: 2,
  })

  const context = {
    unauthenticatedLoaders: {
      filterArtworksLoader: mockFilterArtworksLoader,
    },
    authenticatedLoaders: {
      filterArtworksLoader: mockFilterArtworksLoader,
    },
  }

  beforeEach(() => {
    mockFilterArtworksLoader.mockClear()
  })

  it("returns filtered artworks for a specific filter", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "collect-by-price"
          filterSlug: "art-under-500"
          first: 10
          aggregations: [TOTAL]
        ) {
          edges {
            node {
              slug
              title
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.discoveryCategoryArtworksConnection.edges).toHaveLength(2)
    expect(result.discoveryCategoryArtworksConnection.edges[0].node.slug).toBe(
      "artwork-1"
    )

    // Verify the loader was called with the specific filter
    expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        price_range: "*-500", // Only the specific filter for "Art under $500"
        aggregations: ["total"],
        size: 10,
        page: 1,
      })
    )
  })

  it("throws error for category without filters when filterSlug is provided", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "medium"
          filterSlug: "some-filter"
          first: 5
          aggregations: [TOTAL]
        ) {
          edges {
            node {
              slug
              title
            }
          }
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(
      "Category medium has no filters available"
    )
  })

  it("merges category filters with user-provided filters", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "collect-by-price"
          filterSlug: "art-under-1000"
          first: 5
          input: { medium: "painting" }
          aggregations: [TOTAL]
        ) {
          edges {
            node {
              slug
              title
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.discoveryCategoryArtworksConnection.edges).toHaveLength(2)

    expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        medium: "painting",
        price_range: "501-1000",
        aggregations: ["total"],
        size: 5,
        page: 1,
      })
    )
  })

  it("throws error for non-existent category slug", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "non-existent"
          filterSlug: "any-filter"
          first: 10
          aggregations: [TOTAL]
        ) {
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(
      "Discovery category not found for slug: non-existent"
    )
  })

  it("throws error for non-existent filter slug", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "collect-by-price"
          filterSlug: "non-existent-filter"
          first: 10
          aggregations: [TOTAL]
        ) {
          edges {
            node {
              slug
            }
          }
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(
      "Filter not found for slug: non-existent-filter in category: collect-by-price"
    )
  })

  it("supports pagination", async () => {
    const query = `
      query {
        discoveryCategoryArtworksConnection(
          categorySlug: "collect-by-price"
          filterSlug: "art-under-500"
          first: 1
          after: "YXJyYXljb25uZWN0aW9uOjA="
          aggregations: [TOTAL]
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            cursor
            node {
              slug
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(result.discoveryCategoryArtworksConnection.pageInfo).toBeDefined()
    expect(result.discoveryCategoryArtworksConnection.edges).toHaveLength(1)
  })
})
