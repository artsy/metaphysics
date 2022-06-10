/* eslint-disable promise/always-return */
import moment from "moment-timezone"
import _ from "lodash"
import { fill } from "lodash"
import { runQuery, runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import sinon from "sinon"

jest.mock("lib/all.ts")
import { allViaLoader as _allViaLoader } from "lib/all"
const allViaLoader = _allViaLoader as jest.Mock<typeof _allViaLoader>

describe("Sale type", () => {
  const sale: any = {
    id: "foo-foo",
    _id: "123",
    cascading_end_time_interval_minutes: 2,
    collect_payments: true,
    currency: "USD",
    is_artsy_licensed: false,
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

  afterEach(() => {
    allViaLoader.mockReset()
  })

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
          collectPayments
          isArtsyLicensed
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
          collectPayments: true,
          isArtsyLicensed: false,
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
          collectPayments: true,
          isArtsyLicensed: false,
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
          collectPayments: true,
          isArtsyLicensed: false,
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
          collectPayments: true,
          isArtsyLicensed: false,
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
          collectPayments: true,
          isArtsyLicensed: false,
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
    it("returns data from gravity", async () => {
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
            headers: {},
          })
        ),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(data).toMatchSnapshot()
    })

    it("accepts the internalIDs argument", async () => {
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

      const data = await runAuthenticatedQuery(query, context)
      expect(saleArtworksLoaderMock.mock.calls[0][1].ids).toEqual([
        "sa-id-0",
        "sa-id-1",
      ])

      expect(data).toMatchSnapshot()
    })

    it("returns and empty array if the internalIDs argument is []", async () => {
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

      const data = await runAuthenticatedQuery(query, context)
      expect(data.sale.saleArtworksConnection.edges).toEqual([])
    })

    it("accepts the all argument", async () => {
      const query = `
        {
          sale(id: "foo-foo") {
            saleArtworksConnection(all: true) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const saleArtworks = [{ id: "sa-slug-0" }, { id: "sa-slug-1" }]
      allViaLoader.mockResolvedValue(saleArtworks)
      const context = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: jest.fn(),
        allViaLoader,
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(allViaLoader.mock.calls[0][1]).toEqual({ path: "foo-foo" })
      expect(data).toMatchSnapshot()
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

      const data = await runAuthenticatedQuery(query, context)
      expect(
        data.sale.saleArtworksConnection[0].increments.cents.slice(0, 5)
      ).toEqual([400000, 410000, 420000, 430000, 440000])
      expect(
        data.sale.saleArtworksConnection[1].increments.cents.slice(0, 5)
      ).toEqual([20000, 25000, 30000, 35000, 40000])
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
    const _now = moment()
    const now = () => moment(_now)
    const testData = [
      [
        {
          auction_state: "open",
          live_start_at: now().subtract(1, "days").toISOString(),
          registration_ends_at: now().subtract(2, "days").toISOString(),
        },
        "in progress",
      ],
      [
        {
          end_at: now().subtract(1, "days").toISOString(),
          start_at: now().subtract(10, "days").toISOString(),
        },
        null,
      ],
      [
        {
          auction_state: "open",
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().subtract(2, "days").toISOString(),
          registration_ends_at: now().subtract(3, "days").toISOString(),
        },
        "in progress",
      ],
      [
        {
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().add(1, "minutes").toISOString(),
          registration_ends_at: now().subtract(2, "days").toISOString(),
        },
        "live in a minute",
      ],
      [
        {
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().add(10, "minutes").toISOString(),
          registration_ends_at: now().subtract(2, "days").toISOString(),
        },
        "live in 10 minutes",
      ],
      [
        {
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().add(20, "minutes").toISOString(),
          registration_ends_at: now().subtract(2, "days").toISOString(),
        },
        "live in 20 minutes",
      ],
      [
        {
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().add(20, "days").toISOString(),
          registration_ends_at: now().add(10, "minutes").toISOString(),
        },
        `register by\n${moment(now().tz("UTC").add(10, "minutes")).format(
          "ha"
        )}`,
      ],
      [
        {
          start_at: now().tz("UTC").subtract(10, "days").toISOString(),
          live_start_at: now().tz("UTC").add(30, "days").toISOString(),
          registration_ends_at: now().tz("UTC").add(10, "days").toISOString(),
        },
        `register by\n${moment(now().tz("UTC").add(10, "days")).format(
          "MMM D, ha"
        )}`,
      ],
      [
        {
          start_at: now().subtract(10, "days").toISOString(),
          live_start_at: now().add(20, "days").toISOString(),
          registration_ends_at: now().add(10, "days").toISOString(),
        },
        "live in 20 days",
        true, // used to fake registered bidder for this scenario
      ],
      [
        {
          start_at: now().add(1, "minutes").toISOString(),
          end_at: now().add(10, "minutes").toISOString(),
        },
        "ends in 10 minutes",
      ],
      [
        {
          start_at: now().add(10, "minutes").toISOString(),
          end_at: now().add(20, "minutes").toISOString(),
        },
        "ends in 20 minutes",
      ],
      [
        {
          start_at: now().add(1, "hours").toISOString(),
          end_at: now().add(10, "hours").toISOString(),
        },
        "ends in 10 hours",
      ],
      [
        {
          start_at: now().add(2, "hours").toISOString(),
          end_at: now().add(20, "hours").toISOString(),
        },
        "ends in 20 hours",
      ],
      [
        {
          start_at: now().add(1, "days").toISOString(),
          end_at: now().add(2, "days").toISOString(),
        },
        "ends in 2 days",
      ],
      [
        {
          start_at: now().add(1, "days").toISOString(),
          end_at: now().add(5, "days").toISOString(),
        },
        "ends in 5 days",
      ],
      [
        {
          start_at: now().add(20, "days").toISOString(),
          end_at: now().add(30, "days").toISOString(),
        },
        `ends ${moment(now().add(30, "days")).format("MMM D")}`,
      ],
      [
        {
          start_at: now().add(30, "days").toISOString(),
          end_at: now().add(40, "days").toISOString(),
        },
        `ends ${moment(now().add(40, "days")).format("MMM D")}`,
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
          let bidders: Array<any> = []
          if (is_registered) {
            bidders = [{}]
          }
          return await execute(
            query,
            {
              currency: "$",
              is_auction: true,
              ...(input as any),
            },
            {
              meBiddersLoader: () => Promise.resolve(bidders),
            }
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
    beforeEach(() => {
      Date.now = jest.fn(() => new Date("2022-03-08T12:33:37.000Z"))
    })
    const query = `
      {
        sale(id: "foo-foo") {
          formattedStartDateTime
          cascadingEndTimeIntervalMinutes
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

    it("returns End time when end_at is in the past (2)", async () => {
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

    it("returns date range when cascading end time interval is true and the sale has not opened", async () => {
      const response = await execute(query, {
        start_at: "2022-03-09 09+07:00",
        end_at: "2022-03-12 09+07:00",
        cascading_end_time_interval_minutes: 2,
      })

      expect(response.sale.formattedStartDateTime).toEqual("March 9 – 12, 2022")
      expect(response.sale.cascadingEndTimeIntervalMinutes).toEqual(2)
    })

    it("returns date range when cascading interval is true while the sale is running", async () => {
      const response = await execute(query, {
        start_at: "2022-03-07 09+07:00",
        end_at: "2022-03-12 09+07:00",
        cascading_end_time_interval_minutes: 2,
      })
      expect(response.sale.formattedStartDateTime).toEqual("March 7 – 12, 2022")
    })

    it("returns the words closing soon when cascading interval is true while the sale is closing soon", async () => {
      const response = await execute(query, {
        start_at: moment().subtract(2, "hours"),
        end_at: moment().subtract(1, "hours"),
        cascading_end_time_interval_minutes: 2,
      })
      expect(response.sale.formattedStartDateTime).toEqual("Closing soon")
    })

    it("returns date and word closed when cascading interval is true while the sale is closing soon", async () => {
      const response = await execute(query, {
        start_at: "2022-03-07 09+07:00",
        end_at: "2022-03-08 09+07:00",
        ended_at: "2022-03-08 10+07:00",
        cascading_end_time_interval_minutes: 2,
      })
      expect(response.sale.formattedStartDateTime).toEqual("Closed Mar 8, 2022")
    })

    it("properly handles null cascading_end_time_interval", async () => {
      const response = await execute(query, {
        start_at: "2022-03-07 09+07:00",
        end_at: "2022-03-08 09+07:00",
        ended_at: "2022-03-08 10+07:00",
      })
      expect(response.sale.formattedStartDateTime).toEqual("Ended Mar 8")
      expect(response.sale.cascadingEndTimeIntervalMinutes).toEqual(null)
    })
  })

  describe("cascadingEndTimeFormattedStartDateTime", () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date("2022-03-08T12:33:37.000Z"))
    })
    const query = `
      {
        sale(id: "foo-foo") {
          cascadingEndTime {
            formattedStartDateTime
          }
        }
      }
    `

    it("returns a string including the correctly formatted start time when we the auction has not started", async () => {
      const response = await execute(query, {
        start_at: moment().add(3, "days"),
      })
      expect(response.sale.cascadingEndTime.formattedStartDateTime).toEqual(
        "Mar 11, 2022 • 12:33pm UTC"
      )
    })

    it("returns a string including the correctly formatted end time after the auction has ended", async () => {
      const response = await execute(query, {
        ended_at: moment().subtract(1, "days"),
      })
      expect(response.sale.cascadingEndTime.formattedStartDateTime).toEqual(
        "Closed Mar 7, 2022 • 12:33pm UTC"
      )
    })

    it("returns a string including the correctly formatted end when the auction has started", async () => {
      const response = await execute(query, {
        end_at: moment().subtract(1, "days"),
      })
      expect(response.sale.cascadingEndTime.formattedStartDateTime).toEqual(
        "Mar 7, 2022 • 12:33pm UTC"
      )
    })

    it("returns a string including the correctly formatted date when the live start at has yet to start and is a LAI", async () => {
      const response = await execute(query, {
        live_start_at: moment().add(1, "days"),
      })
      expect(response.sale.cascadingEndTime.formattedStartDateTime).toEqual(
        "Live Mar 9, 2022 • 12:33pm UTC"
      )
    })

    it("returns a in progress when the auction has started and is a LAI", async () => {
      const response = await execute(query, {
        live_start_at: moment().subtract(1, "days"),
      })
      expect(response.sale.cascadingEndTime.formattedStartDateTime).toEqual(
        "In progress"
      )
    })
  })

  describe("cascadingIntervalLabel", () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date("2022-03-08T12:33:37.000Z"))
    })
    const query = `
      {
        sale(id: "foo-foo") {
          cascadingEndTime {
            intervalLabel
          }
        }
      }
    `

    it("returns the correct string when cascading end time interval is set", async () => {
      const response = await execute(query, {
        cascading_end_time_interval_minutes: 2,
      })
      expect(response.sale.cascadingEndTime.intervalLabel).toEqual(
        "Lots close at 2-minute intervals"
      )
    })

    it("returns an empty string when the auction has ended", async () => {
      const response = await execute(query, {
        ended_at: moment().subtract(30, "minutes"),
        cascading_end_time_interval_minutes: 2,
      })
      expect(response.sale.cascadingEndTime.intervalLabel).toEqual(null)
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
          _.isEqual(params, { saleID: "foo-foo" })
            ? Promise.resolve([{ qualifiedForBidding: true }])
            : Promise.resolve([]),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(data.sale.registrationStatus.qualifiedForBidding).toEqual(true)
    })
  })

  describe("userNeedsIdentityVerification", () => {
    describe("when the sale doesn't requires identity verification", () => {
      const sale = {
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
    it("returns data from gravity", async () => {
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
        saleLoader: () => Promise.resolve(sale as any),
        saleArtworksLoader: () =>
          Promise.resolve({
            body: fill(Array(sale.eligible_sale_artworks_count), {
              artwork: {
                id: "some-id",
              },
            }),
            headers: {},
          } as any),
      }

      const data = await runAuthenticatedQuery(query, context)
      expect(data.sale.artworksConnection.pageInfo.hasNextPage).toBe(true)
      expect(data).toMatchSnapshot()
    })
  })
})
