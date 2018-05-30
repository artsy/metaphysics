import moment from "moment"
import { fill } from "lodash"
import { runQuery, runAuthenticatedQuery } from "test/utils"

describe("Sale type", () => {
  const sale = {
    id: "foo-foo",
    _id: "123",
    currency: "$",
    is_auction: true,
    increment_strategy: "default",
  }

  const execute = async (query, gravityResponse = sale, rootValue = {}) =>
    await runQuery(query, {
      saleLoader: () => Promise.resolve(gravityResponse),
      ...rootValue,
    })

  describe("auction state", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          _id
          is_preview
          is_open
          is_live_open
          is_closed
          is_registration_closed
          auction_state
          status
        }
      }
    `

    it("returns the correct values when the sale is closed", async () => {
      sale.auction_state = "closed"
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          is_preview: false,
          is_open: false,
          is_live_open: false,
          is_closed: true,
          is_registration_closed: false,
          auction_state: "closed",
          status: "closed",
        },
      })
    })

    it("returns the correct values when the sale is in preview mode", async () => {
      sale.auction_state = "preview"
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          is_preview: true,
          is_open: false,
          is_live_open: false,
          is_closed: false,
          is_registration_closed: false,
          auction_state: "preview",
          status: "preview",
        },
      })
    })

    it("returns the correct values when the sale is open", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().add(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          is_preview: false,
          is_open: true,
          is_live_open: false,
          is_closed: false,
          is_registration_closed: false,
          auction_state: "open",
          status: "open",
        },
      })
    })

    it("returns the correct values when the sale is in live mode", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().subtract(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          is_preview: false,
          is_open: true,
          is_live_open: true,
          is_closed: false,
          is_registration_closed: false,
          auction_state: "open",
          status: "open",
        },
      })
    })

    it("returns the correct values when sale registration is closed", async () => {
      sale.auction_state = "open"
      sale.registration_ends_at = moment().subtract(2, "days")
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          is_preview: false,
          is_open: true,
          is_live_open: true,
          is_closed: false,
          is_registration_closed: true,
          auction_state: "open",
          status: "open",
        },
      })
    })
  })

  describe("live_url_if_open", () => {
    it("returns live_url_if_open if is_live_open", async () => {
      sale.auction_state = "open"
      sale.is_live_open = true
      sale.live_start_at = moment().subtract(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            live_url_if_open
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          live_url_if_open: "https://live.artsy.net/foo-foo",
        },
      })
    })

    it("returns live_url_if_open if live_start_at < now", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().subtract(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            live_url_if_open
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          live_url_if_open: "https://live.artsy.net/foo-foo",
        },
      })
    })

    it("returns null if not is_live_open", async () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().add(2, "days")
      const query = `
        {
          sale(id: "foo-foo") {
            live_url_if_open
          }
        }
      `
      expect(await execute(query)).toEqual({
        sale: {
          live_url_if_open: null,
        },
      })
    })
  })

  describe("sale_artworks_connection", async () => {
    it("returns data from gravity", () => {
      const query = `
        {
          sale(id: "foo-foo") {
            sale_artworks_connection(first: 10) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      sale.eligible_sale_artworks_count = 20

      const rootValue = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: sinon.stub().returns(
          Promise.resolve({
            body: fill(Array(sale.eligible_sale_artworks_count), {
              id: "some-id",
            }),
          })
        ),
      }

      return runAuthenticatedQuery(query, rootValue).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })

  describe("sale_artworks", () => {
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

    it("returns data from gravity", async () => {
      const query = `
        {
          sale(id: "foo-foo") {
            sale_artworks {
              bid_increments
            }
          }
        }
      `

      const rootValue = {
        saleLoader: () => Promise.resolve(sale),
        saleArtworksLoader: sinon
          .stub()
          .returns(Promise.resolve({ body: saleArtworks })),
        incrementsLoader: () =>
          Promise.resolve([
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
          ]),
      }

      return runAuthenticatedQuery(query, rootValue).then(data => {
        expect(data.sale.sale_artworks[0].bid_increments.slice(0, 5)).toEqual([
          400000,
          410000,
          420000,
          430000,
          440000,
        ])
        expect(data.sale.sale_artworks[1].bid_increments.slice(0, 5)).toEqual([
          20000,
          25000,
          30000,
          35000,
          40000,
        ])
      })
    })
  })

  describe("buyers premium", () => {
    it("returns a valid object even if the sale has no buyers premium", async () => {
      const query = `
        {
          sale(id: "foo-foo") {
            _id
            buyers_premium {
              amount
              cents
            }
          }
        }
      `

      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          buyers_premium: null,
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
            _id
            buyers_premium {
              amount
              cents
            }
          }
        }
      `

      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          buyers_premium: [
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
          _id
          associated_sale {
            id
          }
        }
      }
    `

    it("does not error, but returns null for associated sale", async () => {
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          associated_sale: null,
        },
      })
    })

    it("returns the associated sale", async () => {
      sale.associated_sale = {
        id: "foo-foo",
      }
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          associated_sale: {
            id: "foo-foo",
          },
        },
      })
    })
  })

  describe("promoted sale", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          _id
          promoted_sale {
            id
          }
        }
      }
    `

    it("does not error, but returns null for promoted sale", async () => {
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          promoted_sale: null,
        },
      })
    })

    it("returns the promoted sale", async () => {
      sale.promoted_sale = {
        id: "foo-foo",
      }
      expect(await execute(query)).toEqual({
        sale: {
          _id: "123",
          promoted_sale: {
            id: "foo-foo",
          },
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
        "In Progress",
      ],
      [
        {
          auction_state: "open",
          live_start_at: moment().subtract(2, "days"),
          registration_ends_at: moment().subtract(3, "days"),
        },
        "In Progress",
      ],
      [
        {
          live_start_at: moment().add(10, "minutes"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "Live in 10 minutes",
      ],
      [
        {
          live_start_at: moment().add(20, "minutes"),
          registration_ends_at: moment().subtract(2, "days"),
        },
        "Live in 20 minutes",
      ],
      [
        {
          live_start_at: moment().add(20, "days"),
          registration_ends_at: moment().add(10, "minutes"),
        },
        `Register by\n${moment(moment().add(10, "minutes")).format("ha")}`,
      ],
      [
        {
          live_start_at: moment().add(30, "days"),
          registration_ends_at: moment().add(10, "days"),
        },
        `Register by\n${moment(moment().add(10, "days")).format("MMM D, ha")}`,
      ],
      [
        {
          start_at: moment().add(10, "minutes"),
          end_at: moment().add(2, "days"),
        },
        "10 minutes left",
      ],
      [
        {
          start_at: moment().add(20, "minutes"),
          end_at: moment().add(2, "days"),
        },
        "20 minutes left",
      ],
      [
        {
          start_at: moment().add(10, "hours"),
          end_at: moment().add(2, "days"),
        },
        "10 hours left",
      ],
      [
        {
          start_at: moment().add(20, "hours"),
          end_at: moment().add(2, "days"),
        },
        "20 hours left",
      ],
      [
        {
          start_at: moment().add(2, "days"),
          end_at: moment().add(4, "days"),
        },
        "2 days left",
      ],
      [
        {
          start_at: moment().add(5, "days"),
          end_at: moment().add(10, "days"),
        },
        "5 days left",
      ],
      [
        {
          start_at: moment().add(20, "days"),
          end_at: moment().add(30, "days"),
        },
        `Ends on ${moment(moment().add(30, "days")).format("MMM D, ha")}`,
      ],
      [
        {
          start_at: moment().add(30, "days"),
          end_at: moment().add(40, "days"),
        },
        `Ends on ${moment(moment().add(40, "days")).format("MMM D, ha")}`,
      ],
    ]

    const query = `
      {
        sale(id: "foo-foo") {
          display_timely_at
        }
      }
    `

    it("returns proper labels", async () => {
      const results = await Promise.all(
        testData.map(
          async ([input]) =>
            await execute(query, {
              currency: "$",
              is_auction: true,
              ...input,
            })
        )
      )

      const labels = testData.map(test => test[1])

      results.forEach(({ sale: { display_timely_at } }, index) => {
        expect(display_timely_at).toEqual(labels[index])
      })
    })
  })
})
