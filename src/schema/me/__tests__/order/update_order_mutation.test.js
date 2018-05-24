import { runAuthenticatedQuery, runQuery } from "test/utils"
import exampleOrderResult from "test/fixtures/results/update_order_mutation"
import orderJSON from "test/fixtures/gravity/order.json"

describe("Me", () => {
  describe("UpdateOrderMutation", () => {
    describe("authenticated", () => {
      const mutation = `
        mutation {
          updateOrder(input: {
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
          updateOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runAuthenticatedQuery(mutation, rootValue).then((data) => {
          expect(data).toEqual(exampleOrderResult)
        })
      })
    })

    describe("unauthenticated", () => {
      it("updates the order", () => {
        const mutation = `
          mutation {
            updateOrder(input: {
              id: "fooid123",
              reserve: true,
              telephone: "6073499419",
              session_id: "session123",
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
          updateOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runQuery(mutation, rootValue).then((data) => {
          expect(data).toEqual(exampleOrderResult)
        })
      })

      it("requires a session_id", () => {
        const mutation = `
          mutation {
            updateOrder(input: {
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

        const rootValue = {
          updateOrderLoader: () => Promise.resolve(orderJSON),
        }

        return runQuery(mutation, rootValue).catch((error) => {
          expect(error.message).toEqual("This action requires a session_id.")
        })
      })
    })
  })
})
