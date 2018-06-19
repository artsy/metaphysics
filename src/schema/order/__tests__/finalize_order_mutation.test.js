/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import orderJSON from "test/fixtures/gravity/sample_order.json"

describe("FinalizeOrderMutation", () => {
  describe("authenticated", () => {
    const mutation = `
      mutation {
        finalizeOrder(input: {
          id: "fooid123"
        }) {
          order {
            id
            telephone
            email
            line_items {
              quantity
              artwork {
                id
                title
                artist(shallow: true) {
                  name
                }
              }
              partner {
                id
              }
              partner_location {
                id
              }
              shipping_note
              sale_conditions_url
            }
            item_total {
              amount
              display
            }
            shipping_address {
              name
              street
              city
              region
              postal_code
              country
            }
          }
        }
      }
    `
    it("finalizes the order", () => {
      const rootValue = {
        orderLoader: () => Promise.resolve({ body: orderJSON }),
        finalizeOrderLoader: () => Promise.resolve("fooid123"),
      }

      return runAuthenticatedQuery(mutation, rootValue).then(data => {
        expect(data).toEqual({
          finalizeOrder: {
            order: sampleOrder,
          },
        })
      })
    })
  })
})
