import { runQuery } from "schema/v2/test/utils"

const mockFilterArtworksLoader = jest.fn().mockResolvedValue({
  hits: [
    {
      _id: "artwork-1",
      title: "Test Artwork 1",
      slug: "test-artwork-1",
    },
    {
      _id: "artwork-2",
      title: "Test Artwork 2",
      slug: "test-artwork-2",
    },
  ],
  aggregations: {
    total: {
      value: 2,
    },
  },
})

describe("discoveryCategoriesConnection", () => {
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
                artworkConnection(first: 5) {
                  edges {
                    href
                    title
                    node {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)

      // Find the "Collect by Price" category
      const priceCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Collect by Price"
      )?.node

      expect(priceCategory).toBeDefined()
      expect(priceCategory.artworkConnection.edges).toHaveLength(7) // 7 price ranges

      // Check first price range connection
      const firstConnection = priceCategory.artworkConnection.edges[0]
      expect(firstConnection.href).toBe("/collect?price_range=*-500")
      expect(firstConnection.title).toBe("Art under $500")
      expect(firstConnection.node.totalCount).toBe(2)

      // Check that filterArtworksLoader was called with correct parameters
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
                artworkConnection(first: 5) {
                  edges {
                    href
                    title
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

      const connections = priceCategory.artworkConnection.edges

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
                artworkConnection(first: 5) {
                  edges {
                    href
                    title
                  }
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, context)

      // Find a category without artworkFilters (e.g., "Medium")
      const mediumCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Medium"
      )?.node

      expect(mediumCategory).toBeDefined()
      expect(mediumCategory.artworkConnection.edges).toHaveLength(0)
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
                artworkConnection(first: 5) {
                  edges {
                    href
                    title
                    node {
                      totalCount
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

      expect(priceCategory.artworkConnection.edges).toHaveLength(7)

      // All connections should have empty results due to errors
      priceCategory.artworkConnection.edges.forEach((connection: any) => {
        expect(connection.node.totalCount).toBe(0)
        expect(connection.href).toContain("")
        expect(connection.title).toBeDefined()
      })
    })

    it("handles missing filterArtworksLoader gracefully", async () => {
      const emptyContext = {} // No loader provided

      const query = `
        {
          discoveryCategoriesConnection(first: 10) {
            edges {
              node {
                category
                artworkConnection(first: 5) {
                  edges {
                    href
                    title
                  }
                }
              }
            }
          }
        }
      `

      const result = await runQuery(query, emptyContext)

      const priceCategory = result.discoveryCategoriesConnection.edges.find(
        (edge: any) => edge.node.category === "Collect by Price"
      )?.node

      expect(priceCategory.artworkConnection.edges).toHaveLength(0)
    })
  })
})
