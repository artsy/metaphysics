/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("SaleRegistrationsConnection", () => {
    it("returns the sales along with the registration status", () => {
      const query = `
        {
          me {
            saleRegistrationsConnection(first: 10) {
              edges {
                node {
                  isRegistered
                  sale {
                    name
                  }
                }
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
        salesLoaderWithHeaders: sinon.stub().returns(
          Promise.resolve({
            body: [
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
            ],
            headers: {
              "x-total-count": "10",
            },
          })
        ),
        meBiddersLoader,
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { saleRegistrationsConnection } }) => {
          expect(saleRegistrationsConnection.edges[0].node).toEqual({
            isRegistered: false,
            sale: { name: "Foo Sale" },
          })
          expect(saleRegistrationsConnection.edges[1].node).toEqual({
            isRegistered: true,
            sale: { name: "Bar Sale" },
          })
        }
      )
    })
  })
})
