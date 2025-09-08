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

describe("discoveryCategoriesConnection", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns a connection of discovery categories", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 10) {
          edges {
            node {
              title
              category
              imageUrl
            }
          }
        }
      }
    `

    const result = await runQuery(query)
    expect(result.discoveryCategoriesConnection).toBeDefined()
    expect(result.discoveryCategoriesConnection.edges).toHaveLength(6)

    const categories = result.discoveryCategoriesConnection.edges.map(
      (edge: any) => edge.node
    )

    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Medium",
          category: "Medium",
        }),
        expect.objectContaining({
          title: "Movement",
          category: "Movement",
        }),
        expect.objectContaining({
          title: "Size",
          category: "Collect by Size",
        }),
        expect.objectContaining({
          title: "Color",
          category: "Collect by Color",
        }),
        expect.objectContaining({
          title: "Price",
          category: "Collect by Price",
        }),
        expect.objectContaining({
          title: "Gallery",
          category: "Gallery",
        }),
      ])
    )
  })

  it("returns categories with images", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 1) {
          edges {
            node {
              title
              imageUrl
            }
          }
        }
      }
    `

    const result = await runQuery(query)
    const firstCategory = result.discoveryCategoriesConnection.edges[0].node

    expect(firstCategory.imageUrl).toBeDefined()
    expect(firstCategory.imageUrl).toMatch(
      /^https:\/\/files\.artsy\.net\/images/
    )
  })

  it("supports pagination", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 3) {
          edges {
            node {
              title
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `

    const result = await runQuery(query)
    expect(result.discoveryCategoriesConnection.edges).toHaveLength(3)
    expect(result.discoveryCategoriesConnection.pageInfo.hasNextPage).toBe(true)
    expect(result.discoveryCategoriesConnection.pageInfo.hasPreviousPage).toBe(
      false
    )
  })

  describe("artworkConnection filtering", () => {
    const context = {
      filterArtworksLoader: mockFilterArtworksLoader,
    }

    beforeEach(() => {
      mockFilterArtworksLoader.mockClear()
    })

    it("returns filtered artwork connections for categories with artworkFilters", async () => {
      const query = `
        {
          discoveryCategoriesConnection(first: 10) {
            edges {
              node {
                category
                title
                filtersForArtworksConnection(first: 10) {
                  edges {
                    node {
                      href
                      title
                      artworksConnection(first: 3) {
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
        }
      `

      const result = await runQuery(query, context)

      const priceCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Collect by Price"
      )?.node

      expect(priceCategory).toBeDefined()
      expect(priceCategory.filtersForArtworksConnection.edges).toHaveLength(7) // 7 price ranges

      const firstFilter =
        priceCategory.filtersForArtworksConnection.edges[0].node
      expect(firstFilter.href).toBe("/collect?price_range=*-500")
      expect(firstFilter.title).toBe("Art under $500")
      expect(firstFilter.artworksConnection.edges).toHaveLength(2) // Mock returns 2 artworks

      expect(mockFilterArtworksLoader).toHaveBeenCalledWith(
        expect.objectContaining({
          price_range: "*-500",
          aggregations: ["total"],
        })
      )
    })

    it("returns all price range connections with correct hrefs and titles", async () => {
      const query = `
        {
          discoveryCategoriesConnection(first: 10) {
            edges {
              node {
                category
                filtersForArtworksConnection(first: 10) {
                  edges {
                    node {
                      href
                      title
                      artworksConnection(first: 3) {
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
        }
      `

      const result = await runQuery(query, context)

      const priceCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Collect by Price"
      )?.node

      const connections = priceCategory.filtersForArtworksConnection.edges.map(
        (edge) => ({ href: edge.node.href, title: edge.node.title })
      )

      expect(connections).toEqual([
        {
          href: "/collect?price_range=*-500",
          title: "Art under $500",
        },
        {
          href: "/collect?price_range=501-1000",
          title: "Art under $1000",
        },
        {
          href: "/collect?price_range=1001-2500",
          title: "Art under $2500",
        },
        {
          href: "/collect?price_range=2501-5000",
          title: "Art under $5000",
        },
        {
          href: "/collect?price_range=5001-10000",
          title: "Art under $10000",
        },
        {
          href: "/collect?price_range=10001-25000",
          title: "Art under $25000",
        },
        {
          href: "/collect?price_range=25001-*",
          title: "Art above $25000",
        },
      ])
    })

    it("returns empty connections for categories without artworkFilters", async () => {
      const query = `
        {
          discoveryCategoriesConnection(first: 10) {
            edges {
              node {
                category
                filtersForArtworksConnection(first: 10) {
                  edges {
                    node {
                      href
                      title
                      artworksConnection(first: 3) {
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
        }
      `

      const result = await runQuery(query, context)

      const mediumCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Medium"
      )?.node

      expect(mediumCategory).toBeDefined()
      expect(mediumCategory.filtersForArtworksConnection.edges).toHaveLength(0)
    })

    it("handles errors gracefully and returns empty connections", async () => {
      const errorLoader = jest.fn().mockRejectedValue(new Error("API Error"))
      const errorContext = {
        filterArtworksLoader: errorLoader,
      }

      const query = `
        {
          discoveryCategoriesConnection(first: 10) {
            edges {
              node {
                category
                filtersForArtworksConnection(first: 10) {
                  edges {
                    node {
                      href
                      title
                      artworksConnection(first: 3) {
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
        }
      `

      const result = await runQuery(query, errorContext)

      const priceCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Collect by Price"
      )?.node

      expect(priceCategory.filtersForArtworksConnection.edges).toHaveLength(7)

      priceCategory.filtersForArtworksConnection.edges.forEach(
        ({ node: filter }: any) => {
          expect(filter.href).toBeDefined()
          expect(filter.title).toBeDefined()
        }
      )
    })
  })
})
