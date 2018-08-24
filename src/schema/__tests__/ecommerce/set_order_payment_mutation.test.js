/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import gql from "lib/gql"
import { OrderSellerFields } from "./order_fields"

let rootValue

describe("Approve Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        setPayment: () => ({
          order: exchangeOrderJSON,
          errors: [],
        }),
      },
    }

    rootValue = mockxchange(resolvers)
  })
  it("sets order's payment information", () => {
    const mutation = gql`
      mutation {
        setOrderPayment(input: {
            orderId: "111",
            creditCardId: "1231-1232-4343-4343"
          }) {
            result {
              order {
                ${OrderSellerFields}
              }
            errors
            }
          }
        }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(data.setOrderPayment.result.order).toEqual(
        sampleOrder(true, false)
      )
    })
  })
})
