import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("ArtworkTemplateType", () => {
  const mockTemplate = {
    id: "template-123",
    partner_id: "partner-456",
    title: "Comprehensive Template",
    artist_ids: ["artist-1", "artist-2"],
    artsy_shipping_domestic: true,
    artsy_shipping_international: false,
    attribution_class: "unique",
    availability: "for sale",
    category: "Painting",
    certificate_of_authenticity: true,
    coa_by_authenticating_body: true,
    coa_by_gallery: false,
    condition_description: "Excellent condition with minor wear",
    date: "2023",
    depth: 5.5,
    diameter: 30.0,
    display_price_range: false,
    duration: 120.5,
    ecommerce: true,
    framed: true,
    framed_depth: 8.0,
    framed_diameter: 35.0,
    framed_height: 110.0,
    framed_metric: "cm",
    framed_width: 90.0,
    height: 100.0,
    manufacturer: "Acme Art Supply",
    medium: "Oil on canvas",
    metric: "cm",
    not_signed: false,
    offer: true,
    pickup_available: true,
    price_currency: "USD",
    price_hidden: false,
    price_listed: 15000,
    price_max: 20000,
    price_min: 10000,
    publisher: "Fine Art Press",
    series: "Abstract Series 2023",
    shipping_notes: "Requires special handling",
    shipping_weight: 25.5,
    shipping_weight_metric: "kg",
    signature: "Signature: Hand signed on verso",
    signed_by_artist: true,
    signed_in_plate: false,
    signed_other: false,
    stamped_by_artist_estate: false,
    sticker_label: false,
    tags: ["contemporary", "abstract", "colorful"],
    unique: true,
    visibility_level: "listed",
    website: "https://example.com/artwork",
    width: 80.0,
    domestic_shipping_fee_cents: 5000,
    international_shipping_fee_cents: 15000,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
  }

  const context = {
    partnerLoader: jest.fn().mockResolvedValue({
      id: "partner-456",
      _id: "partner-456",
    }),
    partnerArtworkTemplatesLoader: jest.fn().mockResolvedValue({
      body: [mockTemplate],
      headers: {
        "x-total-count": "1",
      },
    }),
    unauthenticatedLoaders: {
      artistLoader: jest.fn((id) =>
        Promise.resolve({
          id,
          _id: id,
          name: id === "artist-1" ? "Artist One" : "Artist Two",
          slug: id,
        })
      ),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns all artwork template fields correctly", async () => {
    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 1) {
            edges {
              node {
                internalID
                title
                partnerID
                artistIDs
                artsyShippingDomestic
                artsyShippingInternational
                attributionClass {
                  name
                  shortDescription
                }
                availability
                category
                certificateOfAuthenticity
                coaByAuthenticatingBody
                coaByGallery
                conditionDescription
                date
                depth
                diameter
                displayPriceRange
                duration
                ecommerce
                isFramed
                framedDepth
                framedDiameter
                framedHeight
                framedMetric
                framedWidth
                height
                manufacturer
                medium
                metric
                isNotSigned
                isOfferable
                isPickupAvailable
                priceCurrency
                isPriceHidden
                priceListed {
                  minor
                  major
                  currencyCode
                  display
                }
                priceMax {
                  minor
                  major
                  currencyCode
                  display
                }
                priceMin {
                  minor
                  major
                  currencyCode
                  display
                }
                publisher
                series
                shippingNotes
                shippingWeight
                shippingWeightMetric
                signature
                isSignedByArtist
                isSignedInPlate
                isSignedOther
                isStampedByArtistEstate
                isStickerLabel
                tags
                isUnique
                visibilityLevel
                website
                width
                domesticShippingFeeCents
                internationalShippingFeeCents
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data.partner.artworkTemplatesConnection.edges[0].node).toEqual({
      internalID: "template-123",
      title: "Comprehensive Template",
      partnerID: "partner-456",
      artistIDs: ["artist-1", "artist-2"],
      artsyShippingDomestic: true,
      artsyShippingInternational: false,
      attributionClass: {
        name: "Unique",
        shortDescription: "Unique work",
      },
      availability: "for sale",
      category: "Painting",
      certificateOfAuthenticity: true,
      coaByAuthenticatingBody: true,
      coaByGallery: false,
      conditionDescription: "Excellent condition with minor wear",
      date: "2023",
      depth: 5.5,
      diameter: 30.0,
      displayPriceRange: false,
      duration: 120.5,
      ecommerce: true,
      isFramed: true,
      framedDepth: 8.0,
      framedDiameter: 35.0,
      framedHeight: 110.0,
      framedMetric: "cm",
      framedWidth: 90.0,
      height: 100.0,
      manufacturer: "Acme Art Supply",
      medium: "Oil on canvas",
      metric: "cm",
      isNotSigned: false,
      isOfferable: true,
      isPickupAvailable: true,
      priceCurrency: "USD",
      isPriceHidden: false,
      priceListed: {
        minor: 1500000,
        major: 15000,
        currencyCode: "USD",
        display: null,
      },
      priceMax: {
        minor: 2000000,
        major: 20000,
        currencyCode: "USD",
        display: null,
      },
      priceMin: {
        minor: 1000000,
        major: 10000,
        currencyCode: "USD",
        display: null,
      },
      publisher: "Fine Art Press",
      series: "Abstract Series 2023",
      shippingNotes: "Requires special handling",
      shippingWeight: 25.5,
      shippingWeightMetric: "kg",
      signature: "Hand signed on verso",
      isSignedByArtist: true,
      isSignedInPlate: false,
      isSignedOther: false,
      isStampedByArtistEstate: false,
      isStickerLabel: false,
      tags: ["contemporary", "abstract", "colorful"],
      isUnique: true,
      visibilityLevel: "LISTED",
      website: "https://example.com/artwork",
      width: 80.0,
      domesticShippingFeeCents: 5000,
      internationalShippingFeeCents: 15000,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:45:00Z",
    })
  })

  it("handles null and empty values correctly", async () => {
    const emptyTemplate = {
      id: "template-empty",
      partner_id: "partner-456",
      title: "Empty Template",
      artist_ids: null,
      tags: null,
      attribution_class: null,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:45:00Z",
    }

    const emptyContext = {
      ...context,
      partnerArtworkTemplatesLoader: jest.fn().mockResolvedValue({
        body: [emptyTemplate],
        headers: { "x-total-count": "1" },
      }),
    }

    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 1) {
            edges {
              node {
                internalID
                title
                artistIDs
                tags
                attributionClass {
                  name
                }
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, emptyContext)

    expect(data.partner.artworkTemplatesConnection.edges[0].node).toEqual({
      internalID: "template-empty",
      title: "Empty Template",
      artistIDs: [],
      tags: [],
      attributionClass: null,
    })
  })

  it("formats dates with custom format", async () => {
    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 1) {
            edges {
              node {
                createdAt(format: "MMM D, YYYY")
                updatedAt(format: "YYYY-MM-DD")
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data.partner.artworkTemplatesConnection.edges[0].node).toEqual({
      createdAt: "Jan 15, 2024",
      updatedAt: "2024-01-20",
    })
  })

  it("strips 'Signature:' prefix from signature markdown", async () => {
    const contextWithSignature = {
      ...context,
      partnerArtworkTemplatesLoader: jest.fn().mockResolvedValue({
        body: [
          {
            ...mockTemplate,
            signature: "Signature: Lower right corner",
          },
        ],
        headers: { "x-total-count": "1" },
      }),
    }

    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 1) {
            edges {
              node {
                signature
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, contextWithSignature)

    expect(
      data.partner.artworkTemplatesConnection.edges[0].node.signature
    ).toBe("Lower right corner")
  })

  it("resolves artists field", async () => {
    const query = gql`
      {
        partner(id: "partner-456") {
          artworkTemplatesConnection(first: 1) {
            edges {
              node {
                artistIDs
                artists {
                  internalID
                  name
                }
              }
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, context)

    expect(data.partner.artworkTemplatesConnection.edges[0].node).toEqual({
      artistIDs: ["artist-1", "artist-2"],
      artists: [
        {
          internalID: "artist-1",
          name: "Artist One",
        },
        {
          internalID: "artist-2",
          name: "Artist Two",
        },
      ],
    })
  })
})
