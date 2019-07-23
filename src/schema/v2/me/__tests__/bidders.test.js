/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Bidders", () => {
    it("returns bidder ids that the user is registered in sales for", () => {
      const query = `
        {
          me {
            bidders {
              id
            }
          }
        }
      `

      const response = () =>
        Promise.resolve([{ id: "Foo ID" }, { id: "Bar ID" }])
      const meBiddersLoader = jest.fn(response)

      return runAuthenticatedQuery(query, { meBiddersLoader }).then(
        ({ me: { bidders } }) => {
          expect(bidders).toEqual([{ id: "Foo ID" }, { id: "Bar ID" }])
        }
      )
    })

    it("returns bidder ids for the requested sale", () => {
      const query = `
        {
          me {
            bidders(sale_id: "the-fun-sale") {
              id
            }
          }
        }
      `
      const response = () =>
        Promise.resolve([{ id: "Foo ID" }, { id: "Bar ID" }])
      const meBiddersLoader = jest.fn(response)

      return runAuthenticatedQuery(query, { meBiddersLoader }).then(
        ({ me: { bidders } }) => {
          expect(meBiddersLoader).toBeCalledWith({ sale_id: "the-fun-sale" })
          expect(bidders).toEqual([{ id: "Foo ID" }, { id: "Bar ID" }])
        }
      )
    })
  })
})
