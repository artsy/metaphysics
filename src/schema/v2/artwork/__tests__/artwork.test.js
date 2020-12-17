/* eslint-disable promise/always-return */
import { assign } from "lodash"
import moment from "moment"

import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { getMicrofunnelDataByArtworkInternalID } from "schema/v2/artist/targetSupply/utils/getMicrofunnelData"

jest.mock("schema/v2/artist/targetSupply/utils/getMicrofunnelData")

describe("Artwork type", () => {
  const sale = { id: "existy" }

  let artwork = null
  let context = null

  const artworkImages = [
    {
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
      id: "richard-prince-untitled-portrait",
      title: "Untitled (Portrait)",
      forsale: true,
      acquireable: false,
      artists: [],
      sale_ids: ["sale-id-not-auction", "sale-id-auction"],
      attribution_class: "unique",
      dimensions: { in: "2 x 3in." },
      metric: "in",
      unlisted: true,
      category: "Painting",
    }
    context = {
      artworkLoader: sinon
        .stub()
        .withArgs(artwork.id)
        .returns(Promise.resolve(artwork)),
    }
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
              display: "$420",
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
      artwork.price_currency = "USD"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            listPrice: {
              display: "Under $420",
              minPrice: null,
              maxPrice: {
                minor: 42000,
                major: 420,
                display: null,
                currencyCode: "USD",
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
              display: "Starting at $420",
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
          availability: "on hold",
          price: "$1,000",
        },
        {
          availability: "on loan",
        },
        {
          availability: "permanent collection",
        },
        {
          availabilitiy: "for sale",
          price: "$1,000",
        },
        {
          availabilitiy: "not for sale",
        },
        { forsale: true },
      ]

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            editionSets: [
              {
                saleMessage: "On hold",
              },
              {
                saleMessage: "On loan",
              },
              {
                saleMessage: "Permanent collection",
              },
              {
                saleMessage: "$1,000",
              },
              {
                saleMessage: "No longer available",
              },
              {
                saleMessage: "Contact for price",
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

    it("returns 'On hold' if work is on hold with no price", () => {
      artwork.sale_message = "Not for sale"
      artwork.price = null
      artwork.availability = "on hold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "On hold",
          },
        })
      })
    })

    it("returns '[Price], on hold' if work is on hold with a price", () => {
      artwork.sale_message = "Not for sale"
      artwork.price = "$420,000"
      artwork.availability = "on hold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "$420,000, on hold",
          },
        })
      })
    })

    it("returns 'Sold' if work is sold", () => {
      artwork.sale_message = "$420,000 - Sold"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "Sold",
          },
        })
      })
    })

    it("returns null if work is not for sale", () => {
      artwork.availability = "not for sale"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: null,
          },
        })
      })
    })

    it("returns 'On loan' if work is on loan", () => {
      artwork.sale_message = "Not for sale"
      artwork.availability = "on loan"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "On loan",
          },
        })
      })
    })

    it("returns null if work is marked with availability_hidden", () => {
      artwork.sale_message = "for sale"
      artwork.availability = "on loan"
      artwork.availability_hidden = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: null,
          },
        })
      })
    })

    it("returns Permanent Collection if work is part of permanent collection", () => {
      artwork.sale_message = "for sale"
      artwork.availability = "permanent collection"

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            saleMessage: "Permanent collection",
          },
        })
      })
    })

    it("returns the gravity sale_message if for sale", () => {
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

    it("returns null if work is marked with availability_hidden", () => {
      artwork.availability = "sold"
      artwork.availability_hidden = true

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            slug: "richard-prince-untitled-portrait",
            contactMessage: null,
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
      context.saleArtworkLoader = ({ saleId, saleArtworkId }) =>
        saleId === artwork.sale_ids[0] &&
        saleArtworkId === "richard-prince-untitled-portrait" &&
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
      context.saleArtworkLoader = ({ saleId, saleArtworkId }) =>
        saleId === artwork.sale_ids[1] &&
        saleArtworkId === "richard-prince-untitled-portrait" &&
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

  describe("#context", () => {
    it("returns either one Fair, Sale, or PartnerShow", () => {
      const relatedSale = assign({}, sale, {
        is_auction: true,
        name: "Y2K",
        end_at: moment.utc("1999-12-31").format(),
      })
      context.salesLoader = sinon.stub().returns(Promise.resolve([relatedSale]))
      context.relatedFairsLoader = sinon.stub().returns(Promise.resolve([]))
      context.relatedShowsLoader = sinon.stub().returns(Promise.resolve([]))
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
        it("is hangable if ink artwork is 2d and has reasonable dimensions", () => {
          artwork.width = 100
          artwork.height = 100
          artwork.category = "ink"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })

        it("is hangable if artwork is 2d with a reasonable dimensions + tiny depth", () => {
          artwork.width = 100
          artwork.height = 100
          artwork.depth = 0.5
          artwork.category = "ink"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })

        it("is hangable if painting artwork is 2d and has reasonable dimensions", () => {
          artwork.width = 100
          artwork.height = 100
          artwork.category = "painting"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(true)
          })
        })
      })

      describe("if the artwork is not able to be used with View in Room", () => {
        it("is not hangable if the category is not applicable to wall display like sculpture", () => {
          artwork.category = "sculpture"
          artwork.width = 100
          artwork.height = 100
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if the category is not applicable to wall display like installations", () => {
          artwork.category = "installation"
          artwork.width = 100
          artwork.height = 100
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if the work is 3d", () => {
          artwork.width = 100
          artwork.height = 100
          artwork.depth = 100
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if the dimensions are unreasonably large", () => {
          artwork.width = "10000"
          artwork.height = "10000"
          artwork.metric = "cm"
          return runQuery(query, context).then((data) => {
            expect(data.artwork.isHangable).toBe(false)
          })
        })

        it("is not hangable if there is no dimensions", () => {
          artwork.dimensions = {}
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

      it("returns false for ecommerce works regardless of work inquireable status", () => {
        artwork.inquireable = true
        artwork.ecommerce = true
        return runQuery(query, context).then((data) => {
          expect(data.artwork.isInquireable).toBe(false)
        })
      })

      it("returns true for inquireable non ecommerce works", () => {
        artwork.inquireable = true
        artwork.ecommerce = false
        return runQuery(query, context).then((data) => {
          expect(data.artwork.isInquireable).toBe(true)
        })
      })

      it("returns false for non inquireable non ecommerce works", () => {
        artwork.inquireable = false
        artwork.ecommerce = false
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

    it("returns available inquiry questions if an artwork is not inquirable", () => {
      const context = {
        artworkLoader: () => {
          return Promise.resolve({ id: "blah", sale_ids: ["sale_id"] })
        },
        inquiryRequestQuestionsLoader: () => {
          return Promise.reject()
        },
      }

      return runQuery(query, context).then((data) => {
        expect(data.artwork.inquiryQuestions).toEqual([])
      })
    })

    it("returns inquiry questions if an artwork is inquirable", () => {
      const context = {
        artworkLoader: () => {
          return Promise.resolve({ id: "blah", sale_ids: [] })
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

    it(`returns proper attribution class info for unique artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            attributionClass {
              info
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            attributionClass: {
              info: "One of a kind piece",
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
              shortDescription: "This is a unique work",
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
              longDescription: "One of a kind piece, created by the artist.",
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
              description: "A Cat, 2 x 3in.",
            },
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

    it("is set to prompt string when its domestic_shipping_fee_cents is null and international_shipping_fee_cents is null", () => {
      artwork.domestic_shipping_fee_cents = null
      artwork.international_shipping_fee_cents = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping, tax, and additional fees quoted by seller",
          },
        })
      })
    })

    it("is set to free domestic shipping only when its domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is null", () => {
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Free domestic shipping only",
          },
        })
      })
    })

    it("is set to free shipping string when its domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is 0", () => {
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = 0
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Free shipping worldwide",
          },
        })
      })
    })

    it("is set to domestic shipping only when its domestic_shipping_fee_cents is present and international_shipping_fee_cents is null", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping: $10 domestic only",
          },
        })
      })
    })

    it("is set to free international shipping when domestic_shipping_fee_cents is 0 and domestic_shipping_fee_cents is present", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 0
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping: $10 domestic, free rest of world",
          },
        })
      })
    })

    it("is set to free domestic shipping when domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is present", () => {
      artwork.domestic_shipping_fee_cents = 0
      artwork.international_shipping_fee_cents = 10000
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping: Free domestic, $100 rest of world",
          },
        })
      })
    })

    it("is set to domestic and intermational shipping when both domestic_shipping_fee_cents and present and international_shipping_fee_cents are set", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 2000
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping: $10 domestic, $20 rest of world",
          },
        })
      })
    })

    it("shows shipping costs in the same currency as list price", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = 2000
      artwork.price_currency = "GBP"
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            shippingInfo: "Shipping: £10 domestic, £20 rest of world",
          },
        })
      })
    })

    describe("for artworks that is located within continental EU", () => {
      beforeEach(() => {
        artwork.eu_shipping_origin = true
      })

      it("is set to prompt string when its domestic_shipping_fee_cents is null and international_shipping_fee_cents is null", () => {
        artwork.domestic_shipping_fee_cents = null
        artwork.international_shipping_fee_cents = null

        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo:
                "Shipping, tax, and additional fees quoted by seller",
            },
          })
        })
      })

      it("is set to free euro shipping only when its domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is null", () => {
        artwork.domestic_shipping_fee_cents = 0
        artwork.international_shipping_fee_cents = null
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo: "Free shipping within Continental Europe only",
            },
          })
        })
      })

      it("is set to free shipping string when its domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is 0", () => {
        artwork.domestic_shipping_fee_cents = 0
        artwork.international_shipping_fee_cents = 0
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo: "Free shipping worldwide",
            },
          })
        })
      })

      it("is set to domestic shipping only when its domestic_shipping_fee_cents is present and international_shipping_fee_cents is null", () => {
        artwork.domestic_shipping_fee_cents = 1000
        artwork.international_shipping_fee_cents = null
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo: "Shipping: $10 within Continental Europe only",
            },
          })
        })
      })

      it("is set to free international shipping when domestic_shipping_fee_cents is 0 and domestic_shipping_fee_cents is present", () => {
        artwork.domestic_shipping_fee_cents = 1000
        artwork.international_shipping_fee_cents = 0
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo:
                "Shipping: $10 within Continental Europe, free rest of world",
            },
          })
        })
      })

      it("is set to free domestic shipping when domestic_shipping_fee_cents is 0 and international_shipping_fee_cents is present", () => {
        artwork.domestic_shipping_fee_cents = 0
        artwork.international_shipping_fee_cents = 10000
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo:
                "Shipping: Free within Continental Europe, $100 rest of world",
            },
          })
        })
      })

      it("is set to domestic and intermational shipping when both domestic_shipping_fee_cents and present and international_shipping_fee_cents are set", () => {
        artwork.domestic_shipping_fee_cents = 1000
        artwork.international_shipping_fee_cents = 2000
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo:
                "Shipping: $10 within Continental Europe, $20 rest of world",
            },
          })
        })
      })

      it("shows shipping costs in the same currency as list price", () => {
        artwork.domestic_shipping_fee_cents = 1000
        artwork.international_shipping_fee_cents = 2000
        artwork.price_currency = "EUR"
        return runQuery(query, context).then((data) => {
          expect(data).toEqual({
            artwork: {
              shippingInfo:
                "Shipping: €10 within Continental Europe, €20 rest of world",
            },
          })
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
    it("is true when domestic_shipping_fee_cents is present and international_shipping_fee_cents is null", () => {
      artwork.domestic_shipping_fee_cents = 1000
      artwork.international_shipping_fee_cents = null
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            onlyShipsDomestically: true,
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
            onlyShipsDomestically: false,
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
            onlyShipsDomestically: false,
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
            onlyShipsDomestically: false,
          },
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
      artwork.not_signed = null

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({ artwork: { signatureInfo: null } })
      })
    })
    it("is null when all related fields are false", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
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
      artwork.stamped_by_artist_estate = true
      artwork.sticker_label = true
      artwork.signed_other = true
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            signatureInfo: {
              label: "Signature",
              details:
                "Hand-signed by artist, stamped by artist's estate, sticker label, some details about signature",
            },
          },
        })
      })
    })
    it("is set to proper object when only signed_other is true", () => {
      artwork.signature = ""
      artwork.signed_by_artist = false
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
    it("is set to proper object when certificate_of_authenticity is false", () => {
      artwork.certificate_of_authenticity = false
      return runQuery(query, context).then((data) => {
        expect(data.artwork.certificateOfAuthenticity).toEqual({
          label: "Certificate of authenticity",
          details: "Not included",
        })
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

  describe("#unlisted", () => {
    const query = `
      {
        artwork(id: "richard-prince-untitled-portrait") {
          unlisted
        }
      }
    `
    it("returns unlisted", async () => {
      let data = await runQuery(query, context)
      expect(data.artwork.unlisted).toBe(true)
      artwork.unlisted = false

      data = await runQuery(query, context)
      expect(data.artwork.unlisted).toBe(false)
    })
  })

  describe("includeUnlisted argument", () => {
    beforeEach(() => {
      context = {
        artworkLoader: jest.fn(() => Promise.resolve(artwork)),
      }
    })

    it("passes includeUnlisted to artworkLoader when with the argument", async () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait", includeUnlisted: true) {
            unlisted
          }
        }
      `
      await runQuery(query, context)
      expect(context.artworkLoader).toBeCalledWith(
        "richard-prince-untitled-portrait",
        {
          include_unlisted: true,
        }
      )
    })

    it("does not pass includeUnlisted to artworkLoader when without the argument", async () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            unlisted
          }
        }
      `
      await runQuery(query, context)
      expect(context.artworkLoader).toBeCalledWith(
        "richard-prince-untitled-portrait",
        {}
      )
    })
  })

  describe("mediumType", () => {
    it(`returns proper medium type for artwork`, () => {
      const query = `
        {
          artwork(id: "richard-prince-untitled-portrait") {
            mediumType {
              internalID
              name
              longDescription
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artwork: {
            mediumType: {
              internalID: "Painting",
              name: "Painting",
              longDescription:
                "Includes gouache; fresco; ink and wash; oil painting; screen painting; scroll painting; tempera; watercolor.",
            },
          },
        })
      })
    })
  })
})
