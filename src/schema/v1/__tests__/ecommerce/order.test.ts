/* eslint-disable promise/always-return */

import { runQuery } from "schema/v1/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let context

describe("Order query", () => {
  beforeEach(() => {
    const resolvers = { Query: { order: () => exchangeOrderJSON } }

    context = mockxchange(resolvers)
  })
  it("fetches order by id", () => {
    const query = gql`
      {
        order(id: "52dd3c2e4b8480091700027f") {
          ${OrderSellerFields}
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data!.order).toEqual(
        sampleOrder({
          fulfillments: true,
          includeCreditCard: true,
        })
      )
    })
  })
})
