import { runQuery } from "schema/v2/test/utils"

const mockFilterArtworksLoader = jest.fn().mockResolvedValue({
  hits: [
    {
      _id: "artwork-1",
      title: "Test Artwork 1",
      slug: "test-artwork-1",
      id: "test-artwork-1",
    },
    {
      _id: "artwork-2",
      title: "Test Artwork 2",
      slug: "test-artwork-2",
      id: "test-artwork-2",
    },
  ],
  aggregations: {
    total: {
      value: 2,
    },
  },
})

describe("discoveryCategoryConnection", () => {
  beforeEach(() => {
    mockFilterArtworksLoader.mockClear()
  })

  it("returns a single discovery category by slug", async () => {
    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          ... on DiscoveryArtworksWithFiltersCollection {
            id
            internalID
            title
            category  
            imageUrl
            slug
            href
          }
        }
      }
    `

    const result = await runQuery(query, {}, { slug: "collect-by-price" })
    expect(result.discoveryCategoryConnection).toBeDefined()

    const category = result.discoveryCategoryConnection
    expect(category).toEqual({
      id: expect.any(String), // Global ID will be encoded
      internalID: "collect-by-price",
      title: "Price",
      category: "Collect by Price",
      imageUrl:
        "https://files.artsy.net/images/collections-price-category.jpeg",
      slug: "collect-by-price",
      href: "/collections-by-category/collect-by-price",
    })
  })

  it("returns artworkConnection for categories with filters", async () => {
    const context = {
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
      authenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          ... on DiscoveryArtworksWithFiltersCollection {
            title
            category
            filtersForArtworksConnection(first: 10) {
              edges {
                node {
                  href
                  title
                  artworksConnection(first: 5) {
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
      }
    `

    const result = await runQuery(query, context, { slug: "collect-by-price" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Price")
    expect(category.category).toBe("Collect by Price")
    expect(category.filtersForArtworksConnection.edges).toHaveLength(7)

    const firstFilter = category.filtersForArtworksConnection.edges[0].node
    expect(firstFilter.href).toBe("/collect?price_range=*-500")
    expect(firstFilter.title).toBe("Art under $500")
    expect(firstFilter.artworksConnection.edges).toHaveLength(2)
  })

  it("returns DiscoveryMarketingCollection for categories without filters", async () => {
    const mockMarketingCollectionsLoader = jest.fn().mockResolvedValue([
      {
        id: "medium-collection",
        slug: "medium",
        title: "Medium Collection",
      },
    ])

    const context = {
      marketingCollectionsLoader: mockMarketingCollectionsLoader,
    }

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          __typename
          ... on DiscoveryMarketingCollection {
            title
            category
            marketingCollections {
              slug
              title
            }
          }
        }
      }
    `

    const result = await runQuery(query, context, { slug: "medium" })
    const category = result.discoveryCategoryConnection

    expect(category.__typename).toBe("DiscoveryMarketingCollection")
    expect(category.title).toBe("Medium")
    expect(category.category).toBe("Medium")
    expect(category.marketingCollections).toBeDefined()
    expect(Array.isArray(category.marketingCollections)).toBe(true)
  })

  it("throws error for non-existent slug", async () => {
    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          ... on DiscoveryArtworksWithFiltersCollection {
            title
          }
          ... on DiscoveryMarketingCollection {
            title
          }
        }
      }
    `

    await expect(
      runQuery(query, {}, { slug: "non-existent-slug" })
    ).rejects.toThrow(
      "Discovery category not found for slug: non-existent-slug"
    )
  })

  it("supports all valid category slugs", async () => {
    const validSlugs = [
      "medium",
      "movement",
      "collect-by-size",
      "collect-by-color",
      "collect-by-price",
      "gallery",
    ]

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          ... on DiscoveryArtworksWithFiltersCollection {
            slug
            title
          }
          ... on DiscoveryMarketingCollection {
            slug
            title
          }
        }
      }
    `

    for (const slug of validSlugs) {
      const result = await runQuery(query, {}, { slug })
      expect(result.discoveryCategoryConnection.slug).toBe(slug)
      expect(result.discoveryCategoryConnection.title).toBeDefined()
    }
  })

  it("can be queried via Node interface to assure the relay pagination", async () => {
    const query = `
      query($id: ID!) {
        node(id: $id) {
          __typename
          ... on DiscoveryArtworksWithFiltersCollection {
            id
            internalID
            title
            category
            slug
          }
        }
      }
    `

    const categoryQuery = `
      query {
        discoveryCategoryConnection(slug: "collect-by-price") {
          ... on DiscoveryArtworksWithFiltersCollection {
            id
          }
        }
      }
    `

    const categoryResult = await runQuery(categoryQuery, {})
    const globalId = categoryResult.discoveryCategoryConnection.id

    const result = await runQuery(query, {}, { id: globalId })

    expect(result.node).toBeDefined()
    expect(result.node.__typename).toBe(
      "DiscoveryArtworksWithFiltersCollection"
    )
    expect(result.node.title).toBe("Price")
    expect(result.node.category).toBe("Collect by Price")
    expect(result.node.slug).toBe("collect-by-price")
    expect(result.node.internalID).toBe("collect-by-price")
  })

  it("can query filtersForArtworksConnection via Node interface", async () => {
    const context = {
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
      authenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }

    const query = `
      query($id: ID!) {
        node(id: $id) {
          __typename
          ... on DiscoveryArtworksWithFiltersCollection {
            id
            title
            category
            filtersForArtworksConnection(first: 2) {
              edges {
                node {
                  href
                  title
                  artworksConnection(first: 1) {
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
      }
    `

    const categoryQuery = `
      query {
        discoveryCategoryConnection(slug: "collect-by-price") {
          ... on DiscoveryArtworksWithFiltersCollection {
            id
          }
        }
      }
    `

    const categoryResult = await runQuery(categoryQuery, {})
    const globalId = categoryResult.discoveryCategoryConnection.id
    const result = await runQuery(query, context, { id: globalId })

    expect(result.node).toBeDefined()
    expect(result.node.__typename).toBe(
      "DiscoveryArtworksWithFiltersCollection"
    )
    expect(result.node.title).toBe("Price")
    expect(result.node.category).toBe("Collect by Price")
    expect(result.node.filtersForArtworksConnection.edges).toHaveLength(2)

    const firstFilter = result.node.filtersForArtworksConnection.edges[0].node
    expect(firstFilter.href).toBe("/collect?price_range=*-500")
    expect(firstFilter.title).toBe("Art under $500")
    expect(firstFilter.artworksConnection.edges).toHaveLength(1)
    expect(firstFilter.artworksConnection.edges[0].node.slug).toBe(
      "test-artwork-1"
    )
  })

  it("returns totalCount of 0 for categories without filters", async () => {
    const context = {
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
      authenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          ... on DiscoveryMarketingCollection {
            title
          }
        }
      }
    `

    const result = await runQuery(query, context, { slug: "medium" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Medium")
    expect(category.filtersForArtworksConnection).toBeUndefined()
  })

  describe("DiscoveryMarketingCollection type", () => {
    const mockMarketingCollectionsLoader = jest.fn((args) => {
      return Promise.resolve({
        body: [
          {
            id: `test-collection-id-${args.categorySlug || "unknown"}`,
            slug: args.categorySlug || "unknown",
            title: `${args.categorySlug || "unknown"} Collection`,
            artworks_connection: {
              edges: [
                {
                  node: {
                    id: "artwork-1",
                    slug: "test-artwork-1",
                    title: "Test Artwork 1",
                  },
                },
                {
                  node: {
                    id: "artwork-2",
                    slug: "test-artwork-2",
                    title: "Test Artwork 2",
                  },
                },
              ],
            },
          },
        ],
        headers: {},
      })
    })

    beforeEach(() => {
      mockMarketingCollectionsLoader.mockClear()
    })

    it("returns DiscoveryMarketingCollection for categories without artworkFilters", async () => {
      const context = {
        marketingCollectionsLoader: mockMarketingCollectionsLoader,
      }

      const query = `
        query($slug: String!) {
          discoveryCategoryConnection(slug: $slug) {
            __typename
            ... on DiscoveryMarketingCollection {
              id
              internalID
              title
              category
              slug
              href
              marketingCollections {
                slug
                title
              }
            }
          }
        }
      `

      const result = await runQuery(query, context, { slug: "medium" })
      const category = result.discoveryCategoryConnection

      expect(category.__typename).toBe("DiscoveryMarketingCollection")
      expect(category.title).toBe("Medium")
      expect(category.category).toBe("Medium")
      expect(category.slug).toBe("medium")
      expect(category.marketingCollections).toBeDefined()
      expect(Array.isArray(category.marketingCollections)).toBe(true)
    })

    it("can query artworksConnection with pagination through marketingCollection", async () => {
      const mockFilterArtworksConnectionLoader = jest.fn().mockResolvedValue({
        hits: [
          {
            _id: "artwork-1",
            title: "Test Artwork 1",
            slug: "test-artwork-1",
            id: "test-artwork-1",
          },
          {
            _id: "artwork-2",
            title: "Test Artwork 2",
            slug: "test-artwork-2",
            id: "test-artwork-2",
          },
        ],
        aggregations: {
          total: {
            value: 2,
          },
        },
      })

      const context = {
        marketingCollectionsLoader: mockMarketingCollectionsLoader,
        unauthenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksConnectionLoader,
        },
        authenticatedLoaders: {
          filterArtworksLoader: mockFilterArtworksConnectionLoader,
        },
      }

      const query = `
        query($slug: String!) {
          discoveryCategoryConnection(slug: $slug) {
            ... on DiscoveryMarketingCollection {
              marketingCollections {
                slug
                title
                artworksConnection(first: 5, after: null) {
                  edges {
                    node {
                      slug
                      title
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                  }
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, context, { slug: "movement" })
      const marketingCollections =
        result.discoveryCategoryConnection.marketingCollections

      expect(marketingCollections).toBeDefined()
      expect(Array.isArray(marketingCollections)).toBe(true)
      expect(marketingCollections.length).toBeGreaterThan(0)

      // Test the first marketing collection
      const firstCollection = marketingCollections[0]
      expect(firstCollection.artworksConnection).toBeDefined()
      expect(firstCollection.artworksConnection.edges).toHaveLength(2)
      expect(firstCollection.artworksConnection.edges[0].node.slug).toBe(
        "test-artwork-1"
      )
      expect(firstCollection.artworksConnection.pageInfo).toBeDefined()
    })

    it("handles marketingCollection loading errors gracefully", async () => {
      const mockErrorLoader = jest
        .fn()
        .mockRejectedValue(new Error("Marketing collection not found"))

      const context = {
        marketingCollectionsLoader: mockErrorLoader,
      }

      const query = `
        query($slug: String!) {
          discoveryCategoryConnection(slug: $slug) {
            ... on DiscoveryMarketingCollection {
              title
              marketingCollections {
                slug
                title
              }
            }
          }
        }
      `

      const result = await runQuery(query, context, { slug: "gallery" })
      const category = result.discoveryCategoryConnection

      expect(category.title).toBe("Gallery")
      expect(category.marketingCollections).toEqual([])
      expect(mockErrorLoader).toHaveBeenCalled()
    })
  })
})
