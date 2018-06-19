/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("SaleRegistrations", () => {
    it("returns the sales along with the registration status", () => {
      const query = `
        {
          me {
            sale_registrations {
              is_registered
              sale {
                name
              }
            }
          }
        }
      `
      const meBiddersLoader = jest.fn()
      meBiddersLoader
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ id: "bidder-id" }]))

      const rootValue = {
        salesLoader: sinon.stub().returns(
          Promise.resolve([
            {
              name: "Foo Sale",
              currency: "$",
              is_auction: true,
            },
            {
              name: "Bar Sale",
              currency: "$",
              is_auction: true,
            },
          ])
        ),
        meBiddersLoader,
      }

      return runAuthenticatedQuery(query, rootValue).then(
        ({ me: { sale_registrations } }) => {
          expect(sale_registrations).toEqual([
            { is_registered: false, sale: { name: "Foo Sale" } },
            { is_registered: true, sale: { name: "Bar Sale" } },
          ])
        }
      )
    })
  })
})
