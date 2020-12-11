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

    it("resolves sellingPrice field as a Money type", async () => {
      const { resolvers } = await useCausalityStitching()
      const saleArtworkRootLoader = jest.fn(() => {
        return { currency: "USD" }
      })
      const sellingPrice = await resolvers.AuctionsLotState.sellingPrice.resolve(
        { internalID: "123", sellingPriceCents: 10000 },
        {},
        { saleArtworkRootLoader },
        {}
      )

      expect(sellingPrice).toEqual({
        major: 100,
        minor: 10000,
        currencyCode: "USD",
        display: "$100",
      })
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
        display: "$100",
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
        display: "¥10,000",
      })
    })
  })

  it("resolves a SaleArtwork on an AuctionsLotStanding", async () => {
    const allMergedSchemas = await incrementalMergeSchemas(schema, 1)

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

  it("gracefully handles missing sale artwork but removes the lot standing from result", async () => {
    const allMergedSchemas = await incrementalMergeSchemas(schema, 1)

    const query = gql`
      {
        me {
          auctionsLotStandingConnection {
            edges {
              node {
                isHighestBidder
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
        Me: () => ({
          _unused_auctionsLotStandingConnection: (_root, _params) => {
            return {
              edges: [
                {
                  node: {
                    isHighestBidder: true,
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

    const result = await graphql(
      allMergedSchemas,
      query,
      {
        accessToken: null,
        userID: null,
      },
      {
        meLoader: () => Promise.resolve({ internalID: "foo" }),
        saleArtworkRootLoader: jest.fn(() =>
          Promise.reject("im unpublished :0")
        ),
      }
    )

    expect(result).toEqual({
      data: {
        me: {
          auctionsLotStandingConnection: {
            edges: [],
          },
        },
      },
    })
  })
})
