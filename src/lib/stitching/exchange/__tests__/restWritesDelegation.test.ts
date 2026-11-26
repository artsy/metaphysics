import { Response } from "node-fetch"
import gql from "lib/gql"

jest.mock("lib/stitching/exchange/link")

/**
 * The REST-backed root mutations are only added to the schema when
 * EXCHANGE_REST_WRITES is on when the schema is built. Runs the production
 * schema, built with the flag off and on.
 */
describe("Exchange root mutations in the production schema", () => {
  // Each schema gets its own module registry (and so its own config, graphql-js
  // and mocked Exchange link). Built here, as the mocked link adds a hook.
  const schemaBuiltWithFlag = (flag: boolean) => {
    let run
    jest.isolateModules(() => {
      const config = require("config").default
      config.EXCHANGE_REST_WRITES = flag
      const { graphql } = require("graphql")
      const { schema } = require("schema/v2")
      const { mockFetch } = require("lib/stitching/exchange/link")

      // Returns the request Exchange GraphQL received, if any
      run = async (source: string, contextValue = {}, variableValues = {}) => {
        mockFetch.mockClear()
        mockFetch.mockImplementation(() =>
          Promise.resolve(new Response(JSON.stringify({ data: {} })))
        )
        await graphql({ schema, source, contextValue, variableValues })
        const call = mockFetch.mock.calls[0]
        return call && JSON.parse(call[1].body)
      }
    })
    return run
  }

  const runFlagOff = schemaBuiltWithFlag(false)
  const runFlagOn = schemaBuiltWithFlag(true)

  const createOrder = (selection: string) => gql`
    mutation {
      commerceCreateOrderWithArtwork(input: { artworkId: "artwork-id" }) {
        orderOrError {
          ... on CommerceOrderWithMutationSuccess {
            order {
              ${selection}
            }
          }
        }
      }
    }
  `

  // The fallback names its variables differently from the stitched root field
  const withoutVariableNames = (request) =>
    JSON.parse(
      JSON.stringify(request).replace(/_commerce[A-Za-z]+_input/g, "input")
    )

  it("keeps the stitched root mutation when the flag is off", async () => {
    const meOrderCreateLoader = jest.fn()

    const request = await runFlagOff(createOrder("internalID"), {
      meOrderCreateLoader,
    })

    expect(meOrderCreateLoader).not.toHaveBeenCalled()
    expect(request.query).toContain(
      "commerceCreateOrderWithArtwork:createOrderWithArtwork"
    )
  })

  it("serves the mutation from REST when the flag is on", async () => {
    const meOrderCreateLoader = jest
      .fn()
      .mockResolvedValue({ id: "order-id", mode: "buy" })

    const request = await runFlagOn(createOrder("internalID"), {
      meOrderCreateLoader,
    })

    expect(meOrderCreateLoader).toHaveBeenCalled()
    expect(request).toBeUndefined()
  })

  it.each([
    [
      "an unmapped field",
      createOrder("internalID displayState"),
      { meOrderCreateLoader: jest.fn() },
      {},
    ],
    [
      "no REST loaders",
      gql`
        mutation($input: CommerceSellerCounterOfferInput!) {
          commerceSellerCounterOffer(input: $input) {
            orderOrError {
              __typename
              ... on CommerceOrderWithMutationSuccess {
                order {
                  internalID
                  buyerTotal(precision: 2)
                  stateExpiresAt(format: "MMM D")
                }
              }
              ... on CommerceOrderWithMutationFailure {
                error {
                  code
                }
              }
            }
          }
        }
      `,
      {},
      { input: { offerId: "offer-1", amountCents: 100, note: "Hi" } },
    ],
  ])(
    "sends Exchange GraphQL the same mutation for %s when the flag is on",
    async (_case, source, context, variables) => {
      const before = await runFlagOff(source, context, variables)
      const after = await runFlagOn(source, context, variables)

      expect(after).toBeDefined()
      expect(withoutVariableNames(after)).toEqual(withoutVariableNames(before))
    }
  )
})
