/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"

const exampleOrder = {
  id: "fooid123",
  telephone: "6073499419",
  email: "",
  line_items: [
    {
      quantity: 1,
      artwork: {
        id: "hubert-farnsworth-good-news",
        title: "Good News",
        artist: {
          name: "Hubert Farnsworth",
        },
      },
      partner: null,
      partner_location: null,
      shipping_note: null,
      sale_conditions_url: null,
    },
  ],
  shipping_address: {
    name: "sarah sarah",
    street: "401 Broadway, 25th Floor",
    city: "New York",
    region: "NY",
    postal_code: null,
    country: null,
  },
}

describe("Order type", () => {
  it("fetches order by id", () => {
    const query = `
      {
        order(id: "52dd3c2e4b8480091700027f") {
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
    `

    const rootValue = {
      orderLoader: jest.fn().mockReturnValueOnce(
        Promise.resolve({
          body: exampleOrder,
        })
      ),
    }

    return runQuery(query, rootValue).then(data => {
      expect(rootValue.orderLoader).toBeCalledWith("52dd3c2e4b8480091700027f")
      expect(data.order).toEqual(exampleOrder)
    })
  })
})
