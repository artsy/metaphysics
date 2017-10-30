import moment from "moment"
import schema from "schema"
import { fill } from "lodash"
import { runQuery, runAuthenticatedQuery } from "test/utils"

describe("Sale type", () => {
  const Sale = schema.__get__("Sale")

  const sale = {
    id: "foo-foo",
    _id: "123",
    currency: "$",
    is_auction: true,
  }

  beforeEach(() => {
    Sale.__Rewire__("gravity", sinon.stub().returns(Promise.resolve(sale)))
  })

  afterEach(() => {
    Sale.__ResetDependency__("gravity")
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

    it("returns the correct values when the sale is closed", () => {
      sale.auction_state = "closed"
      return runQuery(query).then(data => {
        expect(data).toEqual({
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
    })

    it("returns the correct values when the sale is in preview mode", () => {
      sale.auction_state = "preview"
      return runQuery(query).then(data => {
        expect(data).toEqual({
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
    })

    it("returns the correct values when the sale is open", () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().add(2, "days")
      return runQuery(query).then(data => {
        expect(data).toEqual({
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
    })

    it("returns the correct values when the sale is in live mode", () => {
      sale.auction_state = "open"
      sale.live_start_at = moment().subtract(2, "days")
      return runQuery(query).then(data => {
        expect(data).toEqual({
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
    })

    it("returns the correct values when sale registration is closed", () => {
      sale.auction_state = "open"
      sale.registration_ends_at = moment().subtract(2, "days")
      return runQuery(query).then(data => {
        expect(data).toEqual({
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
  })

  describe("sale_artworks_connection", () => {
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
        saleArtworksLoader: () => Promise.resolve(fill(Array(sale.eligible_sale_artworks_count), { id: "some-id" })),
      }

      return runAuthenticatedQuery(query, rootValue).then(data => {
        expect(data).toMatchSnapshot()
      })
    })
  })

  describe("buyers premium", () => {
    it("returns a valid object even if the sale has no buyers premium", () => {
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

      return runQuery(query).then(data => {
        expect(data).toEqual({
          sale: {
            _id: "123",
            buyers_premium: null,
          },
        })
      })
    })

    it("returns a valid object if there is a complete buyers premium", () => {
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

      return runQuery(query).then(data => {
        expect(data).toEqual({
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
  })

  describe("associated sale", () => {
    const query = `
      {
        sale(id: "foo-foo") {
          _id
          associated_sale{
            id
          }
        }
      }
    `

    it("does not error, but returns null for associated sale", () => {
      return runQuery(query).then(data => {
        expect(data).toEqual({
          sale: {
            _id: "123",
            associated_sale: null,
          },
        })
      })
    })

    it("returns the associated sale", () => {
      sale.associated_sale = {
        id: "foo-foo",
      }
      return runQuery(query).then(data => {
        expect(data).toEqual({
          sale: {
            _id: "123",
            associated_sale: {
              id: "foo-foo",
            },
          },
        })
      })
    })
  })
})
