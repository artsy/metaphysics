/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/buy_order.json"
import { mockxchange } from "test/fixtures/exchange/mockxchange"
import gql from "lib/gql"
import { OrderBuyerFields } from "./order_fields"

let context

describe("Approve Order Mutation", () => {
  beforeEach(() => {
    const resolvers = {
      Mutation: {
        setPayment: () => ({
          orderOrError: { order: exchangeOrderJSON },
        }),
      },
    }

    context = mockxchange(resolvers)
  })
  it("sets order's payment information", () => {
    const mutation = gql`
      mutation {
        setOrderPayment(input: {
            orderId: "111",
            creditCardId: "1231-1232-4343-4343"
          }) {
            orderOrError {
              ... on OrderWithMutationSuccess {
                order {
                  ${OrderBuyerFields}
                }
              }
              ... on OrderWithMutationFailure {
                error {
                  type
                  code
                  data
                }
              }
            }
          }
        }
    `

    return runQuery(mutation, context).then((data) => {
      expect(data!.setOrderPayment.orderOrError.order).toEqual(
        sampleOrder({ includeCreditCard: true })
      )
    })
  })
})
