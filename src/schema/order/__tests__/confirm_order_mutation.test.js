/* eslint-disable promise/always-return */
import { runAuthenticatedQuery, runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"
import orderJSON from "test/fixtures/gravity/sample_order.json"

describe("ConfirmOrderMutation", () => {
  describe("authenticated", () => {
    const mutation = `
      mutation {
        confirmOrder(input: {
          id: "fooid123"
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
    it("confirms the order", () => {
      const rootValue = { confirmOrderLoader: () => Promise.resolve(orderJSON) }

      return runAuthenticatedQuery(mutation, rootValue).then(data => {
        expect(data).toEqual({
          confirmOrder: {
            clientMutationId: null,
            order: sampleOrder,
          },
        })
      })
    })
  })

  xdescribe("unauthenticated", () => {
    it("confirms the order", () => {
      const mutation = `
        mutation {
          confirmOrder(input: {
            id: "fooid123",
            }
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

      const rootValue = { confirmOrderLoader: () => Promise.resolve(orderJSON) }

      return runQuery(mutation, rootValue).then(data => {
        expect(data).toEqual({
          confirmOrder: {
            clientMutationId: null,
            order: sampleOrder,
          },
        })
      })
    })

    it("requires a session_id", () => {
      const mutation = `
        mutation {
          confirmOrder(input: {
            id: "fooid123",
            reserve: true,
            telephone: "6073499419",
            shipping_address: {
              name: "sarah sarah",
              street: "401 Broadway, 25th Floor",
              city: "New York",
              region: "NY",
              country: "USA"
            }
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

      const rootValue = { confirmOrderLoader: () => Promise.resolve(orderJSON) }

      return runQuery(mutation, rootValue).catch(error => {
        expect(error.message).toEqual("This action requires a session_id.")
      })
    })
  })
})
