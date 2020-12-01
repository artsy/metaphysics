/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe.skip("Me", () => {
  describe("SaleRegistrations", () => {
    it("returns the sales along with the registration status", () => {
      const query = `
        {
          me {
            saleRegistrations {
              isRegistered
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

      const context = {
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

      return runAuthenticatedQuery(query, context).then(
        ({ me: { saleRegistrations } }) => {
          expect(saleRegistrations).toEqual([
            { isRegistered: false, sale: { name: "Foo Sale" } },
            { isRegistered: true, sale: { name: "Bar Sale" } },
          ])
        }
      )
    })
  })
})
