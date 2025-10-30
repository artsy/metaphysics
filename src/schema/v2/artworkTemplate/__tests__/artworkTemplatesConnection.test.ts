import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artworkTemplatesConnection", () => {
  const templates = [
    {
      id: "template-1",
      partner_id: "partner-123",
      title: "Template 1",
      artist_ids: ["artist-1", "artist-2"],
      category: "Painting",
      medium: "Oil on canvas",
      height: 100,
      width: 80,
      metric: "cm",
      availability: "for sale",
      price_listed: 500000,
      price_currency: "USD",
      unique: true,
      certificate_of_authenticity: true,
      signed_by_artist: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
    {
      id: "template-2",
      partner_id: "partner-123",
      title: "Template 2",
      artist_ids: ["artist-3"],
      category: "Photography",
      medium: "Archival pigment print",
      height: 60,
      width: 40,
      depth: 2,
      metric: "cm",
      framed: true,
      framed_height: 65,
      framed_width: 45,
      framed_metric: "cm",
      availability: "for sale",
      price_min: 200000,
      price_max: 300000,
      price_currency: "USD",
      display_price_range: true,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z",
    },
    {
      id: "template-3",
      partner_id: "partner-123",
      title: "Template 3",
      artist_ids: [],
      category: "Sculpture",
      medium: "Bronze",
      height: 150,
      width: 50,
      depth: 50,
      metric: "cm",
      availability: "for sale",
      price_hidden: true,
      ecommerce: false,
      offer: true,
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-06T00:00:00Z",
    },
  ]

  const context = {
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-123",
      _id: "partner-123",
    }),
    partnerArtworkTemplatesLoader: jest.fn().mockResolvedValue({
      body: templates,
      headers: {
        "x-total-count": "3",
      },
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns artwork templates with all fields correctly", async () => {
    const query = gql`
      {
        partner(id: "partner-123") {
          artworkTemplatesConnection(first: 10) {
            totalCount
            edges {
              node {
                internalID
                title
                artistIDs
                category
                medium
                height
                width
                depth
                metric
                availability
                priceListed
                priceMin
                priceMax
                priceCurrency
                isPriceHidden
                displayPriceRange
                isFramed
                framedHeight
                framedWidth
                framedMetric
                certificateOfAuthenticity
                isSignedByArtist
                isUnique
                ecommerce
                isOfferable
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      partner: {
        artworkTemplatesConnection: {
          totalCount: 3,
          edges: [
            {
              node: {
                internalID: "template-1",
                title: "Template 1",
                artistIDs: ["artist-1", "artist-2"],
                category: "Painting",
                medium: "Oil on canvas",
                height: 100,
                width: 80,
                depth: null,
                metric: "cm",
                availability: "for sale",
                priceListed: "$5,000",
                priceMin: null,
                priceMax: null,
                priceCurrency: "USD",
                isPriceHidden: null,
                displayPriceRange: null,
                isFramed: null,
                framedHeight: null,
                framedWidth: null,
                framedMetric: null,
                certificateOfAuthenticity: true,
                isSignedByArtist: true,
                isUnique: true,
                ecommerce: null,
                isOfferable: null,
              },
            },
            {
              node: {
                internalID: "template-2",
                title: "Template 2",
                artistIDs: ["artist-3"],
                category: "Photography",
                medium: "Archival pigment print",
                height: 60,
                width: 40,
                depth: 2,
                metric: "cm",
                availability: "for sale",
                priceListed: null,
                priceMin: "$2,000",
                priceMax: "$3,000",
                priceCurrency: "USD",
                isPriceHidden: null,
                displayPriceRange: true,
                isFramed: true,
                framedHeight: 65,
                framedWidth: 45,
                framedMetric: "cm",
                certificateOfAuthenticity: null,
                isSignedByArtist: null,
                isUnique: null,
                ecommerce: null,
                isOfferable: null,
              },
            },
            {
              node: {
                internalID: "template-3",
                title: "Template 3",
                artistIDs: [],
                category: "Sculpture",
                medium: "Bronze",
                height: 150,
                width: 50,
                depth: 50,
                metric: "cm",
                availability: "for sale",
                priceListed: null,
                priceMin: null,
                priceMax: null,
                priceCurrency: null,
                isPriceHidden: true,
                displayPriceRange: null,
                isFramed: null,
                framedHeight: null,
                framedWidth: null,
                framedMetric: null,
                certificateOfAuthenticity: null,
                isSignedByArtist: null,
                isUnique: null,
                ecommerce: false,
                isOfferable: true,
              },
            },
          ],
        },
      },
    })

    // Verify loader was called with correct parameters
    expect(context.partnerArtworkTemplatesLoader).toHaveBeenCalledWith(
      "partner-123",
      {
        page: 1,
        size: 10,
        total_count: true,
      }
    )
  })

  it("supports pagination", async () => {
    const query = gql`
      {
        partner(id: "partner-123") {
          artworkTemplatesConnection(
            first: 5
            after: "YXJyYXljb25uZWN0aW9uOjQ="
          ) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(query, context)

    expect(context.partnerArtworkTemplatesLoader).toHaveBeenCalledWith(
      "partner-123",
      {
        page: 2,
        size: 5,
        total_count: true,
      }
    )
  })

  it("returns empty array when partner has no templates", async () => {
    const emptyContext = {
      partnerLoader: jest.fn().mockResolvedValue({
        id: "partner-456",
        _id: "partner-456",
      }),
      partnerArtworkTemplatesLoader: jest.fn().mockResolvedValue({
        body: [],
        headers: {
          "x-total-count": "0",
        },
      }),
    }

    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 10) {
            totalCount
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, emptyContext)

    expect(data).toEqual({
      partner: {
        artworkTemplatesConnection: {
          totalCount: 0,
          edges: [],
        },
      },
    })
  })

  it("requires authentication", async () => {
    const unauthenticatedContext = {
      partnerLoader: jest.fn().mockResolvedValue({
        id: "partner-123",
        _id: "partner-123",
      }),
      partnerArtworkTemplatesLoader: undefined,
    }

    const query = gql`
      {
        partner(id: "partner-123") {
          artworkTemplatesConnection(first: 10) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    await expect(
      runAuthenticatedQuery(query, unauthenticatedContext)
    ).rejects.toThrow("You need to pass a X-Access-Token header")
  })
})
