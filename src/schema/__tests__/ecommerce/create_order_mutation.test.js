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

describe("Create Order Mutation", () => {
  beforeEach(() => {
    const typeDefs = fs.readFileSync(
      path.resolve(__dirname, "../../../data/exchange.graphql"),
      "utf8"
    )

    const resolvers = {
      Mutation: {
        createOrder: () => ({
          order: exchangeOrderJSON,
          errors: [],
        }),
      },
    }

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

    const authenticatedArtworkLoader = sinon.stub().returns(
      Promise.resolve({
        id: "hubert-farnsworth-smell-o-scope",
        title: "Smell-O-Scope",
        display: "Smell-O-Scope (2017)",
      })
    )

    const accessToken = "open-sesame"

    rootValue = {
      exchangeSchema,
      partnerLoader,
      userByIDLoader,
      authenticatedArtworkLoader,
      accessToken,
    }
  })
  it("fetches order by id", () => {
    const mutation = `
      mutation {
        createOrder(input: {
            partnerId: "111",
            userId: "111",
            currencyCode: "usd",
            lineItems: [{
              artworkId: "111",
              quantity: 1
              priceCents: 300000
            }]
          }) {
            result {
              order {
                id
                code
                currencyCode
                itemsTotalCents
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                transactionFeeCents
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
              errors
            }
          }
        }
    `

    return runQuery(mutation, rootValue).then(data => {
      expect(data.createOrder.result.order).toEqual(sampleOrder)
    })
  })
})
