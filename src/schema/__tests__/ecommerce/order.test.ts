/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let rootValue

describe("Order query", () => {
  it("fetches order by id", () => {
    const resolvers = { Query: { order: () => exchangeOrderJSON } }
    rootValue = mockxchange(resolvers)

    const query = gql`
      {
        order(id: "52dd3c2e4b8480091700027f") {
          ${OrderSellerFields}
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data!.order).toEqual(sampleOrder(true, true, true))
    })
  })

  it("handles orders with 0 shipping and tax", () => {
    const testOrder = {
      id: "foo123",
      code: "foofoo",
      shippingTotalCents: 0,
      taxTotalCents: 0,
      itemsTotalCents: 12000,
      currencyCode: "$",
      state: "PENDING",
      seller: { id: "111", __typename: "Partner" },
      buyer: { id: "111", __typename: "User" },
      updatedAt: "2018-07-03 17:57:47 UTC",
      createdAt: "2018-07-03 17:57:47 UTC",
    }
    const resolvers = {
      Query: {
        order: () => testOrder,
      },
    }
    rootValue = mockxchange(resolvers)

    const query = gql`
      {
        order(id: "52dd3c2e4b8480091700027f") {
          id
          shippingTotal(precision: 2)
          taxTotal(precision: 2)
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data!.order).toEqual({
        id: "foo123",
        shippingTotal: "$0.00",
        taxTotal: "$0.00",
      })
    })
  })

  it("handles orders with null shipping and tax", () => {
    const testOrder = {
      id: "foo123",
      code: "foofoo",
      shippingTotalCents: null,
      taxTotalCents: null,
      itemsTotalCents: 12000,
      currencyCode: "$",
      state: "PENDING",
      seller: { id: "111", __typename: "Partner" },
      buyer: { id: "111", __typename: "User" },
      updatedAt: "2018-07-03 17:57:47 UTC",
      createdAt: "2018-07-03 17:57:47 UTC",
    }
    const resolvers = { Query: { order: () => testOrder } }
    rootValue = mockxchange(resolvers)

    const query = gql`
      {
        order(id: "52dd3c2e4b8480091700027f") {
          id
          shippingTotal(precision: 2)
          taxTotal(precision: 2)
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data!.order).toEqual({
        id: "foo123",
        shippingTotal: null,
        taxTotal: null,
      })
    })
  })
})
