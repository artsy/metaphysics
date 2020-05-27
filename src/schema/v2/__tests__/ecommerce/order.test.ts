/* eslint-disable promise/always-return */

import { runQuery } from "schema/v2/test/utils"
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

  // FIXME: Fails due to unexpected end of JSON
  it.skip("fetches order by id", async () => {
    const query = gql`
      {
        commerceOrder(id: "52dd3c2e4b8480091700027f") {
          ${OrderSellerFields}
        }
      }
    `

    await runQuery(query, context).then((data) => {
      console.log("order", data.order)
      expect(data!.order).toEqual(
        sampleOrder({
          fulfillments: true,
          includeCreditCard: true,
        })
      )
    })
  })
})
