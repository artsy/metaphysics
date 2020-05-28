/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("End sale mutation", () => {
  const sale = {
    id: "foo-foo",
    _id: "123",
    currency: "$",
    is_auction: true,
    increment_strategy: "default",
  }

  const query = `
  mutation {
    endSale(input: {saleID: "123"}) {
      sale {
        slug
      }
    }
  }
  `

  const context = {
    endSaleLoader: sinon.stub().returns(Promise.resolve(sale)),
  }

  it("ends the sale", async () => {
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(data).toEqual({
        endSale: {
          sale: {
            slug: "foo-foo",
          },
        },
      })
    })
  })
})
