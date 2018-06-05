/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

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
    endSale(input: {sale_id: "123"}) {
      sale {
        id
      }
    }
  }
  `

  const rootValue = {
    endSaleLoader: sinon.stub().returns(Promise.resolve(sale)),
  }

  it("ends the sale", async () => {
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        endSale: {
          sale: {
            id: "foo-foo",
          },
        },
      })
    })
  })
})
