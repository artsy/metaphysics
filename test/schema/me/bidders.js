import { runAuthenticatedQuery } from "test/utils"
import gravity from "lib/loaders/legacy/gravity"

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

      const gravBiddersAPICall = jest.fn(() => Promise.resolve([{ id: "Foo ID" }, { id: "Bar ID" }]))
      gravity.with.mockImplementationOnce(() => gravBiddersAPICall)

      return runAuthenticatedQuery(query).then(({ me: { bidders } }) => {
        expect(gravBiddersAPICall).toBeCalledWith("me/bidders", {})
        expect(bidders).toEqual([{ id: "Foo ID" }, { id: "Bar ID" }])
      })
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

      const gravBiddersAPICall = jest.fn(() => Promise.resolve([{ id: "Foo ID" }, { id: "Bar ID" }]))
      gravity.with.mockImplementationOnce(() => gravBiddersAPICall)

      return runAuthenticatedQuery(query).then(({ me: { bidders } }) => {
        expect(gravBiddersAPICall).toBeCalledWith("me/bidders", { sale_id: "the-fun-sale" })
        expect(bidders).toEqual([{ id: "Foo ID" }, { id: "Bar ID" }])
      })
    })
  })
})
