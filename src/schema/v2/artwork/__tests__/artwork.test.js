/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { assign } from "lodash"
import moment from "moment"
import { getMicrofunnelDataByArtworkInternalID } from "schema/v2/artist/targetSupply/utils/getMicrofunnelData"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { CHECKOUT_TAXES_DOC_URL } from "../taxInfo"

jest.mock("schema/v2/artist/targetSupply/utils/getMicrofunnelData")

describe("Artwork type", () => {
  const sale = { id: "existy" }

  let artwork = null
  let context = null

  const artworkInLowDemand = {
    artistId: "artist-id",
    demandRank: 0.64,
    medium: "Painting",
    annualLotsSold: 25,
    annualValueSoldCents: 577662200012,
    lastAuctionResultDate: "2022-06-15T00:00:00Z",
    medianSalePriceLast36Months: 577662200012,
    liquidityRank: 0.9,
    sellThroughRate: 0.902,
    medianSaleOverEstimatePercentage: 123,
  }
  const artworkInHighDemand = {
    artistId: "artist-id",
    demandRank: 0.9,
    medium: "Painting",
    annualLotsSold: 25,
    annualValueSoldCents: 577662200012,
    lastAuctionResultDate: "2022-06-15T00:00:00Z",
    medianSalePriceLast36Months: 577662200012,
    liquidityRank: 0.9,
    sellThroughRate: 0.902,
    medianSaleOverEstimatePercentage: 123,
  }

  const artworkInsights = [artworkInLowDemand, artworkInHighDemand]

  const artworkImages = [
    {
      position: 2,
      is_default: false,
      id: "56b6311876143f4e82000188",
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["icon", "large"],
      image_urls: {
        icon: "https://xxx.cloudfront.net/xxx/icon.png",
        large: "https://xxx.cloudfront.net/xxx/large.jpg",
      },
    },
    {
      position: 1,
      is_default: true,
      id: "56b64ed2cd530e670c0000b2",
      image_url: "https://xxx.cloudfront.net/xxx/:version.jpg",
      image_versions: ["icon", "large"],
      image_urls: {
        icon: "https://xxx.cloudfront.net/xxx/icon.png",
        large: "https://xxx.cloudfront.net/xxx/large.jpg",
      },
    },
  ]

  beforeEach(() => {
    artwork = {
      _id: "richard-prince-untitled-portrait-database-id",
      id: "richard-prince-untitled-portrait",
      artist: {
        _id: "artist-id",
      },
      medium: "print",
      title: "Untitled (Portrait)",
      forsale: true,
      acquireable: false,
      artists: [],
      sale_ids: ["sale-id-not-auction", "sale-id-auction"],
      attribution_class: "unique",
      dimensions: { in: "2 x 3in." },
      metric: "in",
      category: "Painting",
      artsy_shipping_domestic: false,
    }

    context = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
    }
  })

  describe("#condition", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          condition {
            value
            displayText
            description
          }
        }
      }
    `

    it("returns the artwork's condition", async () => {
      artwork = {
        ...artwork,
        condition: "very_good",
        condition_description: "no visible damage",
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          condition: {
            value: "VERY_GOOD",
            displayText: "Very good",
            description: "No visible damage",
          },
        },
      })
    })
  })

  describe("#importSource", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          importSource
        }
      }
    `

    it("returns properly import source", async () => {
      artwork = {
        ...artwork,
        import_source: "convection",
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          importSource: "CONVECTION",
        },
      })
    })

    it("returns null if source is unknown", async () => {
      artwork = {
        ...artwork,
        import_source: "something-else",
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          importSource: null,
        },
      })
    })

    it("returns null if source is empty", async () => {
      artwork = {
        ...artwork,
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          importSource: null,
        },
      })
    })
  })

  describe("#formattedMetadata", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          formattedMetadata
        }
      }
    `

    it("returns properly formatted metadata", async () => {
      artwork = {
        ...artwork,
        artist: { name: "Name" },
        title: "Title",
        date: "Date",
        category: "Category",
        medium: "Medium",
        partner: { name: "Partner" },
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          formattedMetadata: "Name, ‘Title’, Date, Category, Medium, Partner",
        },
      })
    })

    it("excludes null values", async () => {
      artwork = {
        ...artwork,
        artist: { name: "Name" },
        title: "Title",
        date: "Date",
        category: null,
        medium: null,
        partner: { name: "Partner" },
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          formattedMetadata: "Name, ‘Title’, Date, Partner",
        },
      })
    })
  })

  describe("dimensions", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          dimensions {
            cm
          }
        }
      }
    `

    beforeEach(() => {
      artwork = {
        ...artwork,
        dimensions: {
          cm: "2x3",
        },
      }
      context = {
        artworkLoader: sinon
          .stub()
          .withArgs(artwork.id)
          .returns(Promise.resolve(artwork)),
      }
    })

    it("returns width and height", () => {
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            dimensions: {
              cm: "2x3",
            },
          },
        })
      })
    })
  })

  describe("sizeScore", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          sizeScore
        }
      }
    `

    beforeEach(() => {
      artwork = {
        ...artwork,
        size_score: 2.5,
      }
      context = {
        artworkLoader: sinon
          .stub()
          .withArgs(artwork.id)
          .returns(Promise.resolve(artwork)),
      }
    })

    it("returns sizeScore", () => {
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            sizeScore: 2.5,
          },
        })
      })
    })
  })

  describe("sizeBucket", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          sizeBucket
        }
      }
    `

    beforeEach(() => {
      artwork = {
        ...artwork,
        size_bucket: "large",
      }
      context = {
        artworkLoader: sinon
          .stub()
          .withArgs(artwork.id)
          .returns(Promise.resolve(artwork)),
      }
    })

    it("returns sizeBucket", () => {
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            sizeBucket: "large",
          },
        })
      })
    })
  })

  describe("#is_downloadable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isDownloadable
        }
      }
    `

    it("is downloadable if the first image is downloadable", () => {
      artwork.images = [
        {
          id: "image1",
          downloadable: true,
        },
        {
          id: "image2",
          downloadable: false,
        },
      ]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isDownloadable: true,
          },
        })
      })
    })

    it("is not downloadable if it does not have a downloadable image", () => {
      artwork.images = [
        {
          id: "image1",
          downloadable: false,
        },
        {
          id: "image2",
          downloadable: false,
        },
      ]
      const sales = Promise.resolve([sale])
      context.relatedSalesLoader = sinon.stub().returns(sales)

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isDownloadable: false,
          },
        })
      })
    })

    it("is not downloadable if it does not have any images", () => {
      const sales = Promise.resolve([sale])
      context.relatedSalesLoader = sinon.stub().returns(sales)

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isDownloadable: false,
          },
        })
      })
    })
  })

  describe("#isOfferable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isOfferable
        }
      }
    `

    it("will return the value of offerable", () => {
      artwork.offerable = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isOfferable: true,
          },
        })
      })
    })
  })

  describe("#isOfferableFromInquiry", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isOfferableFromInquiry
        }
      }
    `

    it("will return the value of offerable_from_inquiry", () => {
      artwork.offerable_from_inquiry = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isOfferableFromInquiry: true,
          },
        })
      })
    })
  })

  describe("visibility_level", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          visibilityLevel
        }
      }
    `

    it("returns valid visibility level", async () => {
      artwork = {
        ...artwork,
        visibility_level: "listed",
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          visibilityLevel: "LISTED",
        },
      })
    })

    it("returns null if visibility level is empty", async () => {
      artwork = {
        ...artwork,
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          visibilityLevel: null,
        },
      })
    })
  })

  describe("#pricePaid", () => {
    const query = `
    {
      artwork(id: "richard-prince-untitled-portrait") {
        pricePaid {
          display
          currencyCode
        }
      }
    }
    `

    it("returns pricePaid and defaults to USD if no currency is present", () => {
      artwork.price_paid_cents = 21000

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            pricePaid: {
              display: "$210",
              currencyCode: "USD",
            },
          },
        })
      })
    })

    it("returns null if no pricePaid exists", () => {
      artwork.price_paid_cents = null

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            pricePaid: null,
          },
        })
      })
    })
  })

  describe("#listPrice", () => {
    const query = `
    {
        artwork(id: "richard-prince-untitled-portrait") {
          listPrice {
            ... on Money {
              minor
              major
              display
              currencyCode

            }
            ... on PriceRange {
              display
              minPrice {
                minor
                major
                currencyCode
                display
              }
              maxPrice {
                minor
                major
                currencyCode
                display
              }
            }
          }
        }
      }
    `

    it("returns correct data for an exact priced work", () => {
      // Exact priced at $420
      artwork.price_cents = [42000]
      artwork.price = "$420"
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            listPrice: {
              minor: 42000,
              major: 420,
              display: "US$420",
              currencyCode: "USD",
            },
          },
        })
      })
    })

    it("returns correct data for an 'Under X' priced work", () => {
      // Priced at under $420
      artwork.price_cents = [null, 42000]
      artwork.price = "Under $420"
      artwork.price_currency = "AUD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            listPrice: {
              display: "Under AU$420",
              minPrice: null,
              maxPrice: {
                minor: 42000,
                major: 420,
                display: null,
                currencyCode: "AUD",
              },
            },
          },
        })
      })
    })

    it("returns correct data for an 'Starting at X' priced work", () => {
      // Priced at Starting at $420
      artwork.price_cents = [42000, null]
      artwork.price = "Starting at $420"
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            listPrice: {
              display: "Starting at US$420",
              minPrice: {
                minor: 42000,
                major: 420,
                display: null,
                currencyCode: "USD",
              },
              maxPrice: null,
            },
          },
        })
      })
    })
  })

  describe("#pickupAvailable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          pickupAvailable
        }
      }
    `

    it("passes true from gravity", () => {
      artwork.pickup_available = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            pickupAvailable: true,
          },
        })
      })
    })
  })

  describe("#displayArtistBio", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          displayArtistBio
        }
      }
    `

    it("passes true from gravity", () => {
      artwork.display_artist_bio = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            displayArtistBio: true,
          },
        })
      })
    })
  })

  describe("#priceIncludesTaxDisplay", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          priceIncludesTaxDisplay
        }
      }
    `

    it("returns a string if price_includes_tax is true", () => {
      artwork.price_includes_tax = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            priceIncludesTaxDisplay: "VAT included in price",
          },
        })
      })
    })

    it("returns null if price_includes_tax is false", () => {
      artwork.price_includes_tax = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            priceIncludesTaxDisplay: null,
          },
        })
      })
    })
  })

  describe("#artaShippingEnabled", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          artaShippingEnabled
        }
      }
    `

    it("passes true from gravity", () => {
      artwork.arta_enabled = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            artaShippingEnabled: true,
          },
        })
      })
    })
  })

  describe("#artsyShippingDomestic", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          artsyShippingDomestic
        }
      }
    `

    it("passes true from gravity", () => {
      artwork.artsy_shipping_domestic = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            artsyShippingDomestic: true,
          },
        })
      })
    })
  })

  describe("#artsyShippingInternational", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          artsyShippingInternational
        }
      }
    `

    it("passes true from gravity", () => {
      artwork.artsy_shipping_international = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            artsyShippingInternational: true,
          },
        })
      })
    })
  })

  describe("#processWithArtsyShippingDomestic", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          processWithArtsyShippingDomestic
        }
      }
    `

    describe("when process_with_artsy_shipping is true", () => {
      beforeEach(() => {
        artwork.process_with_artsy_shipping_domestic = true
      })

      it("returns the correct value", () => {
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              slug: "richard-prince-untitled-portrait",
              processWithArtsyShippingDomestic: true,
            },
          })
        })
      })
    })
  })

  describe("#images", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          image {
            internalID
          }
        }
      }
    `

    it("returns the first default image", () => {
      artwork.images = artworkImages

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            image: {
              internalID: "56b64ed2cd530e670c0000b2",
            },
          },
        })
      })
    })
  })

  describe("#figures", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          figures {
            ...on Image {
              position
            }
          }
        }
      }
    `

    it("returns images sorted by position", () => {
      artwork.images = artworkImages

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            figures: [
              {
                position: 1,
              },
              {
                position: 2,
              },
            ],
          },
        })
      })
    })
  })

  describe("#edition_sets", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          editionSets {
            saleMessage
          }
        }
      }
    `

    it("returns the proper saleMessage for edition sets", () => {
      artwork.edition_sets = [
        {
          forsale: false,
          price: "$1,000",
          sale_message: "Permanent collection",
        },
        { forsale: true, price: "$1,000" },
        { forsale: true, sale_message: "Inquire about availability" },
      ]

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            editionSets: [
              {
                saleMessage: "Permanent collection",
              },
              {
                saleMessage: "$1,000",
              },
              {
                saleMessage: "Inquire about availability",
              },
            ],
          },
        })
      })
    })

    it("returns the proper sizeScore for edition sets", () => {
      artwork.edition_sets = [
        {
          size_score: 3.4,
        },
        {
          size_score: 6.2,
        },
        {
          size_score: 2.7,
        },
      ]

      const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          editionSets {
            sizeScore
          }
        }
      }
    `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            editionSets: [
              {
                sizeScore: 3.4,
              },
              {
                sizeScore: 6.2,
              },
              {
                sizeScore: 2.7,
              },
            ],
          },
        })
      })
    })

    it("can sort by price ascending", () => {
      artwork.edition_sets = [
        {
          id: "$200",
          price_cents: [200],
        },
        {
          id: "$100-400",
          price_cents: [100, 400],
        },
        {
          id: "Under 400",
          price_cents: [null, 400],
        },
        {
          id: "$400 and up",
          price_cents: [400, null],
        },
        {
          id: "not for sale",
          price_cents: [],
        },
      ]

      const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          editionSets(sort: PRICE_ASC) {
            internalID
          }
        }
      }
    `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            editionSets: [
              {
                internalID: "Under 400",
              },
              {
                internalID: "$100-400",
              },
              {
                internalID: "$200",
              },
              {
                internalID: "$400 and up",
              },
              {
                internalID: "not for sale",
              },
            ],
          },
        })
      })
    })
  })

  describe("#isInAuction", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isInAuction
        }
      }
    `

    it("is true if the artwork has any sales that are auctions", () => {
      const sales = [
        assign({}, sale, { is_auction: false }),
        assign({}, sale, { is_auction: true }),
      ]
      context.salesLoader = sinon.stub().returns(Promise.resolve(sales))

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isInAuction: true,
          },
        })
      })
    })

    it("is false if the artwork is not in any sales that are auctions", () => {
      context.salesLoader = sinon.stub().returns(Promise.resolve([]))

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isInAuction: false,
          },
        })
      })
    })
  })

  describe("#saleMessage", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          saleMessage
        }
      }
    `

    it("returns the gravity sale_message if for sale but there is no price", () => {
      artwork.availability = "for sale"
      artwork.sale_message = "something from gravity"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "something from gravity",
          },
        })
      })
    })

    it("returns the formatted price if for sale", () => {
      artwork.availability = "for sale"
      artwork.price_cents = [42000]
      artwork.price_currency = "USD"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "US$420",
          },
        })
      })
    })

    it("returns the formatted price range if sale is a price range", () => {
      artwork.availability = "for sale"
      artwork.sale_message = "something from gravity"
      artwork.price_cents = [6900, 42000]
      artwork.price_currency = "USD"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "US$69–US$420",
          },
        })
      })
    })
  })

  describe("#priceListedDisplay", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          priceListedDisplay
        }
      }
    `

    it("returns 'Not publicly listed' if work is on hold with no price", () => {
      artwork.price_cents = null
      artwork.availability = "on hold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            priceListedDisplay: "Not publicly listed",
          },
        })
      })
    })

    it("returns 'Not publicly listed' if work is for sale with no price", () => {
      artwork.price_cents = null
      artwork.availability = "for sale"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            priceListedDisplay: "Not publicly listed",
          },
        })
      })
    })

    it("returns '[Price]' if work is on hold with a price", () => {
      artwork.price_cents = [42000000]
      artwork.price_currency = "USD"
      artwork.availability = "on hold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            priceListedDisplay: "US$420,000",
          },
        })
      })
    })

    it("returns '[Price]' if work is sold", () => {
      artwork.price_cents = [42000000]
      artwork.price_currency = "USD"
      artwork.availability = "sold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            priceListedDisplay: "US$420,000",
          },
        })
      })
    })

    it("returns '[Price]' if work is not for sale", () => {
      artwork.price_cents = [42000000]
      artwork.price_currency = "USD"
      artwork.availability = "not for sale"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            priceListedDisplay: "US$420,000",
          },
        })
      })
    })
  })

  describe("#collectionsConnection", () => {
    const query = gql`
      query {
        artwork(id: "richard-prince-untitled-portrait") {
          collectionsConnection(first: 1, saves: true, sort: CREATED_AT_DESC) {
            totalCount

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

    const collectionsMock = {
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
      context.meLoader = jest.fn(() => Promise.resolve({ id: "user-42" }))
      context.collectionsLoader = jest.fn(() =>
        Promise.resolve(collectionsMock)
      )
    })

    it("passes correct args to Gravity", async () => {
      await runAuthenticatedQuery(query, context)

      expect(context.collectionsLoader).toHaveBeenCalledWith({
        artwork_id: "richard-prince-untitled-portrait",
        user_id: "user-42",
        private: true,
        saves: true,
        sort: "-created_at",
        offset: 0,
        size: 1,
        total_count: true,
      })
    })

    it("returns correct data", async () => {
      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        artwork: {
          collectionsConnection: {
            totalCount: 1,
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

    it("returns null if the fetch returned an error (artwork unpublished)", async () => {
      context.collectionsLoader = jest.fn(() => {
        throw new Error("Artwork Not Published")
      })

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        artwork: {
          collectionsConnection: null,
        },
      })
    })
  })

  describe("#consignmentSubmission", () => {
    const submission = {
      id: "1",
      state: "submitted",
    }
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          consignmentSubmission {
            displayText
            inProgress
          }
        }
      }
    `

    it("returns null since submissions are deprecated", () => {
      artwork.consignmentSubmission = {
        id: "1",
        state: "SUBMITTED",
        saleState: null,
      }

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            consignmentSubmission: null,
          },
        })
      })
    })

    it("returns null if submission not found", () => {
      artwork.submission_id = "1"
      context.convectionGraphQLLoader = () =>
        Promise.resolve({
          submissions: {
            edges: [],
          },
        })

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            consignmentSubmission: null,
          },
        })
      })
    })

    it("returns null for artwork's submission since Convection is disabled", () => {
      artwork.submission_id = "1"
      context.convectionGraphQLLoader = () =>
        Promise.resolve({
          submissions: {
            edges: [
              {
                node: submission,
              },
            ],
          },
        })

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            consignmentSubmission: null,
          },
        })
      })
    })
  })

  describe("#contactMessage", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          contactMessage
        }
      }
    `

    it("returns bid text for an auction partner type", () => {
      artwork.partner = { type: "Auction" }

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage:
              "Hello, I am interested in placing a bid on this work. Please send me more information.", // eslint-disable-line max-len
          },
        })
      })
    })

    it("returns similar work text for a sold work", () => {
      artwork.availability = "sold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage:
              "Hi, I’m interested in similar works by this artist. Could you please let me know if you have anything available?", // eslint-disable-line max-len
          },
        })
      })
    })
    it("returns similar work text for a on loan work", () => {
      artwork.availability = "on loan"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage:
              "Hi, I’m interested in similar works by this artist. Could you please let me know if you have anything available?", // eslint-disable-line max-len
          },
        })
      })
    })
    it("returns purchase text for an on hold work", () => {
      artwork.availability = "on hold"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage:
              "Hi, I’m interested in purchasing this work. Could you please provide more information about the piece?", // eslint-disable-line max-len
          },
        })
      })
    })
    it("returns nothing for a not for sale work", () => {
      artwork.availability = "not for sale"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage: null,
          },
        })
      })
    })
  })

  describe("sale_artwork", () => {
    it("returns the first sale artwork", async () => {
      const query = gql`
        {
          artwork(id: "richard-prince-untitled-portrait") {
            saleArtwork {
              saleID
            }
          }
        }
      `
      context.saleArtworkLoader = ({ saleId, artworkId }) =>
        saleId === artwork.sale_ids[0] &&
        artworkId === "richard-prince-untitled-portrait-database-id" &&
        Promise.resolve({ sale_id: saleId })

      const {
        artwork: {
          saleArtwork: { saleID },
        },
      } = await runQuery(query, context)
      expect(saleID).toEqual(artwork.sale_ids[0])
    })

    it("returns the specified sale artwork", async () => {
      const query = gql`
        {
          artwork(id: "richard-prince-untitled-portrait") {
            saleArtwork(saleID: "sale-id-auction") {
              saleID
            }
          }
        }
      `
      context.saleArtworkLoader = ({ saleId, artworkId }) =>
        saleId === artwork.sale_ids[1] &&
        artworkId === "richard-prince-untitled-portrait-database-id" &&
        Promise.resolve({ sale_id: saleId })
      const {
        artwork: {
          saleArtwork: { saleID },
        },
      } = await runQuery(query, context)
      expect(saleID).toEqual(artwork.sale_ids[1])
    })
  })

  describe("#isBiddable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isBiddable
        }
      }
    `

    it("is true if the artwork has any sales that are open auctions", () => {
      context.salesLoader = sinon.stub().returns(Promise.resolve([{}]))
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isBiddable: true,
          },
        })
      })
    })

    it("is false if the artwork is not in any sales that are auctions", () => {
      context.salesLoader = sinon.stub().returns(Promise.resolve([]))
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isBiddable: false,
          },
        })
      })
    })
  })

  describe("#canRequestLotConditionsReport", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          canRequestLotConditionsReport
        }
      }
    `

    it("is true if the artwork's sale is an auction, live, and has lot conditions report enabled", () => {
      context.saleLoader = sinon.stub().returns(
        Promise.resolve({
          auction_state: "open",
          is_auction: true,
          lot_conditions_report_enabled: true,
        })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            canRequestLotConditionsReport: true,
          },
        })
      })
    })

    it("is false if the artwork's sale is not an auction", () => {
      context.saleLoader = sinon.stub().returns(
        Promise.resolve({
          // auction_state would always be `null` for non-auction sales but
          // this adds extra layer of protection in case Gravity has a bug.
          auction_state: "open",
          is_auction: false,
          lot_conditions_report_enabled: true,
        })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            canRequestLotConditionsReport: false,
          },
        })
      })
    })

    it("is false if the artwork's sale is closed", () => {
      context.saleLoader = sinon.stub().returns(
        Promise.resolve({
          auction_state: "closed",
          is_auction: true,
          lot_conditions_report_enabled: true,
        })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            canRequestLotConditionsReport: false,
          },
        })
      })
    })

    it("is false if the artwork's sale state is preview", () => {
      context.saleLoader = sinon.stub().returns(
        Promise.resolve({
          auction_state: "preview",
          is_auction: true,
          lot_conditions_report_enabled: true,
        })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            canRequestLotConditionsReport: false,
          },
        })
      })
    })

    it("is false if the lot conditions report for the sale is not enabled", () => {
      context.saleLoader = sinon.stub().returns(
        Promise.resolve({
          auction_state: "open",
          is_auction: true,
          lot_conditions_report_enabled: false,
        })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            canRequestLotConditionsReport: false,
          },
        })
      })
    })
  })

  describe("#isBuyNowable", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isBuyNowable
        }
      }
    `

    it("is true if the artwork is acquireable and in an open auction", () => {
      artwork.acquireable = true
      context.salesLoader = sinon.stub().returns(
        Promise.resolve([
          {
            slug: "sale-id",
          },
        ])
      )
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isBuyNowable: true,
          },
        })
      })
    })

    it("is false if the artwork is not acquireable", () => {
      artwork.acquireable = false
      context.salesLoader = sinon.stub().returns(
        Promise.resolve([
          {
            slug: "sale-id",
          },
        ])
      )
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isBuyNowable: false,
          },
        })
      })
    })

    it("is false if the artwork is acquireable but not in any open sales", () => {
      artwork.acquireable = false
      context.salesLoader = sinon.stub().returns(Promise.resolve([]))
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isBuyNowable: false,
          },
        })
      })
    })
  })

  describe("#isSavedToList", () => {
    const query = gql`
      query {
        artwork(id: "catty-artwork-slug") {
          isSavedToList
        }
      }
    `

    const collectionsMock = {
      headers: {
        "x-total-count": 1,
      },
    }

    beforeEach(() => {
      context.artworkLoader = jest.fn(() =>
        Promise.resolve({ _id: "catty-artwork-id" })
      )
      context.userID = "percy-z"
    })

    it("passes the correct args and resolves properly", async () => {
      context.collectionsLoader = jest.fn(() =>
        Promise.resolve(collectionsMock)
      )

      const response = await runAuthenticatedQuery(query, context)

      expect(context.collectionsLoader).toHaveBeenCalledWith({
        artwork_id: "catty-artwork-id",
        user_id: "percy-z",
        private: true,
        saves: true,
        size: 0,
        default: false,
        total_count: true,
      })

      expect(response).toEqual({
        artwork: {
          isSavedToList: true,
        },
      })
    })

    it("returns false if the fetch returned an error (artwork unpublished)", async () => {
      context.collectionsLoader = jest.fn(() => {
        throw new Error("Artwork Not Published")
      })

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        artwork: {
          isSavedToList: false,
        },
      })
    })
  })

  describe("#context", () => {
    it("returns either one Fair, Sale, or PartnerShow", () => {
      const relatedSale = assign({}, sale, {
        is_auction: true,
        name: "Y2K",
        end_at: moment.utc("1999-12-31").format(),
      })
      context.salesLoader = sinon.stub().returns(Promise.resolve([relatedSale]))
      context.relatedFairsLoader = sinon.stub().returns(Promise.resolve([]))
      context.showsLoader = sinon.stub().returns(Promise.resolve([]))
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            banner: context {
              __typename
              ... on Sale {
                name
                href
                endAt(format: "D:M:YYYY")
              }
              ... on Fair {
                name
                href
              }
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data.artwork.banner).toEqual({
          __typename: "Sale",
          name: "Y2K",
          href: "/auction/existy",
          endAt: "31:12:1999",
        })
      })
    })
  })

  describe("predicates", () => {
    describe("#isShareable", () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            slug
            isShareable
          }
        }
      `

      it("returns false if the artwork is not shareable", () => {
        artwork.can_share_image = false
        return runQuery(query, context).then((data) => {
          expect(data.artwork.isShareable).toBe(false)
        })
      })
    })

    describe("#isHangable", () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            slug
            isHangable
          }
        }
      `

      describe("if the artwork is able to be used with View in Room", () => {
        it("is hangable if artwork has a 2D category and height and width are < 50ft", () => {
          artwork.width = "100"
          artwork.height = "100"
          artwork.depth = "0.1"
          artwork.diameter = null
          artwork.width_cm = 100
          artwork.height_cm = 100
          artwork.depth_cm = 0.1
          artwork.diameter_cm = null
          artwork.metric = "cm"
          artwork.category = "Print"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })

        it("is hangable if artwork has a 2D category and height and width are < 50ft, even if depth is large", () => {
          artwork.width = "100"
          artwork.height = "100"
          artwork.depth = "50"
          artwork.diameter = null
          artwork.width_cm = 100
          artwork.height_cm = 100
          artwork.depth_cm = 50
          artwork.diameter_cm = null
          artwork.metric = "cm"
          artwork.category = "Print"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })

        it("is hangable if artwork has a 2D category, even if is round", () => {
          artwork.diameter = "15"
          artwork.diameter_cm = 15
          artwork.metric = "cm"
          artwork.category = "Print"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })

        it("is hangable if artwork is not in the 3D category or 2D category but has reasonable dimensions", () => {
          artwork.width = "100"
          artwork.height = "100"
          artwork.depth = "0.1"
          artwork.diameter = null
          artwork.width_cm = 100
          artwork.height_cm = 100
          artwork.depth_cm = 0.1
          artwork.diameter_cm = null
          artwork.metric = "cm"
          artwork.category = "Mixed Media"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })
      })

      describe("if the artwork is not able to be used with View in Room", () => {
        it("is not hangable if the artwork is in a 3D category", () => {
          artwork.category = "Fashion Design and Wearable Art"
          artwork.width = "100"
          artwork.height = "100"
          artwork.depth = "0.1"
          artwork.diameter = null
          artwork.width_cm = 100
          artwork.height_cm = 100
          artwork.depth_cm = 0.1
          artwork.diameter_cm = null
          artwork.metric = "cm"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if the work has a large depth and is not in a 2D category", () => {
          artwork.width = "100"
          artwork.height = "100"
          artwork.depth = "1000"
          artwork.diameter = null
          artwork.width_cm = 100
          artwork.height_cm = 100
          artwork.depth_cm = 1000
          artwork.diameter_cm = null
          artwork.metric = "cm"
          artwork.category = "Mixed Media"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if the dimensions are unreasonably large", () => {
          artwork.width = "10000"
          artwork.height = "10000"
          artwork.depth = "0.1"
          artwork.diameter = null
          artwork.width_cm = 10000
          artwork.height_cm = 10000
          artwork.depth_cm = 0.1
          artwork.diameter_cm = null
          artwork.metric = "cm"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })
      })
    })
    describe("#isInquireable", () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            slug
            isInquireable
          }
        }
      `

      it("returns true for inquireable works", () => {
        artwork.inquireable = true
        return runQuery(query, context).then((data) => {
          expect(data.artwork.isInquireable).toBe(true)
        })
      })

      it("returns false for non inquireable works", () => {
        artwork.inquireable = false
        return runQuery(query, context).then((data) => {
          expect(data.artwork.isInquireable).toBe(false)
        })
      })
    })
  })

  describe("#inquiryQuestions", () => {
    const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            inquiryQuestions {
              internalID
              question
            }
          }
        }
      `

    it("returns inquiry questions if an artwork is not inquirable", () => {
      const context = {
        artworkLoader: () => {
          return Promise.resolve({ id: "blah", inquireable: false })
        },
        inquiryRequestQuestionsLoader: () => {
          return Promise.resolve([
            {
              id: "shipping",
              question: "Shipping",
            },
            {
              id: "condition_and_provenance",
              question: "Condition & Provenance",
            },
          ])
        },
      }

      return runQuery(query, context).then((data) => {
        expect(data.artwork.inquiryQuestions).toEqual([
          {
            internalID: "shipping",
            question: "Shipping",
          },
          {
            internalID: "condition_and_provenance",
            question: "Condition & Provenance",
          },
        ])
      })
    })

    it("returns inquiry questions if an artwork is inquirable", () => {
      const context = {
        artworkLoader: () => {
          return Promise.resolve({ id: "blah", inquireable: true })
        },
        inquiryRequestQuestionsLoader: () => {
          return Promise.resolve([
            {
              id: "price_and_availability",
              question: "Price & Availability",
            },
            {
              id: "shipping",
              question: "Shipping",
            },
            {
              id: "condition_and_provenance",
              question: "Condition & Provenance",
            },
          ])
        },
      }

      return runQuery(query, context).then((data) => {
        expect(data.artwork.inquiryQuestions).toEqual([
          {
            internalID: "price_and_availability",
            question: "Price & Availability",
          },
          {
            internalID: "shipping",
            question: "Shipping",
          },
          {
            internalID: "condition_and_provenance",
            question: "Condition & Provenance",
          },
        ])
      })
    })
  })

  describe("markdown fields", () => {
    describe("#signature", () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            slug
            signature(format: HTML)
          }
        }
      `

      it("removes the hardcoded signature label if present", () => {
        artwork.signature = "Signature: Foo *bar*"
        return runQuery(query, context).then(({ artwork: { signature } }) => {
          expect(signature).toBe("<p>Foo <em>bar</em></p>\n")
        })
      })

      it("tolerates null signatures", () => {
        artwork.signature = null
        return runQuery(query, context).then(({ artwork: { signature } }) => {
          expect(signature).toBe(null)
        })
      })
    })
  })

  describe("#isPriceRange", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          slug
          isPriceRange
        }
      }
    `

    it("returns true if artwork price is a range.", () => {
      artwork.price = "$200 - $300"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isPriceRange: true,
          },
        })
      })
    })

    it("returns false if artwork price is not a range.", () => {
      artwork.price = "$1000"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isPriceRange: false,
          },
        })
      })
    })

    it("returns false if artwork price with single edition is not a range.", () => {
      artwork.price = "$200"
      artwork.edition_sets = [{}]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isPriceRange: false,
          },
        })
      })
    })

    it("returns true if artwork price with single edition is a range.", () => {
      artwork.price = "$200 - $300"
      artwork.edition_sets = [{}]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isPriceRange: true,
          },
        })
      })
    })

    it("returns false if artwork price with multiple editions is a range.", () => {
      artwork.price = "$200 - $300"
      artwork.edition_sets = [{}, {}]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            isPriceRange: false,
          },
        })
      })
    })
  })

  describe("A title", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          title
        }
      }
    `

    it("is Untitled when its title is null", () => {
      artwork.title = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            title: "Untitled",
          },
        })
      })
    })

    it("is Untitled title when its title is empty", () => {
      artwork.title = ""
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            title: "Untitled",
          },
        })
      })
    })
  })

  describe("#myLotStanding", () => {
    const lotStandings = [
      { sale_artwork: { id: "past" } },
      { sale_artwork: { id: "live" } },
    ]

    function query(live) {
      return gql`
        {
          artwork(id: "richard-prince-untitled-portrait") {
            myLotStanding${live === undefined ? "" : `(live: ${live})`} {
              saleArtwork {
                slug
              }
            }
          }
        }
      `
    }

    beforeEach(() => {
      context.lotStandingLoader = (params) => {
        if (params.live === true) {
          return Promise.resolve([lotStandings[1]])
        } else if (params.live === false) {
          return Promise.resolve([lotStandings[0]])
        }
        return Promise.resolve(lotStandings)
      }
    })

    it("returns all lot standings by default", () => {
      return runQuery(query(undefined), context).then(
        ({ artwork: { myLotStanding } }) => {
          expect(myLotStanding).toEqual([
            { saleArtwork: { slug: "past" } },
            { saleArtwork: { slug: "live" } },
          ])
        }
      )
    })

    it("returns all lot standings", () => {
      return runQuery(query(null), context).then(
        ({ artwork: { myLotStanding } }) => {
          expect(myLotStanding).toEqual([
            { saleArtwork: { slug: "past" } },
            { saleArtwork: { slug: "live" } },
          ])
        }
      )
    })

    it("returns only lot standings for live sales", () => {
      return runQuery(query(true), context).then(
        ({ artwork: { myLotStanding } }) => {
          expect(myLotStanding).toEqual([{ saleArtwork: { slug: "live" } }])
        }
      )
    })

    it("returns only lot standings for not-live sales", () => {
      return runQuery(query(false), context).then(
        ({ artwork: { myLotStanding } }) => {
          expect(myLotStanding).toEqual([{ saleArtwork: { slug: "past" } }])
        }
      )
    })
  })

  describe("Attribution class", () => {
    it(`returns proper attribution class name for unique artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            attributionClass {
              name
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            attributionClass: {
              name: "Unique",
            },
          },
        })
      })
    })

    it(`returns proper attribution class short_description for unique artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            attributionClass {
              shortDescription
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            attributionClass: {
              shortDescription: "Unique work",
            },
          },
        })
      })
    })

    it(`returns proper attribution class short_array_description for unique artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            attributionClass {
              shortArrayDescription
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            attributionClass: {
              shortArrayDescription: ["", "Unique work"],
            },
          },
        })
      })
    })

    it(`returns proper attribution class long_description for unique artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            attributionClass {
              longDescription,
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            attributionClass: {
              longDescription: "One-of-a-kind piece.",
            },
          },
        })
      })
    })
  })

  describe("Without a partner", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          partner {
            id
          }
          meta {
            description
          }
        }
      }
    `

    it("returns null appropriately and doesnt error", () => {
      artwork.partner = null
      artwork.title = "A Cat"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            partner: null,
            meta: {
              description: "A Cat, print, 2 x 3in.",
            },
          },
        })
      })
    })
  })

  describe("#domesticShippingFee", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          domesticShippingFee {
            major
            minor
            currencyCode
          }
        }
      }
    `

    it("returns domestic shipping fee as a Money type", () => {
      artwork.domestic_shipping_fee_cents = 10000
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            domesticShippingFee: {
              currencyCode: "USD",
              major: 100,
              minor: 10000,
            },
          },
        })
      })
    })

    it("supports 0", () => {
      artwork.domestic_shipping_fee_cents = 0
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            domesticShippingFee: {
              currencyCode: "USD",
              major: 0,
              minor: 0,
            },
          },
        })
      })
    })

    it("supports non-fractional currency", () => {
      artwork.domestic_shipping_fee_cents = 10000
      artwork.price_currency = "JPY"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            domesticShippingFee: {
              currencyCode: "JPY",
              major: 10000,
              minor: 10000,
            },
          },
        })
      })
    })

    it("returns null with no domestic_shipping_fee_cents", () => {
      artwork.domestic_shipping_fee_cents = null
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            domesticShippingFee: null,
          },
        })
      })
    })

    it("returns null with no price_currency", () => {
      artwork.domestic_shipping_fee_cents = 10000
      artwork.price_currency = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            domesticShippingFee: null,
          },
        })
      })
    })
  })

  describe("#internationalShippingFee", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          internationalShippingFee {
            major
            minor
            currencyCode
          }
        }
      }
    `

    it("returns international shipping fee as a Money type", () => {
      artwork.international_shipping_fee_cents = 10000
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            internationalShippingFee: {
              currencyCode: "USD",
              major: 100,
              minor: 10000,
            },
          },
        })
      })
    })

    it("supports 0", () => {
      artwork.international_shipping_fee_cents = 0
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            internationalShippingFee: {
              currencyCode: "USD",
              major: 0,
              minor: 0,
            },
          },
        })
      })
    })

    it("supports non-fractional currency", () => {
      artwork.international_shipping_fee_cents = 10000
      artwork.price_currency = "JPY"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            internationalShippingFee: {
              currencyCode: "JPY",
              major: 10000,
              minor: 10000,
            },
          },
        })
      })
    })

    it("returns null with no international_shipping_fee_cents", () => {
      artwork.international_shipping_fee_cents = null
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            internationalShippingFee: null,
          },
        })
      })
    })

    it("returns null with no price_currency", () => {
      artwork.international_shipping_fee_cents = 10000
      artwork.price_currency = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            internationalShippingFee: null,
          },
        })
      })
    })
  })

  describe("#shippingInfo", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          shippingInfo
        }
      }
    `

    // Domestic: null, International: null
    it("is set to quoted by seller when domestic shipping fee is null and arta value is null", () => {
      artwork.domestic_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = null
      artwork.process_with_artsy_shipping_domestic = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping, tax, and additional fees quoted by seller",
          },
        })
      })
    })

    it("is set to quoted by seller when domestic shipping fee is null and arta value is false", () => {
      artwork.domestic_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping, tax, and additional fees quoted by seller",
          },
        })
      })
    })

    // 1. Domestic: Arta, International:	Arta
    it("is set to calculated at checkout for both domesic and international arta shipping", () => {
      artwork.shipping_origin = ["Oslo", "NO"]
      artwork.eu_shipping_origin = true
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 5000
      artwork.international_shipping_fee_cents = 10000
      artwork.artsy_shipping_domestic = true
      artwork.process_with_artsy_shipping_domestic = true
      artwork.artsy_shipping_international = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Calculated in checkout \nInternational: Calculated in checkout",
          },
        })
      })
    })

    // 2. Domestic: Gallery Flat, International: Gallery Flat
    // EU location dollar price
    it("is set to proper display for usd artwork that is shipped from EU country", () => {
      artwork.shipping_origin = ["Oslo", "NO"]
      artwork.eu_shipping_origin = true
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 5000
      artwork.international_shipping_fee_cents = 10000
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: $50 within European Union \nInternational: $100",
          },
        })
      })
    })
    // EU location euro price
    it("is set to proper display for euro artwork that is shipped from EU country", () => {
      artwork.shipping_origin = ["Oslo", "NO"]
      artwork.eu_shipping_origin = true
      artwork.price_currency = "EUR"
      artwork.domestic_shipping_fee_cents = 300
      artwork.international_shipping_fee_cents = 7000
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: €3 within European Union \nInternational: €70",
          },
        })
      })
    })
    // US location dollar price
    it("is set to proper display for dollar artwork that is shipped from USA", () => {
      artwork.shipping_origin = ["Seattle", "WA", "US"]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 3000
      artwork.international_shipping_fee_cents = 21000
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: $30 within United States \nInternational: $210",
          },
        })
      })
    })
    // GB location pound price
    it("is set to proper display for pound artwork that is shipped from England", () => {
      artwork.shipping_origin = ["London", "GB"]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "GBP"
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 21000
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: £10 within United Kingdom [U.K.] \nInternational: £210",
          },
        })
      })
    })

    // 3. Domestic: Arta, International: null
    it("is set to proper display for arta domestic only shipped work", () => {
      artwork.shipping_origin = ["London", "GB"]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "GBP"
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = true
      artwork.process_with_artsy_shipping_domestic = true
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Calculated in checkout \nInternational: Contact gallery",
          },
        })
      })
    })

    // 4. Domestic: Free, International:	Free
    it("is set to proper display for artwork that ships for free", () => {
      artwork.shipping_origin = ["London", "GB"]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "GBP"
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = 0
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Free within United Kingdom [U.K.] \nInternational: Free",
          },
        })
      })
    })

    // 5. Domestic: Free, International:	Gallery Flat
    it("is set to proper display for artwork that ships free domestically and with international fee", () => {
      artwork.shipping_origin = ["Kharkiv", "UA"]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = 55555
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Domestic: Free within Ukraine \nInternational: $556",
          },
        })
      })
    })

    // Domestic: Gallery Flat, International: null
    it("is set to proper display for artwork that only has domestic shipping fee", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 6000
      artwork.international_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: $60 within United States \nInternational: Contact gallery",
          },
        })
      })
    })

    // Domestic: Gallery Flat, International: Arta
    it("is set to proper display for artwork with flat domestic shipping and arta international", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 6000
      artwork.international_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: $60 within United States \nInternational: Calculated in checkout",
          },
        })
      })
    })

    // Domestic: Free, International:	null
    it("is set to proper display for artwork with free domestic shipping and no international shipping", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Free within United States \nInternational: Contact gallery",
          },
        })
      })
    })

    // Domestic: Free, International:	Arta
    it("is set to proper display for artwork with free domestic shipping and arta international", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = null
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Free within United States \nInternational: Calculated in checkout",
          },
        })
      })
    })

    // Domestic: Arta, International:	Gallery Flat
    it("is set to proper display for artwork with arta domestic shipping and flat international", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 700
      artwork.international_shipping_fee_cents = 10000
      artwork.artsy_shipping_domestic = true
      artwork.process_with_artsy_shipping_domestic = true
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Calculated in checkout \nInternational: $100",
          },
        })
      })
    })

    // Domestic:Arta, International: Free
    it("is set to proper display for artwork with arta domestic shipping and free international", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 700
      artwork.international_shipping_fee_cents = 0
      artwork.artsy_shipping_domestic = true
      artwork.process_with_artsy_shipping_domestic = true
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: Calculated in checkout \nInternational: Free",
          },
        })
      })
    })

    // Domestic: Gallery Flat, International: Free
    it("is set to proper display for artwork with flat domestic shipping and free international", () => {
      artwork.shipping_origin = artwork.shipping_origin = [
        "New York",
        "NY",
        "US",
      ]
      artwork.eu_shipping_origin = false
      artwork.price_currency = "USD"
      artwork.domestic_shipping_fee_cents = 700
      artwork.international_shipping_fee_cents = 0
      artwork.artsy_shipping_domestic = false
      artwork.process_with_artsy_shipping_domestic = false
      artwork.artsy_shipping_international = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo:
              "Domestic: $7 within United States \nInternational: Free",
          },
        })
      })
    })
  })

  describe("#shipsToContinentalUSOnly", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          shipsToContinentalUSOnly
        }
      }
    `
    it("is true when domestic_shipping_fee_cents is present and international_shipping_fee_cents is null", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shipsToContinentalUSOnly: true,
          },
        })
      })
    })

    it("is false when work ships free internationally", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 0
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shipsToContinentalUSOnly: false,
          },
        })
      })
    })

    it("is false when work ships free worldwide", () => {
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = 0
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shipsToContinentalUSOnly: false,
          },
        })
      })
    })

    it("is false when work ships worldwide", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 1000
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shipsToContinentalUSOnly: false,
          },
        })
      })
    })
  })

  describe("#onlyShipsDomestically", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          onlyShipsDomestically
        }
      }
    `
    describe("when artsy domestic shipping enabled", () => {
      beforeEach(() => {
        artwork.process_with_artsy_shipping_domestic = true
      })

      describe("when domestic_shipping_fee_cents and international_shipping_fee is null", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = null
        })

        it("returns true", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: true,
              },
            })
          })
        })
      })

      describe("when domestic_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = 100
          artwork.international_shipping_fee_cents = null
        })

        it("returns true", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: true,
              },
            })
          })
        })
      })

      describe("when only international_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = 100
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: false,
              },
            })
          })
        })

        describe("when only artsy international shipping is present", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = null
            artwork.international_shipping_fee_cents = null
            artwork.artsy_shipping_international = true
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  onlyShipsDomestically: false,
                },
              })
            })
          })
        })

        describe("when free shipping worldwide", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = 0
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  onlyShipsDomestically: false,
                },
              })
            })
          })
        })
      })
    })

    describe("when artsy domestic shipping disabled", () => {
      beforeEach(() => {
        artwork.process_with_artsy_shipping_domestic = false
        artwork.artsy_shipping_international = false
      })

      describe("when domestic_shipping_fee_cents and international_shipping_fee is null", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = null
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: false,
              },
            })
          })
        })
      })

      describe("when domestic_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = 100
          artwork.international_shipping_fee_cents = null
        })

        it("returns true", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: true,
              },
            })
          })
        })
      })

      describe("when only international_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = 100
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                onlyShipsDomestically: false,
              },
            })
          })
        })

        describe("when only artsy international shipping is present", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = null
            artwork.international_shipping_fee_cents = null
            artwork.artsy_shipping_international = true
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  onlyShipsDomestically: false,
                },
              })
            })
          })
        })

        describe("when free shipping worldwide", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = 0
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  onlyShipsDomestically: false,
                },
              })
            })
          })
        })

        describe("when free domestic shipping", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = null
          })

          it("returns true", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  onlyShipsDomestically: true,
                },
              })
            })
          })
        })
      })
    })
  })

  describe("#isFixedShippingFeeOnly", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          isFixedShippingFeeOnly
        }
      }
    `
    describe("when artsy domestic shipping enabled", () => {
      beforeEach(() => {
        artwork.process_with_artsy_shipping_domestic = true
      })

      describe("when domestic_shipping_fee_cents and international_shipping_fee is null", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = null
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })
      })

      describe("when domestic_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = 100
          artwork.international_shipping_fee_cents = null
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })
      })

      describe("when only international_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = 100
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })

        describe("when only artsy international shipping is present", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = null
            artwork.international_shipping_fee_cents = null
            artwork.artsy_shipping_international = true
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  isFixedShippingFeeOnly: false,
                },
              })
            })
          })
        })

        describe("when both domesting and international fee set to free", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = 0
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  isFixedShippingFeeOnly: false,
                },
              })
            })
          })
        })
      })
    })

    describe("when artsy domestic shipping disabled", () => {
      beforeEach(() => {
        artwork.process_with_artsy_shipping_domestic = false
        artwork.artsy_shipping_international = false
      })

      describe("when domestic_shipping_fee_cents and international_shipping_fee is null", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = null
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })
      })

      describe("when domestic_shipping_fee_cents is present and international shipping is not arta", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = 100
          artwork.artsy_shipping_international = false
          artwork.international_shipping_fee_cents = null
        })

        it("returns true", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: true,
              },
            })
          })
        })
      })

      describe("when domestic_shipping_fee_cents is present but international shipping is set to arta", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = 100
          artwork.artsy_shipping_international = true
          artwork.international_shipping_fee_cents = null
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })
      })

      describe("when only international_shipping_fee_cents is present", () => {
        beforeEach(() => {
          artwork.domestic_shipping_fee_cents = null
          artwork.international_shipping_fee_cents = 100
        })

        it("returns false", () => {
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artwork: {
                isFixedShippingFeeOnly: false,
              },
            })
          })
        })

        describe("when only artsy international shipping is present", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = null
            artwork.international_shipping_fee_cents = null
            artwork.artsy_shipping_international = true
          })

          it("returns false", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  isFixedShippingFeeOnly: false,
                },
              })
            })
          })
        })

        describe("when free shipping worldwide", () => {
          beforeEach(() => {
            artwork.artsy_shipping_international = false
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = 0
          })

          it("returns true", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  isFixedShippingFeeOnly: true,
                },
              })
            })
          })
        })

        describe("when free domestic shipping and international not configured", () => {
          beforeEach(() => {
            artwork.domestic_shipping_fee_cents = 0
            artwork.international_shipping_fee_cents = null
          })

          it("returns true", () => {
            return runQuery(query, context).then((data) => {
              expect(data).toEqual({
                artwork: {
                  isFixedShippingFeeOnly: true,
                },
              })
            })
          })
        })
      })
    })
  })

  describe("#shippingOrigin", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          shippingOrigin
        }
      }
    `

    it("is null when shipping_origin is null", () => {
      artwork.shipping_origin = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingOrigin: null,
          },
        })
      })
    })

    it("is set to concatenated values from shipping_origin when shipping origin is present", () => {
      artwork.shipping_origin = ["Kharkov", "Ukraine"]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingOrigin: "Kharkov, Ukraine",
          },
        })
      })
    })
  })

  describe("#vatRequirementComplete", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          vatRequirementComplete
        }
      }
    `

    it("returns null when vat_required is not present", () => {
      delete artwork.vat_required
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: null } })
      })
    })

    it("returns null when partner is empty", () => {
      artwork.vat_required = false
      artwork.partner = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: null } })
      })
    })

    it("returns null when partnerAllLoader is not present", () => {
      artwork.vat_required = false
      artwork.partner = { id: "123" }
      delete context.partnerAllLoader
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: null } })
      })
    })

    it("returns true when artwork does not require vat", () => {
      artwork.vat_required = false
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() => Promise.resolve({}))

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: true } })
        expect(context.partnerAllLoader).not.toHaveBeenCalled()
      })
    })

    it("returns true when artwork requires VAT and partner has any VAT status", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: "anything" })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: true } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })

    it("returns false when artwork requires VAT and partner does not have a VAT status", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: null })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatRequirementComplete: false } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })
  })

  describe("#vatExemptApprovalRequired", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          vatExemptApprovalRequired
        }
      }
    `

    it("returns null when vat_required is not present", () => {
      delete artwork.vat_required
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: null } })
      })
    })

    it("returns null when partner is empty", () => {
      artwork.vat_required = false
      artwork.partner = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: null } })
      })
    })

    it("returns null when partnerAllLoader is not present", () => {
      artwork.vat_required = false
      artwork.partner = { id: "123" }
      delete context.partnerAllLoader
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: null } })
      })
    })

    it("returns false when artwork does not require vat", () => {
      artwork.vat_required = false
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() => Promise.resolve({}))

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: false } })
        expect(context.partnerAllLoader).not.toHaveBeenCalled()
      })
    })

    it("returns false when artwork requires VAT and partner has the VAT status 'registered'", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: "registered" })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: false } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })

    it("returns false when artwork requires VAT and partner does not have a VAT status", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: null })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: false } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })

    it("returns true when artwork requires VAT, partner has an exempt VAT status, and has not been approved by Artsy", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: "exempt", vat_exempt_approved: false })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: true } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })

    it("returns false when artwork requires VAT, partner has an exempt VAT status, and has been approved by Artsy", () => {
      artwork.vat_required = true
      artwork.partner = { id: "123" }
      context.partnerAllLoader = jest.fn(() =>
        Promise.resolve({ vat_status: "exempt", vat_exempt_approved: true })
      )

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { vatExemptApprovalRequired: false } })
        expect(context.partnerAllLoader).toHaveBeenCalledWith("123")
      })
    })
  })

  describe("#euShippingOrigin", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          euShippingOrigin
        }
      }
    `

    it("returns artworks eu_shipping_origin", () => {
      artwork.eu_shipping_origin = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { euShippingOrigin: true } })
      })
    })
  })

  describe("#shippingCountry", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          shippingCountry
        }
      }
    `

    it("is null when shipping_origin is null", () => {
      artwork.shipping_origin = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingCountry: null,
          },
        })
      })
    })

    it("is set to concatenated values from shipping_origin when shipping origin is present", () => {
      artwork.shipping_origin = ["New York", "NY", "US"]
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingCountry: "US",
          },
        })
      })
    })
  })

  describe("#framed", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          framed {
            label
            details
          }
        }
      }
    `
    it("is null when framed is null", () => {
      artwork.framed = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { framed: null } })
      })
    })
    it("is set to proper object when framed is true", () => {
      artwork.framed = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            framed: { label: "Framed", details: "Included" },
          },
        })
      })
    })
    it("is set to proper object when framed is false", () => {
      artwork.framed = false
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            framed: { label: "Framed", details: "Not included" },
          },
        })
      })
    })
  })

  describe("#savedSearch", () => {
    describe("suggestedArtworksConnection", () => {
      it("returns the correct connection", async () => {
        const artwork = {
          id: "portrait-of-cats",
          artists: [
            {
              id: "bitty",
            },
            { id: "percy" },
          ],
          attribution_class: "unique",
          category: "Painting",
        }
        const filterArtworksLoader = jest.fn().mockReturnValue(
          Promise.resolve({
            hits: [
              {
                id: "portrait-of-cats-playing-poker",
              },
            ],
            aggregations: {
              total: {
                value: 1,
              },
            },
          })
        )
        const context = {
          artworkLoader: () => Promise.resolve(artwork),
          unauthenticatedLoaders: {
            filterArtworksLoader,
          },
        }
        const query = `
          {
            artwork(id: "portrait-of-cats") {
              savedSearch {
                suggestedArtworksConnection(first: 1) {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          }
        `

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            savedSearch: {
              suggestedArtworksConnection: {
                edges: [
                  {
                    node: {
                      slug: "portrait-of-cats-playing-poker",
                    },
                  },
                ],
              },
            },
          },
        })

        expect(filterArtworksLoader).toHaveBeenCalledWith({
          artist_ids: ["bitty", "percy"],
          attribution_class: "unique",
          additional_gene_ids: ["painting"],
          exclude_ids: ["portrait-of-cats"],
          for_sale: true,
          size: 1,
          offset: 0,
          sort: "-published_at",
          aggregations: ["total"],
        })
      })

      describe("when artwork has 'Other' category", () => {
        it("does not include additional_gene_ids in the filterArtworksLoader call", async () => {
          const artwork = {
            id: "portrait-of-cats",
            artists: [
              {
                id: "bitty",
              },
              { id: "percy" },
            ],
            attribution_class: "unique",
            category: "Other",
          }
          const filterArtworksLoader = jest.fn().mockReturnValue(
            Promise.resolve({
              hits: [
                {
                  id: "portrait-of-cats-playing-poker",
                },
              ],
              aggregations: {
                total: {
                  value: 1,
                },
              },
            })
          )
          const context = {
            artworkLoader: () => Promise.resolve(artwork),
            unauthenticatedLoaders: {
              filterArtworksLoader,
            },
          }
          const query = `
            {
              artwork(id: "portrait-of-cats") {
                savedSearch {
                  suggestedArtworksConnection(first: 1) {
                    edges {
                      node {
                        slug
                      }
                    }
                  }
                }
              }
            }
          `

          const data = await runQuery(query, context)

          expect(data).toEqual({
            artwork: {
              savedSearch: {
                suggestedArtworksConnection: {
                  edges: [
                    {
                      node: {
                        slug: "portrait-of-cats-playing-poker",
                      },
                    },
                  ],
                },
              },
            },
          })

          expect(filterArtworksLoader).toHaveBeenCalledWith({
            artist_ids: ["bitty", "percy"],
            attribution_class: "unique",
            exclude_ids: ["portrait-of-cats"],
            for_sale: true,
            size: 1,
            offset: 0,
            sort: "-published_at",
            aggregations: ["total"],
          })
        })
      })
    })
  })

  describe("#signatureInfo", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          signatureInfo {
            label
            details
          }
        }
      }
    `
    it("is null when all related fields are null", () => {
      artwork.signature = null
      artwork.signed_by_artist = null
      artwork.stamped_by_artist_estate = null
      artwork.sticker_label = null
      artwork.signed_other = null
      artwork.signed_in_plate = null
      artwork.not_signed = null

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { signatureInfo: null } })
      })
    })
    it("is null when all related fields are false", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
      artwork.signed_in_plate = false
      artwork.stamped_by_artist_estate = false
      artwork.sticker_label = false
      artwork.signed_other = false
      artwork.not_signed = false
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { signatureInfo: null } })
      })
    })
    it("is set to proper object when signed_other is true", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
      artwork.signed_in_plate = false
      artwork.stamped_by_artist_estate = false
      artwork.sticker_label = false
      artwork.signed_other = true
      artwork.not_signed = false
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: { signatureInfo: { label: "Signature", details: "" } },
        })
      })
    })
    it("is set to proper object when not_signed is true", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
      artwork.stamped_by_artist_estate = false
      artwork.sticker_label = false
      artwork.signed_other = false
      artwork.not_signed = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureInfo: { label: "Signature", details: "Not signed" },
          },
        })
      })
    })
    it("is set to proper object when several fields are true", () => {
      artwork.signature = "some details about signature"
      artwork.signed_by_artist = true
      artwork.signed_in_plate = true
      artwork.stamped_by_artist_estate = true
      artwork.sticker_label = true
      artwork.signed_other = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureInfo: {
              label: "Signature",
              details:
                "Hand-signed by artist, signed in plate, stamped by artist's estate, sticker label, some details about signature",
            },
          },
        })
      })
    })
    it("is set to proper object when only signed_other is true", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
      artwork.signed_in_plate = false
      artwork.stamped_by_artist_estate = false
      artwork.sticker_label = false
      artwork.signed_other = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureInfo: {
              label: "Signature",
              details: "",
            },
          },
        })
      })
    })
  })

  describe("#signatureMeta", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          signatureMeta {
            hasSignature
            hasStickerLabel
            isSignedByArtist
            isSignedOther
            isStampedByArtistEstate
            isSignedInPlate
          }
        }
      }
    `

    it("returns all false when no signature fields are set", () => {
      artwork.sticker_label = null
      artwork.signed_by_artist = null
      artwork.signed_other = null
      artwork.stamped_by_artist_estate = null
      artwork.signed_in_plate = null

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: false,
              hasStickerLabel: false,
              isSignedByArtist: false,
              isSignedOther: false,
              isStampedByArtistEstate: false,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns all false when all signature fields are explicitly false", () => {
      artwork.sticker_label = false
      artwork.signed_by_artist = false
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = false
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: false,
              hasStickerLabel: false,
              isSignedByArtist: false,
              isSignedOther: false,
              isStampedByArtistEstate: false,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns hasSignature true when sticker_label is true", () => {
      artwork.sticker_label = true
      artwork.signed_by_artist = false
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = false
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: true,
              isSignedByArtist: false,
              isSignedOther: false,
              isStampedByArtistEstate: false,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns hasSignature true when signed_by_artist is true", () => {
      artwork.sticker_label = false
      artwork.signed_by_artist = true
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = false
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: false,
              isSignedByArtist: true,
              isSignedOther: false,
              isStampedByArtistEstate: false,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns hasSignature true when signed_other is true", () => {
      artwork.sticker_label = false
      artwork.signed_by_artist = false
      artwork.signed_other = true
      artwork.stamped_by_artist_estate = false
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: false,
              isSignedByArtist: false,
              isSignedOther: true,
              isStampedByArtistEstate: false,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns hasSignature true when stamped_by_artist_estate is true", () => {
      artwork.sticker_label = false
      artwork.signed_by_artist = false
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = true
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: false,
              isSignedByArtist: false,
              isSignedOther: false,
              isStampedByArtistEstate: true,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns hasSignature true when signed_in_plate is true", () => {
      artwork.sticker_label = false
      artwork.signed_by_artist = false
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = false
      artwork.signed_in_plate = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: false,
              isSignedByArtist: false,
              isSignedOther: false,
              isStampedByArtistEstate: false,
              isSignedInPlate: true,
            },
          },
        })
      })
    })

    it("returns correct values when multiple signature fields are true", () => {
      artwork.sticker_label = true
      artwork.signed_by_artist = true
      artwork.signed_other = false
      artwork.stamped_by_artist_estate = true
      artwork.signed_in_plate = false

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: true,
              isSignedByArtist: true,
              isSignedOther: false,
              isStampedByArtistEstate: true,
              isSignedInPlate: false,
            },
          },
        })
      })
    })

    it("returns correct values when all signature fields are true", () => {
      artwork.sticker_label = true
      artwork.signed_by_artist = true
      artwork.signed_other = true
      artwork.stamped_by_artist_estate = true
      artwork.signed_in_plate = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureMeta: {
              hasSignature: true,
              hasStickerLabel: true,
              isSignedByArtist: true,
              isSignedOther: true,
              isStampedByArtistEstate: true,
              isSignedInPlate: true,
            },
          },
        })
      })
    })
  })

  describe("#conditionDescription", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          conditionDescription {
            label
            details
          }
        }
      }
    `
    it("is null when condition_description is null", () => {
      artwork.condition_description = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { conditionDescription: null } })
      })
    })
    it("is null when condition_description is blank", () => {
      artwork.condition_description = ""
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { conditionDescription: null } })
      })
    })
    it("is set to proper object when condition_description is present", () => {
      artwork.condition_description = "very detailed description of condition"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            conditionDescription: {
              label: "Condition details",
              details: "Very detailed description of condition",
            },
          },
        })
      })
    })
  })

  describe("#certificateOfAuthenticity", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          hasCertificateOfAuthenticity
          certificateOfAuthenticity {
            label
            details
          }
        }
      }
    `

    it("is null when certificate_of_authenticity is null", () => {
      artwork.certificate_of_authenticity = null
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toBe(null)
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(false)
      })
    })

    it("is set to proper object when certificate_of_authenticity is true", () => {
      artwork.certificate_of_authenticity = true
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toEqual({
          label: "Certificate of authenticity",
          details: "Included",
        })
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(true)
      })
    })

    it("is set to proper object when certificate_of_authenticity and coa_from_authenticating_body are true", () => {
      artwork.certificate_of_authenticity = true
      artwork.coa_by_authenticating_body = true
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toEqual({
          label: "Certificate of authenticity",
          details: "Included (issued by authorized authenticating body)",
        })
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(true)
      })
    })

    it("is set to proper object when certificate_of_authenticity and coa_from_gallery are true", () => {
      artwork.certificate_of_authenticity = true
      artwork.coa_by_gallery = true
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toEqual({
          label: "Certificate of authenticity",
          details: "Included (issued by gallery)",
        })
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(true)
      })
    })

    it("is set to proper object when certificate_of_authenticity, coa_from_authenticating_body, and coa_from_gallery are true", () => {
      artwork.certificate_of_authenticity = true
      artwork.coa_by_gallery = true
      artwork.coa_by_authenticating_body = true
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toEqual({
          label: "Certificate of authenticity",
          details:
            "Included (one issued by gallery; one issued by authorized authenticating body)",
        })
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(true)
      })
    })

    it("is null when certificate_of_authenticity is false", () => {
      artwork.certificate_of_authenticity = false
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toBe(null)
        expect(data.artwork.hasCertificateOfAuthenticity).toBe(false)
      })
    })
  })

  describe("#realizedPrice", () => {
    it("returns null if no realized price", async () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            realizedPrice
          }
        }
      `

      const data = await runQuery(query, context)
      expect(data.artwork.realizedPrice).toBe(null)
    })

    it("returns realized price for select artists", async () => {
      getMicrofunnelDataByArtworkInternalID.mockImplementation(() => ({
        "Artwork ids (recently sold) (comma separated)":
          "5d126f9bba46ba0012c3134f",
        "Realized Price (in dollars)": "$8,500",
      }))
      const query = `
        {
          artwork(id: "alex-katz-luna-park-2-maravell-67-schroder-68") {
            realizedPrice
          }
        }
      `
      const context = {
        artworkLoader: () => {
          return Promise.resolve({
            _id: "5d9ca6fe8f1aee0011475cf7",
            id: "alex-katz-luna-park-2-maravell-67-schroder-68",
          })
        },
      }
      const data = await runQuery(query, context)
      expect(data.artwork.realizedPrice).toBe("$8,500")
    })
  })

  describe("#realizedToEstimate", () => {
    it("returns null if there is no realizedToEstimate value", async () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            realizedToEstimate
          }
        }
      `

      const data = await runQuery(query, context)
      expect(data.artwork.realizedToEstimate).toBe(null)
    })

    it("returns realizedToEstimate", async () => {
      getMicrofunnelDataByArtworkInternalID.mockImplementation(() => ({
        "Artwork ids (recently sold) (comma separated)":
          "5d126f9bba46ba0012c3134f",
        "Artwork realized / estimate multiplier": "2.2",
      }))
      const query = `
        {
          artwork(id: "alex-katz-luna-park-2-maravell-67-schroder-68") {
            realizedToEstimate
          }
        }
      `
      const context = {
        artworkLoader: () => {
          return Promise.resolve({
            _id: "5d9ca6fe8f1aee0011475cf7",
            id: "alex-katz-luna-park-2-maravell-67-schroder-68",
          })
        },
      }
      const data = await runQuery(query, context)
      expect(data.artwork.realizedToEstimate).toBe("2.2")
    })
  })

  describe("mediumType", () => {
    it(`returns proper medium type for artwork`, () => {
      context.geneLoader = () =>
        Promise.resolve({ name: "Painting", id: "painting" })
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            mediumType {
              name
              longDescription
              filterGene {
                slug
                name
              }
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            mediumType: {
              name: "Painting",
              longDescription:
                "Includes gouache; fresco; ink and wash; oil painting; screen painting; scroll painting; tempera; watercolor.",
              filterGene: {
                slug: "painting",
                name: "Painting",
              },
            },
          },
        })
      })
    })
  })

  describe("submissionID", () => {
    it(`returns null since submissions are deprecated`, () => {
      artwork.submission_id = "submission-id"

      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            submissionId
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            submissionId: null,
          },
        })
      })
    })
  })

  describe("hasMarketPriceInsights", () => {
    it("returns true when an artwork has market price insights", () => {
      const query = `
        {
          artwork(id: "foo-bar") {
            hasMarketPriceInsights
          }
        }
      `

      const marketPriceInsightsBatchLoader = jest.fn(async () => [
        {
          demandRank: 20,
        },
      ])

      context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            hasMarketPriceInsights: true,
          },
        })
      })
    })
  })

  it("returns false when an artwork has no market price insights", () => {
    const query = `
        {
          artwork(id: "foo-bar") {
            hasMarketPriceInsights
          }
        }
      `

    const marketPriceInsightsBatchLoader = jest.fn(async () => [])

    context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artwork: {
          hasMarketPriceInsights: false,
        },
      })
    })
  })

  it("queries for marketPriceInsights when they are requested", () => {
    const query = `
        {
          artwork(id: "foo-bar") {
            title
            marketPriceInsights   {
              liquidityRankDisplayText
              medianSaleOverEstimatePercentage
              sellThroughRate
            }
          }
        }
      `

    const marketPriceInsightsBatchLoader = jest.fn(async () => artworkInsights)

    context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

    return runQuery(query, context).then((data) => {
      expect(marketPriceInsightsBatchLoader).toHaveBeenCalled()

      expect(data).toEqual({
        artwork: {
          title: "Untitled (Portrait)",
          marketPriceInsights: {
            liquidityRankDisplayText: "Very High",
            sellThroughRate: 0.902,
            medianSaleOverEstimatePercentage: 123,
          },
        },
      })
    })
  })

  it("does not query for marketPriceInsights when they're not requested", () => {
    const query = `
        {
          artwork(id: "foo-bar") {
            title
          }
        }
      `

    const marketPriceInsightsBatchLoader = jest.fn(async () => artworkInsights)

    context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

    return runQuery(query, context).then((data) => {
      expect(marketPriceInsightsBatchLoader).not.toHaveBeenCalled()
      expect(data).toEqual({
        artwork: {
          title: "Untitled (Portrait)",
        },
      })
    })
  })

  describe("isHighDemand", () => {
    it("returns true when an artwork is in high demand", () => {
      const query = `
        {
          artwork(id: "foo-bar") {
            marketPriceInsights {
              isHighDemand
            }
          }
        }
      `

      const marketPriceInsightsBatchLoader = jest.fn(async () => [
        artworkInHighDemand,
      ])

      context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            marketPriceInsights: {
              isHighDemand: true,
            },
          },
        })
      })
    })
    it("returns false when an artwork is not in high demand", () => {
      const query = `
        {
          artwork(id: "foo-bar") {
            marketPriceInsights {
              isHighDemand
            }
          }
        }
      `

      const marketPriceInsightsBatchLoader = jest.fn(async () => [
        artworkInLowDemand,
      ])

      context.marketPriceInsightsBatchLoader = marketPriceInsightsBatchLoader

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            marketPriceInsights: {
              isHighDemand: false,
            },
          },
        })
      })
    })

    describe("isEligibleForArtsyGuarantee/isEligbleForOnPlatformTransaction", () => {
      const query = `
        {
          artwork(id: "foo-bar") {
            isEligibleForArtsyGuarantee
            isEligibleForOnPlatformTransaction
          }
        }
      `

      it("returns false by default", () => {
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              isEligibleForArtsyGuarantee: false,
              isEligibleForOnPlatformTransaction: false,
            },
          })
        })
      })

      it("returns true if work is acquirable", () => {
        artwork.acquireable = true
        artwork.offerable = false
        artwork.offerable_from_inquiry = false

        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              isEligibleForArtsyGuarantee: true,
              isEligibleForOnPlatformTransaction: true,
            },
          })
        })
      })

      it("returns true if work is offerable", () => {
        artwork.acquireable = false
        artwork.offerable = true
        artwork.offerable_from_inquiry = false

        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              isEligibleForArtsyGuarantee: true,
              isEligibleForOnPlatformTransaction: true,
            },
          })
        })
      })

      it("returns true if work is offerable from inquiry", () => {
        artwork.acquireable = false
        artwork.offerable = false
        artwork.offerable_from_inquiry = true

        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              isEligibleForArtsyGuarantee: true,
              isEligibleForOnPlatformTransaction: true,
            },
          })
        })
      })
    })
  })

  describe("taxInfo", () => {
    const query = `
      {
        artwork(id: "foo-bar") {
          taxInfo {
            displayText
            moreInfo {
              displayText
              url
            }
          }
        }
      }
    `

    describe("when artwork is eligible for on-platform transaction", () => {
      it("should return correct tax info when acquireable = true", async () => {
        artwork.acquireable = true

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            taxInfo: {
              displayText: "Taxes may apply at checkout.",
              moreInfo: {
                displayText: "Learn more.",
                url: CHECKOUT_TAXES_DOC_URL,
              },
            },
          },
        })
      })

      it("should return correct tax info when offerable = true", async () => {
        artwork.offerable = true

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            taxInfo: {
              displayText: "Taxes may apply at checkout.",
              moreInfo: {
                displayText: "Learn more.",
                url: CHECKOUT_TAXES_DOC_URL,
              },
            },
          },
        })
      })

      it("should return correct tax info when offerable_from_inquiry = true", async () => {
        artwork.offerable_from_inquiry = true

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            taxInfo: {
              displayText: "Taxes may apply at checkout.",
              moreInfo: {
                displayText: "Learn more.",
                url: CHECKOUT_TAXES_DOC_URL,
              },
            },
          },
        })
      })
    })

    describe("when artwork is NOT eligible for on-platform transaction", () => {
      it("should return null", async () => {
        artwork.acquireable = false
        artwork.offerable = false
        artwork.offerable_from_inquiry = false

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            taxInfo: null,
          },
        })
      })
    })
  })

  describe("isForSale", () => {
    const query = `
      {
        artwork(id: "foo-bar") {
          isForSale
        }
      }
    `

    //
    // FIXME: We've seen cases on the backend, especially when edition sets are
    // involved, where the availability of the partent artwork is not aligned
    // with overall availability of its edition sets and the `sold` attribute.
    // When all of an artwork's edition sets have sold, the parent artwork
    // _should_ transition to a "not for sale" availability. While we look into
    // why that isn't reliably happening, this patch ensures that we return
    // false if the artwork is considered sold.
    //
    it("should return false if the artwork is marked as sold", async () => {
      artwork.forsale = true
      artwork.sold = true

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isForSale: false,
        },
      })
    })
  })

  describe("isPriceEstimateRequestable", () => {
    beforeEach(() => {
      artwork.artist.target_supply_priority = 1
      artwork.category = "Painting"
    })

    const query = `
      {
        artwork(id: "foo-bar") {
          isPriceEstimateRequestable
        }
      }
    `

    it("returns false since submissions are deprecated", async () => {
      artwork.artist.target_supply_priority = 1

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isPriceEstimateRequestable: false,
        },
      })
    })

    it("returns false if the artwork category is Posters", async () => {
      artwork.category = "Posters"

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isPriceEstimateRequestable: false,
        },
      })
    })

    it("returns false if the artist is Salvador Dali", async () => {
      artwork.artist.id = "salvador-dali"

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isPriceEstimateRequestable: false,
        },
      })
    })

    it("returns false if the artwork has a submission", async () => {
      artwork.submission_id = "submission_id"

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isPriceEstimateRequestable: false,
        },
      })
    })

    it("returns false if the artist is not P1 artist", async () => {
      artwork.artist.target_supply_priority = 2

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isPriceEstimateRequestable: false,
        },
      })
    })
  })

  describe("isEligibleToCreateAlert", () => {
    beforeEach(() => {
      artwork.artists = [{ id: "foo" }]
      artwork.category = "Painting"
    })

    const query = `
      {
        artwork(id: "foo-bar") {
          isEligibleToCreateAlert
        }
      }
    `

    it("returns true if criteria are met", async () => {
      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isEligibleToCreateAlert: true,
        },
      })
    })

    it("returns false if any criteria are not met", async () => {
      artwork.category = null

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isEligibleToCreateAlert: false,
        },
      })
    })
  })

  describe("#recentSavesCount", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          recentSavesCount
        }
      }
    `

    it("returns artworks recent_saves_count", () => {
      artwork.recent_saves_count = 123
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { recentSavesCount: 123 } })
      })
    })
  })

  describe("#lastSavedAt", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          lastSavedAt
        }
      }
    `

    it("returns artworks last_saved_at", () => {
      artwork.last_saved_at = "2020-01-01T00:00:00.000Z"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: { lastSavedAt: "2020-01-01T00:00:00.000Z" },
        })
      })
    })
  })

  describe("#recentAbandonedOrdersCount", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          recentAbandonedOrdersCount
        }
      }
    `

    it("returns artworks recent_abandoned_orders_count", () => {
      artwork.recent_abandoned_orders_count = 123
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { recentAbandonedOrdersCount: 123 } })
      })
    })
  })

  describe("#lastOfferableActivityAt", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          lastOfferableActivityAt
        }
      }
    `

    it("returns artworks last_offerable_activity_at", () => {
      artwork.last_offerable_activity_at = "2020-01-01T00:00:00.000Z"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: { lastOfferableActivityAt: "2020-01-01T00:00:00.000Z" },
        })
      })
    })
  })

  describe("#offerableActivityCount", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          offerableActivity {
            totalCount
          }
        }
      }
    `

    it("returns count of collectors with eligible offerable activities", () => {
      const partnerArtworkOfferableActivityLoader = jest.fn(() =>
        Promise.resolve({ headers: { "x-total-count": 3 } })
      )
      context.partnerArtworkOfferableActivityLoader = partnerArtworkOfferableActivityLoader
      artwork.partner = { id: "123" }

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            offerableActivity: {
              totalCount: 3,
            },
          },
        })
      })
    })
  })

  describe("#listedArtworksConnection", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          listedArtworksConnection(first: 3) {
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `

    it("returns empty connection since submissions are deprecated", async () => {
      const artworks = [{ id: "foo-bar" }, { id: "bar-foo" }]
      const context = {
        artworkLoader: () =>
          Promise.resolve({
            id: "richard-prince-untitled-portrait",
            listed_artwork_ids: ["foo-bar", "bar-foo"],
          }),
        artworksLoader: () => Promise.resolve(artworks),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          listedArtworksConnection: {
            edges: [],
          },
        },
      })
    })
  })

  describe("#isListed", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          isListed
        }
      }
    `

    it("returns false since submissions are deprecated", async () => {
      const context = {
        artworkLoader: () =>
          Promise.resolve({
            listed_artwork_ids: ["foo-bar", "bar-foo"],
          }),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isListed: false,
        },
      })
    })

    it("false if listed_artworks_ids is empty", async () => {
      const context = {
        artworkLoader: () =>
          Promise.resolve({
            listed_artwork_ids: [],
          }),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isListed: false,
        },
      })
    })

    it("false if listed_artworks_ids is null", async () => {
      const context = {
        artworkLoader: () =>
          Promise.resolve({
            listed_artwork_ids: null,
          }),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          isListed: false,
        },
      })
    })
  })

  describe("#priceListed", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          priceListed{
            major
            minor
            currencyCode
          }
        }
      }
    `

    it("returns artwork price_listed", () => {
      artwork.price_listed = 123
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            priceListed: { major: 123, minor: 12300, currencyCode: "USD" },
          },
        })
      })
    })

    it("converts price_listed to the expected minor value", () => {
      artwork.price_listed = 123
      artwork.price_currency = "KRW"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            priceListed: { major: 123, minor: 123, currencyCode: "KRW" },
          },
        })
      })
    })
  })

  describe("loading collectorSignals", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          collectorSignals {
            runningShow {
              name
              startAt
              endAt
            }
            increasedInterest
            curatorsPick
            auction {
              bidCount
              lotWatcherCount
              registrationEndsAt
              lotClosesAt
              liveBiddingStarted
              liveStartAt
              onlineBiddingExtended
            }
            partnerOffer {
              endAt
            }
            primaryLabel
          }
        }
      }
    `
    let supportingLoaders = {}

    beforeEach(() => {
      supportingLoaders = {
        mePartnerOffersLoader: jest.fn(),
        salesLoader: jest.fn(),
        saleArtworkLoader: jest.fn(),
        marketingCollectionLoader: jest.fn(),
        showsLoader: jest.fn(),
      }
      context = {
        userID: "testUser",
        artworkLoader: jest.fn(),
        ...supportingLoaders,
      }
      context.artworkLoader.mockResolvedValue(artwork)
      context.mePartnerOffersLoader.mockResolvedValue({ body: [] })
      context.salesLoader.mockResolvedValue([])
      context.marketingCollectionLoader.mockResolvedValue({ artwork_ids: [] })
      context.showsLoader.mockResolvedValue([])
    })

    describe("purchasable artwork", () => {
      beforeEach(() => {
        artwork.purchasable = true
        artwork.sale_ids = []
      })
      it("returns the increasedInterest signal", async () => {
        artwork.increased_interest_signal = true

        let data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.increasedInterest).toEqual(true)

        artwork.increased_interest_signal = false

        data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.increasedInterest).toEqual(false)
      })
      it("fetches & returns the user-specific collector signals for a purchasable artwork if requested by a logged-in user", async () => {
        context.userID = "user-id"
        context.mePartnerOffersLoader.mockResolvedValue({
          body: [{ endAt: "2023-01-01T00:00:00Z", active: true }],
        })

        const data = await runQuery(query, context)

        expect(context.mePartnerOffersLoader).toHaveBeenCalledWith({
          artwork_id: "richard-prince-untitled-portrait",
          size: 1,
          sort: "-created_at",
        })

        expect(data.artwork.collectorSignals.partnerOffer).toEqual({
          endAt: "2023-01-01T00:00:00Z",
        })
      })

      it("only returns active partner offer signal", async () => {
        artwork.purchasable = true
        artwork.sale_ids = []

        context.userID = "user-id"
        context.mePartnerOffersLoader.mockResolvedValue({
          body: [{ endAt: "2023-01-01T00:00:00Z", active: false }],
        })

        const data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.partnerOffer).toBeNull()
      })

      it("does not query partner offer signal loaders if the user is not logged in", async () => {
        context.mePartnerOffersLoader = null

        const data = await runQuery(query, context)

        expect(data).toEqual({
          artwork: {
            collectorSignals: expect.objectContaining({
              partnerOffer: null,
            }),
          },
        })
      })

      describe("primaryLabel signal", () => {
        const query = `
          {
            artwork(id: "richard-prince-untitled-portrait") {
              collectorSignals {
                primaryLabel
              }
            }
          }
        `
        it("does not include 'PARTNER_OFFER'", async () => {
          context.mePartnerOffersLoader.mockResolvedValue({
            body: [{ endAt: "2023-01-01", active: true }],
          })

          const data = await runQuery(query, context)
          expect(data.artwork.collectorSignals.primaryLabel).toBeNull()
        })

        it("CURATORS_PICK takes precedence over INCREASED_INTEREST", async () => {
          context.mePartnerOffersLoader.mockResolvedValue({
            body: [],
          })
          context.marketingCollectionLoader.mockResolvedValue({
            artwork_ids: [artwork._id],
          })
          artwork.increased_interest_signal = true

          const data = await runQuery(query, context)
          expect(data.artwork.collectorSignals.primaryLabel).toEqual(
            "CURATORS_PICK"
          )
        })

        it("shows 'INCREASED_INTEREST' if artwork.increased_interest_signal is present and no other labels are available", async () => {
          context.mePartnerOffersLoader.mockResolvedValue({
            body: [],
          })
          context.marketingCollectionLoader.mockResolvedValue({
            artwork_ids: ["not-this-artwork"],
          })
          artwork.increased_interest_signal = true
          const data = await runQuery(query, context)
          expect(data.artwork.collectorSignals.primaryLabel).toEqual(
            "INCREASED_INTEREST"
          )
        })

        it("primaryLabel choices can be suppressed through `ignorePrimaryLabels` arg", async () => {
          context.mePartnerOffersLoader.mockResolvedValue({
            body: [{ endAt: "2023-01-01", active: true }],
          })
          context.marketingCollectionLoader.mockResolvedValue({
            artwork_ids: [artwork._id],
          })
          artwork.increased_interest_signal = true

          const data = await runQuery(query, context)
          expect(data.artwork.collectorSignals.primaryLabel).toEqual(
            "CURATORS_PICK"
          )

          const queryWithoutPartnerOffer = `
            {
              artwork(id: "richard-prince-untitled-portrait") {
                collectorSignals {
                  primaryLabel(ignore: [CURATORS_PICK])
                }
              }
            }
          `
          const dataWithoutPartnerOffer = await runQuery(
            queryWithoutPartnerOffer,
            context
          )

          expect(
            dataWithoutPartnerOffer.artwork.collectorSignals.primaryLabel
          ).toEqual("INCREASED_INTEREST")

          const queryWithoutPartnerOfferAndCuratorsPick = `
            {
              artwork(id: "richard-prince-untitled-portrait") {
                collectorSignals {
                  primaryLabel(ignore: [CURATORS_PICK, INCREASED_INTEREST])
                }
              }
            }
          `
          const dataWithoutPartnerOfferAndCuratorsPick = await runQuery(
            queryWithoutPartnerOfferAndCuratorsPick,
            context
          )
          expect(
            dataWithoutPartnerOfferAndCuratorsPick.artwork.collectorSignals
              .primaryLabel
          ).toBeNull()
        })

        it("does not allow illegal values for `ignorePrimaryLabels` arg", async () => {
          const queryWithTooManyLabels = `
          {
            artwork(id: "richard-prince-untitled-portrait") {
              collectorSignals {
                primaryLabel(ignore: [PARTNER_OFFER, CURATORS_PICK, INCREASED_INTEREST, PARTNER_OFFER])
              }
            }
          }
        `
          await expect(
            runQuery(queryWithTooManyLabels, context)
          ).rejects.toThrow(
            new Error(
              `Ignore list length limited to number of available signals - max 3`
            )
          )
        })

        it("returns null if there is no increased interest, or curators pick collection", async () => {
          artwork.increased_interest_signal = false
          const data = await runQuery(query, context)
          expect(data.artwork.collectorSignals.primaryLabel).toBeNull()
        })
      })
    })

    describe("auction artwork", () => {
      beforeEach(() => {
        artwork.purchasable = false
        artwork.sale_ids = ["sale-id-not-auction", "sale-id-auction"]
        artwork.inquireable = true
      })

      const futureTime = moment().add(1, "day").toISOString()
      const pastTime = moment().subtract(1, "day").toISOString()

      it("returns null for primaryLabel even if a signal is available", async () => {
        artwork.increased_interest_signal = true
        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.primaryLabel).toBeNull()
      })

      it("returns false for increasedInterest", async () => {
        artwork.increased_interest_signal = true

        const data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.increasedInterest).toEqual(false)
      })
      it("returns the nested registration end time if present, whether future or past", async () => {
        context.salesLoader.mockResolvedValue([
          { id: "sale-id-auction", registration_ends_at: futureTime },
        ])

        context.saleArtworkLoader.mockResolvedValue({})

        let data = await runQuery(query, context)

        expect(
          data.artwork.collectorSignals.auction.registrationEndsAt
        ).toEqual(futureTime)

        context.salesLoader.mockResolvedValue([
          { id: "sale-id-auction", registration_ends_at: pastTime },
        ])
        context.saleArtworkLoader.mockResolvedValue({})

        data = await runQuery(query, context)

        expect(
          data.artwork.collectorSignals.auction.registrationEndsAt
        ).toEqual(pastTime)
      })

      it("returns correct nested values for a lot with an end time and no extended bidding", async () => {
        context.salesLoader.mockResolvedValue([{ id: "sale-id-auction" }])

        context.saleArtworkLoader.mockResolvedValue({
          end_at: futureTime,
          extended_bidding_end_at: null,
        })

        const data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.auction.lotClosesAt).toEqual(
          futureTime
        )
        expect(
          data.artwork.collectorSignals.auction.onlineBiddingExtended
        ).toEqual(false)
      })

      it("returns correct nested values for a lot with an end time and extended bidding", async () => {
        context.salesLoader.mockResolvedValue([{ id: "sale-id-auction" }])

        context.saleArtworkLoader.mockResolvedValue({
          end_at: pastTime,
          extended_bidding_end_at: futureTime,
        })

        const data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.auction.lotClosesAt).toEqual(
          futureTime
        )
        expect(
          data.artwork.collectorSignals.auction.onlineBiddingExtended
        ).toEqual(true)
      })
      it("returns correct nested values for a lot with a future live start time", async () => {
        context.salesLoader.mockResolvedValue([
          { id: "sale-id-auction", live_start_at: futureTime },
        ])

        // live start at not set on sale artwork
        context.saleArtworkLoader.mockResolvedValue({})
        const data = await runQuery(query, context)

        expect(
          data.artwork.collectorSignals.auction.liveBiddingStarted
        ).toEqual(false)
        expect(data.artwork.collectorSignals.auction.lotClosesAt).toEqual(null)
        expect(data.artwork.collectorSignals.auction.liveStartAt).toEqual(
          futureTime
        )
      })
      it("returns correct nested values for an auction that has started live bidding", async () => {
        context.salesLoader.mockResolvedValue([
          {
            id: "sale-id-auction",
            live_start_at: pastTime,
            live_integration_started: true,
          },
        ])

        // live start at not set on sale artwork
        context.saleArtworkLoader.mockResolvedValue({})
        const data = await runQuery(query, context)

        expect(
          data.artwork.collectorSignals.auction.liveBiddingStarted
        ).toEqual(true)

        expect(data.artwork.collectorSignals.auction.liveStartAt).toEqual(
          pastTime
        )
      })

      it("fetches & returns the nested lot watcher and bid count signals for an auction lot artwork if requested", async () => {
        artwork.recent_saves_count = 123
        context.salesLoader.mockResolvedValue([
          {
            id: "sale-id-auction",
            _id: "sale-database-id",
          },
        ])

        context.saleArtworkLoader.mockResolvedValue({
          bidder_positions_count: 5,
        })

        const data = await runQuery(query, context)

        expect(context.salesLoader).toHaveBeenCalledWith({
          id: ["sale-id-not-auction", "sale-id-auction"],
          is_auction: true,
          live: true,
        })

        expect(context.saleArtworkLoader).toHaveBeenCalledWith({
          artworkId: "richard-prince-untitled-portrait-database-id",
          saleId: "sale-database-id",
        })

        expect(data.artwork.collectorSignals.auction.bidCount).toEqual(5)
        expect(data.artwork.collectorSignals.auction.lotWatcherCount).toEqual(
          123
        )
      })

      it("does not query auction signal loaders if the artwork has no sale_ids", async () => {
        artwork.sale_ids = []
        artwork.purchasable = true

        const data = await runQuery(query, context)

        expect(context.salesLoader).not.toHaveBeenCalled()
        expect(context.saleArtworkLoader).not.toHaveBeenCalled()

        expect(data.artwork.collectorSignals.auction).toBeNull()
      })

      it("may return auction data after end time if the sale closes late", async () => {
        artwork.purchasable = true
        context.salesLoader.mockResolvedValue([
          { id: "sale-id-auction", end_at: pastTime, ended_at: null },
        ])
        context.saleArtworkLoader.mockResolvedValue({
          end_at: pastTime,
          extended_bidding_end_at: pastTime,
        })

        const data = await runQuery(query, context)

        expect(data.artwork.collectorSignals.auction.lotClosesAt).toEqual(
          pastTime
        )
      })
    })

    describe("curatorsPick", () => {
      it("returns true if the artwork id is in a curated collection and has sale_ids", async () => {
        artwork.purchasable = true
        artwork.sale_ids = ["sale-id-auction"]
        context.marketingCollectionLoader.mockResolvedValue({
          artwork_ids: [artwork._id],
        })

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.curatorsPick).toBe(true)
      })

      it("returns true if the artwork id is in a curated collection with no sale ids", async () => {
        artwork.purchasable = true
        artwork.sale_ids = []
        context.marketingCollectionLoader.mockResolvedValue({
          artwork_ids: [artwork._id],
        })

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.curatorsPick).toBe(true)
      })

      it("returns true if the artwork id is in a curated collection and not purchasable but inquireable", async () => {
        artwork.purchasable = false
        artwork.inquireable = true
        context.marketingCollectionLoader.mockResolvedValue({
          artwork_ids: [artwork._id],
        })

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.curatorsPick).toBe(true)
      })

      it("returns false if the artwork id is not in a curated collection", async () => {
        artwork.purchasable = true
        context.marketingCollectionLoader.mockResolvedValue({
          artwork_ids: [],
        })

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.curatorsPick).toBe(false)
      })
    })

    describe("runningShow", () => {
      it("returns the show or fair if the artwork id is in a running show or fair", async () => {
        artwork.purchasable = true
        artwork.show_ids = ["show-id"]
        context.showsLoader.mockResolvedValue([
          {
            name: "Test Show",
            start_at: "2023-01-01T00:00:00Z",
            end_at: "2023-01-02T00:00:00Z",
          },
        ])

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.runningShow).toEqual({
          name: "Test Show",
          startAt: "2023-01-01T00:00:00Z",
          endAt: "2023-01-02T00:00:00Z",
        })
      })

      it("returns null if the artwork id is not in a running show or fair", async () => {
        artwork.purchasable = true
        context.showsLoader.mockResolvedValue([])

        const data = await runQuery(query, context)
        expect(data.artwork.collectorSignals.runningShow).toBeNull()
      })
    })

    it("is null if the artwork is neither inquireable nor purchasable and not in the auction", async () => {
      artwork.purchasable = false
      artwork.inquireable = false
      artwork.sale_ids = []

      const data = await runQuery(query, context)

      expect(context.mePartnerOffersLoader).not.toHaveBeenCalled()

      expect(data.artwork.collectorSignals).toBeNull()
    })

    it("does not query partner offer signal loaders if the artwork is not purchasable", async () => {
      artwork.purchasable = false
      artwork.inquireable = true

      const data = await runQuery(query, context)

      expect(context.mePartnerOffersLoader).not.toHaveBeenCalled()

      expect(data.artwork.collectorSignals.partnerOffer).toBeNull()
    })

    it("does not query partner offer signal loaders if the partnerOffer field is not requested", async () => {
      artwork.purchasable = true

      context.salesLoader.mockResolvedValue([])

      const noPartnerOfferQuery = `

        {
          artwork(id: "richard-prince-untitled-portrait") {
            collectorSignals {
              increasedInterest
            }
          }
        }`

      const data = await runQuery(noPartnerOfferQuery, context)

      expect(context.mePartnerOffersLoader).not.toHaveBeenCalled()

      expect(data).toEqual({
        artwork: {
          collectorSignals: {
            increasedInterest: false,
          },
        },
      })
    })

    it("does not query auction loaders if the auction field is not requested", async () => {
      artwork.inquireable = true

      const noAuctionFieldsQuery = `

      {
        artwork(id: "richard-prince-untitled-portrait") {
          collectorSignals {
            partnerOffer { endAt }
          }
        }
      }`

      const data = await runQuery(noAuctionFieldsQuery, context)

      expect(context.salesLoader).not.toHaveBeenCalled()

      expect(data).toEqual({
        artwork: {
          collectorSignals: {
            partnerOffer: null,
          },
        },
      })
    })
  })

  describe("artistSeriesConnection", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          artistSeriesConnection(first: 3) {
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `

    it("returns the connection", async () => {
      const artistSeriesList = {
        body: [
          {
            id: "foo-bar",
            title: "Catty Art Series",
          },
        ],
        headers: { "x-total-count": 35 },
      }
      const context = {
        artworkLoader: () =>
          Promise.resolve({
            id: "richard-prince-untitled-portrait",
          }),
        artistSeriesListLoader: () => Promise.resolve(artistSeriesList),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          artistSeriesConnection: {
            edges: [{ node: { slug: "foo-bar" } }],
          },
        },
      })
    })
  })

  describe("shippingWeight and shippingWeightMetric", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          shippingWeight
          shippingWeightMetric
        }
      }
    `
    it("returns the artwork shipping weight and metric", async () => {
      artwork.shipping_weight = 10
      artwork.shipping_weight_metric = "kg"

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          shippingWeight: 10,
          shippingWeightMetric: "kg",
        },
      })
    })
  })

  describe("framed height/width/depth/diameter/metric", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          framedHeight
          framedWidth
          framedDepth
          framedDiameter
          framedMetric
        }
      }
    `
    it("returns the artwork framed dimensions", async () => {
      artwork.framed_height = 10
      artwork.framed_width = 20
      artwork.framed_depth = 30
      artwork.framed_diameter = 40
      artwork.framed_metric = "cm"

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          framedHeight: "10",
          framedWidth: "20",
          framedDepth: "30",
          framedDiameter: "40",
          framedMetric: "cm",
        },
      })
    })
  })

  describe("unframed height/width/depth/diameter in cm", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          heightCm
          widthCm
          depthCm
          diameterCm
        }
      }
    `

    it("returns the artwork dimensions in cm", async () => {
      artwork.height_cm = 10
      artwork.width_cm = 20
      artwork.depth_cm = 30
      artwork.diameter_cm = 40

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          heightCm: 10,
          widthCm: 20,
          depthCm: 30,
          diameterCm: 40,
        },
      })
    })
  })

  describe("#completenessChecklist", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          completenessChecklist {
            key
            completed
          }
        }
      }
    `

    it("returns an empty array when completeness_checklist is null", async () => {
      artwork = {
        ...artwork,
        completeness_checklist: null,
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          completenessChecklist: [],
        },
      })
    })

    it("transforms the hash into an array of checklist items", async () => {
      artwork = {
        ...artwork,
        completeness_checklist: {
          publishable: { valid: true },
          multiple_images: { valid: true },
          price_visibility: { valid: true },
          high_res_image: { valid: false },
          certificate: { valid: true },
          signature: { valid: false },
          description: { valid: true },
        },
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data.artwork.completenessChecklist).toEqual(
        expect.arrayContaining([
          {
            key: "PUBLISHABLE",
            completed: true,
          },
          {
            key: "MULTIPLE_IMAGES",
            completed: true,
          },
          {
            key: "PRICE_VISIBILITY",
            completed: true,
          },
          {
            key: "HIGH_RES_IMAGE",
            completed: false,
          },
          {
            key: "CERTIFICATE",
            completed: true,
          },
          {
            key: "SIGNATURE",
            completed: false,
          },
          {
            key: "DESCRIPTION",
            completed: true,
          },
        ])
      )
    })

    it("handles empty object", async () => {
      artwork = {
        ...artwork,
        completeness_checklist: {},
      }

      context = {
        artworkLoader: () => Promise.resolve(artwork),
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          completenessChecklist: [],
        },
      })
    })
  })
})

describe("Artwork caption field", () => {
  const query = gql`
    {
      artwork(id: "percy-z-cat-artwork") {
        caption
      }
    }
  `

  const mockArtwork = {
    _id: "percy-z-cat-artwork-database-id",
    id: "percy-z-cat-artwork",
    title: "Percy and Fiby: A Cat Tale",
  }

  describe("with unauthenticated context", () => {
    it("returns caption when artworkCaptionsLoader succeeds", async () => {
      const artworkCaptionsLoader = jest.fn(() =>
        Promise.resolve({
          data: {
            caption: "This is a beautiful artwork caption",
          },
        })
      )

      const context = {
        artworkLoader: () => Promise.resolve(mockArtwork),
        unauthenticatedLoaders: {
          artworkCaptionsLoader,
        },
        artworkCaptionsLoader,
      }

      const data = await runQuery(query, context)

      expect(artworkCaptionsLoader).toHaveBeenCalledWith({
        artwork_id: mockArtwork._id,
      })
      expect(data).toEqual({
        artwork: {
          caption: "This is a beautiful artwork caption",
        },
      })
    })

    it("returns null when caption data is null", async () => {
      const artworkCaptionsLoader = jest.fn(() =>
        Promise.resolve({
          data: {
            caption: null,
          },
        })
      )

      const context = {
        artworkLoader: () => Promise.resolve(mockArtwork),
        unauthenticatedLoaders: {
          artworkCaptionsLoader,
        },
        artworkCaptionsLoader,
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          caption: null,
        },
      })
    })

    it("returns null when artworkCaptionsLoader is not available", async () => {
      const context = {
        artworkLoader: () => Promise.resolve(mockArtwork),
        unauthenticatedLoaders: {},
        artworkCaptionsLoader: null,
      }

      const data = await runQuery(query, context)

      expect(data).toEqual({
        artwork: {
          caption: null,
        },
      })
    })

    it("returns null when artworkCaptionsLoader throws an error", async () => {
      const artworkCaptionsLoader = jest.fn(() =>
        Promise.reject(
          new Error(
            "Artwork caption not found for artwork_id: 62c46ba25523ce000ec596d9"
          )
        )
      )

      const context = {
        artworkLoader: () => Promise.resolve(mockArtwork),
        unauthenticatedLoaders: {
          artworkCaptionsLoader,
        },
        artworkCaptionsLoader,
      }

      const data = await runQuery(query, context)

      expect(artworkCaptionsLoader).toHaveBeenCalledWith({
        artwork_id: mockArtwork._id,
      })
      expect(data).toEqual({
        artwork: {
          caption: null,
        },
      })
    })
  })
})
