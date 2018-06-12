/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import { sampleOrder } from "test/fixtures/results/sample_order"

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
          body: sampleOrder,
        })
      ),
    }

    return runQuery(query, rootValue).then(data => {
      expect(rootValue.orderLoader).toBeCalledWith("52dd3c2e4b8480091700027f")
      expect(data.order).toEqual(sampleOrder)
    })
  })
})
