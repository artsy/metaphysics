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

describe("Finalize Order Mutation", () => {
  beforeEach(() => {
    const typeDefs = fs.readFileSync(
      path.resolve(__dirname, "../../../data/exchange.graphql"),
      "utf8"
    )

    const resolvers = {
      Mutation: {
        finalizeOrder: () => ({
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
        inventory_id: "inventory note",
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
        finalizeOrder(input: {
            orderId: "111",
          }) {
            result {
              order {
                id
                code
                currencyCode
                state
                itemsTotalCents
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                transactionFeeCents
                updatedAt
                createdAt
                stateUpdatedAt
                stateExpiresAt
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
                        inventoryId
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
      expect(data.finalizeOrder.result.order).toEqual(sampleOrder)
    })
  })
})
