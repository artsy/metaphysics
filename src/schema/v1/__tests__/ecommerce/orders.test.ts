/* eslint-disable promise/always-return */

import { runQuery } from "schema/v1/test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrdersJSON from "test/fixtures/exchange/orders.json"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let context

describe("Orders query", () => {
  beforeEach(() => {
    const resolvers = { Query: { orders: () => exchangeOrdersJSON } }
    context = mockxchange(resolvers)
  })
  it("fetches orders by seller id", () => {
    const query = gql`
      {
        orders(sellerId: "581b45e4cd530e658b000124") {
          totalPages
          totalCount
          edges {
            node {
              ${OrderSellerFields}
            }
          }
          pageCursors {
            first {
              cursor
              isCurrent
              page
            }
            last {
              cursor
              isCurrent
              page
            }
            around {
              cursor
              isCurrent
              page
            }
            previous {
              cursor
              isCurrent
              page
            }
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data!.orders.totalCount).toEqual(100)
      expect(data!.orders.totalPages).toEqual(10)
      expect(data!.orders.pageCursors).not.toBeNull
      expect(data!.orders.pageCursors.first.page).toEqual(1)
      expect(data!.orders.pageCursors.last.page).toEqual(10)
      expect(data!.orders.pageCursors.around.length).toEqual(3)
      expect(data!.orders.pageCursors.previous.page).toEqual(4)
      expect(data!.orders.totalPages).toEqual(10)
      expect(data!.orders.edges[0].node).toEqual(sampleOrder())
    })
  })
})
