import { runAuthenticatedQuery, runQuery } from "test/utils"
import exampleOrder from "./__fixtures__/example_order"
import exampleOrderResult from "./__fixtures__/example_order_result"

describe("Me", () => {
  describe("UpdateOrderMutation", () => {
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
              code
              state
              notes
              total {
                amount
                cents
                display
              }
              token
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
                price {
                  amount
                  cents
                  display
                }
                subtotal {
                  amount
                  cents
                  display
                }
                tax_cents
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
              tax_total {
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
                usps_address1
                usps_city
                usps_state
                usps_zip
              }
            }
          }
        }
      `
      it("updates the order", () => {
        const rootValue = {
          updateOrderLoader: () => Promise.resolve(exampleOrder),
        }

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
              code
              state
              notes
              total {
                amount
                cents
                display
              }
              token
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
                price {
                  amount
                  cents
                  display
                }
                subtotal {
                  amount
                  cents
                  display
                }
                tax_cents
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
              tax_total {
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
                usps_address1
                usps_city
                usps_state
                usps_zip
              }
            }
          }
        }
      `
      it("updates the order", () => {
        const rootValue = {
          updateOrderLoader: () => Promise.resolve(exampleOrder),
        }

        return runQuery(mutation, rootValue).then(data => {
          expect(data).toEqual(exampleOrderResult)
        })
      })
    })
  })
})
