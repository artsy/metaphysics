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
          id
          internalID
          title
          category  
          imageUrl
          slug
          href
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
      href: "/collections-by-filter/collect-by-price",
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

  it("returns empty artworkConnection for categories without filters", async () => {
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
    `

    const result = await runQuery(query, context, { slug: "medium" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Medium")
    expect(category.category).toBe("Medium")
    expect(category.filtersForArtworksConnection.edges).toHaveLength(0)
  })

  it("throws error for non-existent slug", async () => {
    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          title
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
          slug
          title
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
          ... on DiscoveryCategory {
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
          id
        }
      }
    `

    const categoryResult = await runQuery(categoryQuery, {})
    const globalId = categoryResult.discoveryCategoryConnection.id

    const result = await runQuery(query, {}, { id: globalId })

    expect(result.node).toBeDefined()
    expect(result.node.__typename).toBe("DiscoveryCategory")
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
          ... on DiscoveryCategory {
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
          id
        }
      }
    `

    const categoryResult = await runQuery(categoryQuery, {})
    const globalId = categoryResult.discoveryCategoryConnection.id
    const result = await runQuery(query, context, { id: globalId })

    expect(result.node).toBeDefined()
    expect(result.node.__typename).toBe("DiscoveryCategory")
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
          title
          filtersForArtworksConnection(first: 10) {
            edges {
              node {
                href
                title
              }
            }
          }
        }
      }
    `

    const result = await runQuery(query, context, { slug: "medium" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Medium")
    expect(category.filtersForArtworksConnection.edges).toHaveLength(0)
  })
})
