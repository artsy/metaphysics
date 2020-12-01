import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { graphql } from "graphql"
import { addMockFunctionsToSchema } from "graphql-tools"
import { useCausalityStitching } from "./testingUtils"
import gql from "lib/gql"
import schema from "schema/v1/schema"

describe("causality/stitching", () => {
  describe("extending types", () => {
    it("extends AuctionsLotStanding", async () => {
      const { types } = await useCausalityStitching()
      expect(types).toContain("AuctionsLotStanding")
    })
  })

  describe("fields", () => {
    describe("Me", () => {
      it("adds #auctionsLotStandingConnection to me", async () => {
        const { getFields } = await useCausalityStitching()
        expect(await getFields("Me")).toContain("auctionsLotStandingConnection")
      })
    })
  })

  describe("AuctionsLotState", () => {
    it("extends the AuctionsLotState type with a floorSellingPrice field", async () => {
      const { getFields } = await useCausalityStitching()
      expect(await getFields("AuctionsLotState")).toContain("floorSellingPrice")
    })

    it("extends the AuctionsLotState type with a onlineAskingPrice field", async () => {
      const { getFields } = await useCausalityStitching()
      expect(await getFields("AuctionsLotState")).toContain("onlineAskingPrice")
    })

    it("resolves floorSellingPrice field as a Money type", async () => {
      const { resolvers } = await useCausalityStitching()
      const saleArtworkRootLoader = jest.fn(() => {
        return { currency: "USD" }
      })
      const floorSellingPrice = await resolvers.AuctionsLotState.floorSellingPrice.resolve(
        { internalID: "123", floorSellingPriceCents: 10000 },
        {},
        { saleArtworkRootLoader },
        {}
      )

      expect(floorSellingPrice).toEqual({
        major: 100,
        minor: 10000,
        currencyCode: "USD",
        display: "$100.00",
      })
    })

    it("resolves onlineAskingPrice field as a Money type", async () => {
      const { resolvers } = await useCausalityStitching()
      const saleArtworkRootLoader = jest.fn(() => {
        return { currency: "JPY" }
      })
      const onlineAskingPrice = await resolvers.AuctionsLotState.onlineAskingPrice.resolve(
        { internalID: "123", onlineAskingPriceCents: 10000 },
        {},
        { saleArtworkRootLoader },
        {}
      )

      expect(onlineAskingPrice).toEqual({
        major: 10000,
        minor: 10000,
        currencyCode: "JPY",
        display: "¥10,000.00",
      })
    })
  })

  it("resolves a SaleArtwork on an AuctionsLotStanding", async () => {
    const allMergedSchemas = await incrementalMergeSchemas(schema, 1)

    // This test is that a submission gets the artist by stitching a MP
    // Artist into the ConsignmentSubmission inside the schema
    const query = gql`
      {
        _unused_auctionsLotStandingConnection(userId: "123") {
          edges {
            node {
              saleArtwork {
                artwork {
                  title
                }
              }
            }
          }
        }
      }
    `

    // Mock the resolvers for just a user's lot standings so we can see the
    // stitched SaleArtwork data inside.
    addMockFunctionsToSchema({
      schema: allMergedSchemas,
      mocks: {
        Query: () => ({
          _unused_auctionsLotStandingConnection: (_root, _params) => {
            return {
              edges: [
                {
                  node: {
                    lotState: {
                      id: "xxx",
                    },
                  },
                },
              ],
            }
          },
        }),
      },
    })

    const result = await graphql(allMergedSchemas, query, {
      accessToken: null,
      userID: null,
    })

    expect(result).toEqual({
      data: {
        _unused_auctionsLotStandingConnection: {
          edges: [
            {
              node: {
                saleArtwork: { artwork: { title: "Hello World" } },
              },
            },
          ],
        },
      },
    })
  })
})
