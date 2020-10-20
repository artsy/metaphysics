/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("Bidders", () => {
    it("returns bidder ids that the user is registered in sales for", () => {
      const query = `
        {
          me {
            bidders {
              internalID
            }
          }
        }
      `

      const response = () =>
        Promise.resolve([{ id: "Foo ID" }, { id: "Bar ID" }])
      const meBiddersLoader = jest.fn(response)

      return runAuthenticatedQuery(query, { meBiddersLoader }).then(
        ({ me: { bidders } }) => {
          expect(bidders).toEqual([
            { internalID: "Foo ID" },
            { internalID: "Bar ID" },
          ])
        }
      )
    })

    it("returns bidder ids for the requested sale", () => {
      const query = `
        {
          me {
            bidders(saleID: "the-fun-sale") {
              internalID
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
          expect(bidders).toEqual([
            { internalID: "Foo ID" },
            { internalID: "Bar ID" },
          ])
        }
      )
    })

    it("calls the gravity endpoint with the `filter` param if included", () => {
      const query = `
        {
          me {
            bidders(active: true) {
              internalID
            }
          }
        }
      `
      const response = () => Promise.resolve([])
      const meBiddersLoader = jest.fn(response)

      return runAuthenticatedQuery(query, { meBiddersLoader }).then(
        ({ me: { bidders } }) => {
          expect(meBiddersLoader).toBeCalledWith(
            expect.objectContaining({ active: true })
          )
        }
      )
    })
  })
})
