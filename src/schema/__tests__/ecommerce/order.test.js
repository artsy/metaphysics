/* eslint-disable promise/always-return */

import { runQuery } from "test/utils"
import {
  makeExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
} from "graphql-tools"
import fs from "fs"
import path from "path"
import sampleOrder from "test/fixtures/results/sample_order"
import exchangeOrderJSON from "test/fixtures/exchange/order.json"

let rootValue

describe("Order type", () => {
  beforeEach(() => {
    const typeDefs = fs.readFileSync(
      path.resolve(__dirname, "../../../data/exchange.graphql"),
      "utf8"
    )

    const resolvers = { Query: { order: () => exchangeOrderJSON } }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    // namespace schema similar to src/lib/stitching/exchange/schema.ts
    const exchangeSchema = transformSchema(schema, [
      new RenameTypes(name => {
        return `Ecommerce${name}`
      }),
      new RenameRootFields((_operation, name) => `ecommerce_${name}`),
    ])

    const partnerLoader = sinon.stub().returns(
      Promise.resolve({
        id: "111",
        name: "Subscription Partner",
      })
    )

    const userByIDLoader = sinon.stub().returns(
      Promise.resolve({
        id: "111",
        email: "bob@ross.com",
      })
    )

    const artworkLoader = sinon.stub().returns(
      Promise.resolve({
        id: "hubert-farnsworth-smell-o-scope",
        title: "Smell-O-Scope",
        display: "Smell-O-Scope (2017)",
      })
    )

    rootValue = { exchangeSchema, partnerLoader, userByIDLoader, artworkLoader }
  })
  it("fetches order by id", () => {
    const query = `
      {
        order(id: "52dd3c2e4b8480091700027f") {
          id
          code
          currencyCode
          itemsTotalCents
          state
          partner {
            id
            name
          }
          user {
            id
            email
          }
          lineItems {
            edges {
              node {
                artwork {
                  id
                  title
                }
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data.order).toEqual(sampleOrder)
    })
  })
})
