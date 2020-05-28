/* eslint-disable promise/always-return */
import moment from "moment"
import _ from "lodash"
import { fill } from "lodash"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Sale type", () => {
  const sale = {
    id: "foo-foo",
    _id: "123",
    currency: "$",
    is_auction: true,
    is_preliminary: false,
    increment_strategy: "default",
    lot_conditions_report_enabled: true,
    require_identity_verification: true,
  }

  const execute = async (query, gravityResponse = sale, context = {}) => {
    return await runQuery(query, {
      saleLoader: () => Promise.resolve(gravityResponse),
      ...context,
    })
  }

  describe("sale timeZone", () => {
    const query = `
    {
      sale(id: "foo-foo") {
        timeZone
      }
    }`

    it("returns the correct value for timeZone", async () => {
      sale.time_zone = "America/Chicago"
      expect(await execute(query)).toEqual({
        sale: {
          timeZone: "America/Chicago",
        },
      })
    })
  })

  describe("auction state", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          internalID
          isPreview
          isOpen
          isLiveOpen
          isClosed
          isPreliminary
          isRegistrationClosed
          isLotConditionsReportEnabled
          requireIdentityVerification
          status
        }
      }
    `

    it("returns the correct values when the sale is closed", async () => {
      sale.auction_state = "closed"
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          isPreview: false,
          isOpen: false,
          isLiveOpen: false,
          isClosed: true,
          isPreliminary: false,
          isRegistrationClosed: false,
          isLotConditionsReportEnabled: true,
          requireIdentityVerification: true,
          status: "closed",
        },
      })
    })

    it("returns the correct values when the sale is in preview mode", async () => {
      sale.auction_state = "preview"
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          isPreview: true,
          isOpen: false,
          isLiveOpen: false,
          isClosed: false,
          isPreliminary: false,
          isRegistrationClosed: false,
          isLotConditionsReportEnabled: true,
          requireIdentityVerification: true,
          status: "preview",
        },
      })
    })

    it("returns the correct values when the sale is open", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().add(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          isPreview: false,
          isOpen: true,
          isLiveOpen: false,
          isClosed: false,
          isPreliminary: false,
          isRegistrationClosed: false,
          isLotConditionsReportEnabled: true,
          requireIdentityVerification: true,
          status: "open",
        },
      })
    })

    it("returns the correct values when the sale is in live mode", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().subtract(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          isPreview: false,
          isOpen: true,
          isLiveOpen: true,
          isClosed: false,
          isPreliminary: false,
          isRegistrationClosed: false,
          isLotConditionsReportEnabled: true,
          requireIdentityVerification: true,
          status: "open",
        },
      })
    })

    it("returns the correct values when sale registration is closed", async () => {
      sale.auction_state = "open"
      sale.registration_ends_at = moment().subtract(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          isPreview: false,
          isOpen: true,
          isLiveOpen: true,
          isClosed: false,
          isPreliminary: false,
          isRegistrationClosed: true,
          isLotConditionsReportEnabled: true,
          requireIdentityVerification: true,
          status: "open",
        },
      })
    })
  })

  describe("liveURLIfOpen", () => {
    it("returns liveURLIfOpen if isLiveOpen", async () => {
      sale.auction_state = "open"
      sale.is_live_open = true
      sale.live_start_at = moment().subtract(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            liveURLIfOpen
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          liveURLIfOpen: "https://live.artsy.net/foo-foo",
        },
      })
    })

    it("returns liveURLIfOpen if live_start_at < now", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().subtract(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            liveURLIfOpen
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          liveURLIfOpen: "https://live.artsy.net/foo-foo",
        },
      })
    })

    it("returns null if not isLiveOpen", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().add(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            liveURLIfOpen
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          liveURLIfOpen: null,
        },
      })
    })
  })

  describe("saleArtworksConnection", () => {
    it("returns data from gravity", () => {
      const query = `
        {
          sale(id: "foo-foo") {
            saleArtworksConnection(first: 10) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      sale.eligible_sale_artworks_count = 20

      const context = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: sinon.stub().returns(
          Promise.resolve({
            body: fill(Array(sale.eligible_sale_artworks_count), {
              id: "some-id",
            }),
          })
        ),
      }

      return runAuthenticatedQuery(query, context).then((data) => {
        expect(data).toMatchSnapshot()
      })
    })

    it("accepts the internalIDs argument", () => {
      const query = `
        {
          sale(id: "foo-foo") {
            saleArtworksConnection(internalIDs: ["sa-id-0", "sa-id-1"]) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      sale.eligible_sale_artworks_count = 2

      const saleArtworks = [{ id: "sa-slug-0" }, { id: "sa-slug-1" }]
      const saleArtworksLoaderMock = jest
        .fn()
        .mockResolvedValue({ body: saleArtworks })
      const context = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: saleArtworksLoaderMock,
      }

      return runAuthenticatedQuery(query, context).then((data) => {
        expect(saleArtworksLoaderMock.mock.calls[0][1].ids).toEqual([
          "sa-id-0",
          "sa-id-1",
        ])

        expect(data).toMatchSnapshot()
      })
    })
  })

  it("returns and empty array if the internalIDs argument is []", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          saleArtworksConnection(internalIDs: []) {
            edges {
              node {
                slug
              }
            }
          }
        }
      }
    `
    const context = {
      saleLoader: () => Promise.resolve(sale),
    }

    return runAuthenticatedQuery(query, context).then((data) => {
      expect(data.sale.saleArtworksConnection.edges).toEqual([])
    })
  })

  describe("saleArtworks", () => {
    const saleArtworks = [
      {
        id: "foo",
        minimum_next_bid_cents: 400000,
        sale_id: "foo-foo",
      },
      {
        id: "bar",
        minimum_next_bid_cents: 20000,
        sale_id: "foo-foo",
      },
    ]

    // FIXME: Cannot read property 'increments' of undefined
    it.skip("returns data from gravity", async () => {
      const query = `
        {
          sale(id: "foo-foo") {
            saleArtworksConnection {
              edges {
                node {
                  increments {
                    cents
                  }
                }
              }
            }
          }
        }
      `

      const context = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: sinon
          .stub()
          .returns(Promise.resolve({ body: saleArtworks })),
        incrementsLoader: () => {
          return Promise.resolve([
            {
              key: "default",
              increments: [
                {
                  from: 0,
                  to: 399999,
                  amount: 5000,
                },
                {
                  from: 400000,
                  to: 1000000,
                  amount: 10000,
                },
              ],
            },
          ])
        },
      }

      return runAuthenticatedQuery(query, context).then((data) => {
        expect(
          data.sale.saleArtworksConnection[0].increments.cents.slice(0, 5)
        ).toEqual([400000, 410000, 420000, 430000, 440000])
        expect(
          data.sale.saleArtworksConnection[1].increments.cents.slice(0, 5)
        ).toEqual([20000, 25000, 30000, 35000, 40000])
      })
    })
  })

  describe("buyers premium", () => {
    it("returns a valid object even if the sale has no buyers premium", async () => {
      const query = `
        {
          sale(id: "foo-foo") {
            internalID
            buyersPremium {
              amount
              cents
            }
          }
        }
      `

      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          buyersPremium: null,
        },
      })
    })

    it("returns a valid object if there is a complete buyers premium", async () => {
      sale.buyers_premium = {
        schedule: [
          {
            min_amount_cents: 10000,
            currency: "USD",
          },
        ],
      }

      const query = `
        {
          sale(id: "foo-foo") {
            internalID
            buyersPremium {
              amount
              cents
            }
          }
        }
      `

      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          buyersPremium: [
            {
              amount: "$100",
              cents: 10000,
            },
          ],
        },
      })
    })
  })

  describe("associated sale", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          internalID
          associatedSale {
            slug
          }
        }
      }
    `

    it("does not error, but returns null for associated sale", async () => {
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          associatedSale: null,
        },
      })
    })

    it("returns the associated sale", async () => {
      sale.associated_sale = {
        id: "foo-foo",
      }
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          associatedSale: {
            slug: "foo-foo",
          },
        },
      })
    })
  })

  describe("promoted sale", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          internalID
          promotedSale {
            slug
          }
        }
      }
    `

    it("does not error, but returns null for promoted sale", async () => {
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          promotedSale: null,
        },
      })
    })

    it("returns the promoted sale", async () => {
      sale.promoted_sale = {
        id: "foo-foo",
      }
      expect(await execute(query)).toEqual({
        sale: {
          internalID: "123",
          promotedSale: {
            slug: "foo-foo",
          },
        },
      })
    })
  })

  describe("isGalleryAuction, isBenefit", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          isBenefit
          isGalleryAuction
        }
      }
    `

    it("returns whether the gallery is a gallery auction", async () => {
      sale.is_benefit = false
      sale.is_gallery_auction = true
      expect(await execute(query)).toEqual({
        sale: {
          isBenefit: false,
          isGalleryAuction: true,
        },
      })
    })

    it("returns whether the gallery is a benefit auction", async () => {
      sale.is_benefit = true
      sale.is_gallery_auction = false
      expect(await execute(query)).toEqual({
        sale: {
          isBenefit: true,
          isGalleryAuction: false,
        },
      })
    })
  })

  describe("display_timely_at", () => {
    const testData = [
      [
        {
          auction_state: "open",
          live_start_at: moment().subtract(1, "days"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "in progress",
      ],
      [{ end_at: moment().subtract(1, "days") }, null],
      [
        {
          auction_state: "open",
          live_start_at: moment().subtract(2, "days"),
          registration_ends_at: moment().subtract(3, "days"),
        },
        "in progress",
      ],
      [
        {
          live_start_at: moment().add(2, "minutes"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "live in 2m",
      ],
      [
        {
          live_start_at: moment().add(10, "minutes"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "live in 10m",
      ],
      [
        {
          live_start_at: moment().add(20, "minutes"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "live in 20m",
      ],
      [
        {
          live_start_at: moment().add(20, "days"),
          registration_ends_at: moment().add(10, "minutes"),
        },
        `register by\n${moment(moment().add(10, "minutes")).format("ha")}`,
      ],
      [
        {
          live_start_at: moment().add(30, "days"),
          registration_ends_at: moment().add(10, "days"),
        },
        `register by\n${moment(moment().add(10, "days")).format("MMM D, ha")}`,
      ],
      [
        {
          live_start_at: moment().add(20, "days"),
          registration_ends_at: moment().add(10, "days"),
        },
        "live in 20d",
        true, // used to fake registered bidder for this scenario
      ],
      [
        {
          start_at: moment().add(1, "minutes"),
          end_at: moment().add(10, "minutes"),
        },
        "ends in 10m",
      ],
      [
        {
          start_at: moment().add(10, "minutes"),
          end_at: moment().add(20, "minutes"),
        },
        "ends in 20m",
      ],
      [
        {
          start_at: moment().add(1, "hours"),
          end_at: moment().add(10, "hours"),
        },
        "ends in 10h",
      ],
      [
        {
          start_at: moment().add(2, "hours"),
          end_at: moment().add(20, "hours"),
        },
        "ends in 20h",
      ],
      [
        { start_at: moment().add(1, "days"), end_at: moment().add(2, "days") },
        "ends in 2d",
      ],
      [
        { start_at: moment().add(1, "days"), end_at: moment().add(5, "days") },
        "ends in 5d",
      ],
      [
        {
          start_at: moment().add(20, "days"),
          end_at: moment().add(30, "days"),
        },
        `ends ${moment(moment().add(30, "days")).format("MMM D")}`,
      ],
      [
        {
          start_at: moment().add(30, "days"),
          end_at: moment().add(40, "days"),
        },
        `ends ${moment(moment().add(40, "days")).format("MMM D")}`,
      ],
    ]

    const query = `
      {
        sale(id: "foo-foo") {
          displayTimelyAt
        }
      }
    `

    it("returns proper labels", async () => {
      const results = await Promise.all(
        testData.map(async ([input, _label, is_registered]) => {
          let bidders = []
          if (is_registered) {
            bidders = [{}]
          }
          return await execute(
            query,
            {
              currency: "$",
              is_auction: true,
              ...input,
            },
            { meBiddersLoader: () => Promise.resolve(bidders) }
          )
        })
      )

      const labels = testData.map((test) => test[1])

      results.forEach(({ sale: { displayTimelyAt } }, index) => {
        expect(displayTimelyAt).toEqual(labels[index])
      })
    })
  })

  describe("formattedStartDateTime", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          formattedStartDateTime
        }
      }
    `

    it("returns Start time when start_at is in the future", async () => {
      const response = await execute(query, {
        start_at: moment().add(1, "hours"),
      })
      expect(response.sale.formattedStartDateTime).toContain("Start")
    })

    it("returns End time when end_at is in the past", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        end_at: moment().subtract(1, "hours"),
      })
      expect(response.sale.formattedStartDateTime).toContain("Ended")
    })

    it("returns End time when end_at is in the past", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        end_at: null,
        ended_at: moment().subtract(1, "hours"),
      })
      expect(response.sale.formattedStartDateTime).toContain("Ended")
    })

    it("returns End time when ended_at is in the past but end_at is in the future", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        end_at: moment().add(1, "hours"),
        ended_at: moment().subtract(1, "hours"),
      })
      expect(response.sale.formattedStartDateTime).toContain("Ended")
    })

    it("returns Live start time if live_start_at is in the future", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        live_start_at: moment().add(2, "hours"),
      })
      expect(response.sale.formattedStartDateTime).toContain("Live")
    })

    it("returns In Progress when its live and end_at is in the future", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        live_start_at: moment().subtract(1, "hours"),
        end_at: moment().add(2, "hours"),
        ended_at: null,
      })
      expect(response.sale.formattedStartDateTime).toContain("In progress")
    })

    it("returns In Progress when its live and ended_at is in the future", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        live_start_at: moment().subtract(1, "hours"),
        ended_at: moment().add(2, "hours"),
        end_at: null,
      })
      expect(response.sale.formattedStartDateTime).toContain("In progress")
    })

    it("returns End time", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(3, "hours"),
        live_start_at: null,
        end_at: moment().add(1, "hours"),
        ended_at: null,
      })
      expect(response.sale.formattedStartDateTime).toContain("Ends")
    })
  })

  describe("registration status", () => {
    it("returns null if not registered for this sale", async () => {
      const query = gql`
        {
          sale(id: "foo-foo") {
            registrationStatus {
              qualifiedForBidding
            }
          }
        }
      `
      const context = {
        saleLoader: () => Promise.resolve(sale),
        meBiddersLoader: () => Promise.resolve([]),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(data.sale.registrationStatus).toEqual(null)
    })

    // FIXME: meBiddersLoader is not a function?
    it.skip("returns the registration status for the sale", async () => {
      const query = gql`
        {
          sale(id: "foo-foo") {
            registrationStatus {
              qualifiedForBidding
            }
          }
        }
      `
      const context = {
        saleLoader: () => Promise.resolve(sale),
        meBiddersLoader: (params) =>
          _.isEqual(params, { saleID: "foo-foo" }) &&
          Promise.resolve([{ qualifiedForBidding: true }]),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(data.sale.registrationStatus.qualifiedForBidding).toEqual(true)
    })
  })

  describe("userNeedsIdentityVerification", () => {
    describe("when the sale doesn't requires identity verification", () => {
      let sale = {
        id: "foo-foo",
        _id: "123",
        currency: "$",
        is_auction: true,
        is_preliminary: false,
        increment_strategy: "default",
        lot_conditions_report_enabled: true,
        require_identity_verification: false,
      }

      it("returns false", async () => {
        const query = gql`
          {
            sale(id: "foo-foo") {
              userNeedsIdentityVerification
            }
          }
        `

        const context = {
          saleLoader: () => Promise.resolve(sale),
        }

        const data = await runAuthenticatedQuery(query, context)
        expect(data.sale.userNeedsIdentityVerification).toEqual(false)
      })
    })

    describe("when the sale does require identity verification", () => {
      let sale = {
        id: "foo-foo",
        _id: "123",
        currency: "$",
        is_auction: true,
        is_preliminary: false,
        increment_strategy: "default",
        lot_conditions_report_enabled: true,
        require_identity_verification: true,
      }

      describe("when there is no current user", () => {
        it("returns true", async () => {
          const query = gql`
            {
              sale(id: "foo-foo") {
                userNeedsIdentityVerification
              }
            }
          `

          const context = {
            saleLoader: () => Promise.resolve(sale),
          }

          const data = await runQuery(query, context)
          expect(data.sale.userNeedsIdentityVerification).toEqual(true)
        })
      })

      describe("when there is a current user", () => {
        describe("when the user is registered for the sale", () => {
          it("returns false bidder.needs_identity_verification is false", async () => {
            const bidder = {
              id: "bidder-id",
              sale: { _id: "sale-id", id: "sale-slug" },
              needs_identity_verification: false,
            }

            const query = gql`
              {
                sale(id: "foo-foo") {
                  userNeedsIdentityVerification
                }
              }
            `
            const context = {
              saleLoader: () => Promise.resolve(sale),
              meLoader: () => Promise.resolve({ identity_verified: false }),
              meBiddersLoader: () => Promise.resolve([bidder]),
            }

            const data = await runAuthenticatedQuery(query, context)
            expect(data.sale.userNeedsIdentityVerification).toEqual(false)
          })

          it("returns true when bidder.needs_identity_verification is true", async () => {
            const bidder = {
              id: "bidder-id",
              sale: { _id: "sale-id", id: "sale-slug" },
              needs_identity_verification: true,
            }

            const query = gql`
              {
                sale(id: "foo-foo") {
                  userNeedsIdentityVerification
                }
              }
            `
            const context = {
              saleLoader: () => Promise.resolve(sale),
              meLoader: () => Promise.resolve({ identity_verified: false }),
              meBiddersLoader: () => Promise.resolve([bidder]),
            }

            const data = await runAuthenticatedQuery(query, context)
            expect(data.sale.userNeedsIdentityVerification).toEqual(true)
          })
        })
        describe("when the user is not registered for the sale", () => {
          it("returns false when the user is identity verified", async () => {
            const query = gql`
              {
                sale(id: "foo-foo") {
                  userNeedsIdentityVerification
                }
              }
            `

            const context = {
              saleLoader: () => Promise.resolve(sale),
              meLoader: () => Promise.resolve({ identity_verified: true }),
              meBiddersLoader: () => Promise.resolve([]),
            }

            const data = await runAuthenticatedQuery(query, context)
            expect(data.sale.userNeedsIdentityVerification).toEqual(false)
          })

          it("returns true when the user is not identity verified", async () => {
            const query = gql`
              {
                sale(id: "foo-foo") {
                  userNeedsIdentityVerification
                }
              }
            `

            const context = {
              saleLoader: () => Promise.resolve(sale),
              meLoader: () => Promise.resolve({ identity_verified: false }),
              meBiddersLoader: () => Promise.resolve([]),
            }

            const data = await runAuthenticatedQuery(query, context)
            expect(data.sale.userNeedsIdentityVerification).toEqual(true)
          })
        })
      })
    })
  })

  describe("artworksConnection", () => {
    it("returns data from gravity", () => {
      const query = `
          {
            sale(id: "foo-foo") {
              artworksConnection(first: 10) {
                pageInfo {
                  hasNextPage
                }
                edges {
                  node {
                    slug
                  }
                }
              }
            }
          }
        `

      sale.eligible_sale_artworks_count = 20

      const context = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: () =>
          Promise.resolve({
            body: fill(Array(sale.eligible_sale_artworks_count), {
              artwork: {
                id: "some-id",
              },
            }),
          }),
      }

      return runAuthenticatedQuery(query, context).then((data) => {
        expect(data.sale.artworksConnection.pageInfo.hasNextPage).toBe(true)
        expect(data).toMatchSnapshot()
      })
    })
  })
})
