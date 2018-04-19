import { runAuthenticatedQuery, runQuery } from "test/utils"
import exampleOrderResult from "test/fixtures/results/submit_order_mutation"
import orderJSON from "test/fixtures/gravity/order.json"

describe("Me", () => {
  describe("SubmitOrderMutation", () => {
    describe("authenticated", () => {
      const mutation = `
        mutation {
          submitOrder(input: {
            id: "fooid123",
            credit_card_id: "cc123"
          }) {
            clientMutationId
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
                edition_set {
                  id
                  is_for_sale
                  is_sold
                  price
                  is_acquireable
                  edition_of
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
      it("updates the order", () => {
        const rootValue = {
          submitOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runAuthenticatedQuery(mutation, rootValue).then(data => {
          expect(data).toEqual(exampleOrderResult)
        })
      })
    })

    describe("unauthenticated", () => {
      it("updates the order", () => {
        const mutation = `
          mutation {
            submitOrder(input: {
              id: "fooid123",
              credit_card_id: "cc123",
              session_id: "123456789"
            }) {
              clientMutationId
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
                  edition_set {
                    id
                    is_for_sale
                    is_sold
                    price
                    is_acquireable
                    edition_of
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

        const rootValue = {
          submitOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runQuery(mutation, rootValue).then(data => {
          expect(data).toEqual(exampleOrderResult)
        })
      })

      it("requires a session_id", () => {
        const mutation = `
          mutation {
            submitOrder(input: {
              id: "fooid123",
              credit_card_id: "cc123"
            }) {
              clientMutationId
              order {
                id
                telephone
                email
                item_total {
                  amount
                  display
                }
              }
            }
          }
        `

        const rootValue = {
          submitOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runQuery(mutation, rootValue).catch(error => {
          expect(error.message).toEqual("This action requires a session_id.")
        })
      })
    })
  })
})
