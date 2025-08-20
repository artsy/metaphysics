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

describe("discoveryCategoryConnection", () => {
  beforeEach(() => {
    mockFilterArtworksLoader.mockClear()
  })

  it("returns a single discovery category by slug", async () => {
    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
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
      filterArtworksLoader: mockFilterArtworksLoader,
    }

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          title
          category
          artworkConnections(first: 5) {
            href
            title
            totalCount
          }
        }
      }
    `

    const result = await runQuery(query, context, { slug: "collect-by-price" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Price")
    expect(category.category).toBe("Collect by Price")
    expect(category.artworkConnections).toHaveLength(7) // 7 price ranges

    const firstConnection = category.artworkConnections[0]
    expect(firstConnection.href).toBe("/collect?price_range=*-500")
    expect(firstConnection.title).toBe("Art under $500")
    expect(firstConnection.totalCount).toBe(2)
  })

  it("returns empty artworkConnection for categories without filters", async () => {
    const context = {
      filterArtworksLoader: mockFilterArtworksLoader,
    }

    const query = `
      query($slug: String!) {
        discoveryCategoryConnection(slug: $slug) {
          title
          category
          artworkConnections(first: 5) {
            href
            title
          }
        }
      }
    `

    const result = await runQuery(query, context, { slug: "medium" })
    const category = result.discoveryCategoryConnection

    expect(category.title).toBe("Medium")
    expect(category.category).toBe("Medium")
    expect(category.artworkConnections).toHaveLength(0)
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
})
