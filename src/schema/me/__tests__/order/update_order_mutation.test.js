import { runAuthenticatedQuery, runQuery } from "test/utils"
import { readFileSync } from "fs"
import { resolve } from "path"
import exampleOrderResult from "test/fixtures/results/order_mutation"

describe("Me", () => {
  describe("UpdateOrderMutation", () => {
    const ordersPath = resolve(
      "src",
      "test",
      "fixtures",
      "gravity",
      "order.json"
    )
    const order = JSON.parse(readFileSync(ordersPath, "utf8"))
    console.log("HIIII", exampleOrderResult)

    describe("authenticated", () => {
      const mutation = `
        mutation {
          updateOrder(input: {
            id: "fooid123",
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
        const rootValue = { updateOrderLoader: () => Promise.resolve(order) }

        return runAuthenticatedQuery(mutation, rootValue).then(data => {
          expect(data).toEqual(exampleOrderResult)
        })
      })
    })

    describe("unauthenticated", () => {
      const mutation = `
        mutation {
          updateOrder(input: {
            id: "fooid123",
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
      it("updates the order", () => {
        const rootValue = { updateOrderLoader: () => Promise.resolve(order) }

        return runQuery(mutation, rootValue).then(data => {
          expect(data).toEqual(exampleOrderResult)
        })
      })
    })
  })
})
