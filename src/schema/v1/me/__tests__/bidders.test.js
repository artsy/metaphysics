/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"

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

    it("resolves user and sale", () => {
      const user = {
        id: "user123",
        name: "Lucille Bluth",
        email: "lucille@gmail.com",
      }

      const sale = {
        id: "shared-live-mocktion",
        name: "Shared Live Mocktion",
      }

      const bidders = [
        {
          id: "bidder ID 1",
          user: {
            id: "user123",
          },
          sale: {
            id: "shared-live-mocktion",
          },
        },
      ]

      const context = {
        meBiddersLoader: jest.fn(() => Promise.resolve(bidders)),
        userByIDLoader: jest.fn(() => Promise.resolve(user)),
        saleLoader: jest.fn(() => Promise.resolve(sale)),
      }

      const query = `
        {
          me {
            bidders {
              user {
                name
                email
              }
              sale {
                name
              }
            }
          }
        }
      `

      return runAuthenticatedQuery(query, context).then(
        ({ me: { bidders } }) => {
          expect(bidders).toEqual([
            {
              user: {
                name: "Lucille Bluth",
                email: "lucille@gmail.com",
              },
              sale: {
                name: "Shared Live Mocktion",
              },
            },
          ])
        }
      )
    })
  })
})
