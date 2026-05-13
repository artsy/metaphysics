import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { graphql } from "graphql"
import { addMockFunctionsToSchema } from "graphql-tools"
import { useCausalityStitching } from "./testingUtils"
import gql from "lib/gql"
import v2Schema from "schema/v2/schema"
import { getFieldsForTypeFromSchema } from "lib/stitching/lib/getTypesFromSchema"

describe("causality/stitching", () => {
  describe("AuctionLotStanding", () => {
    it("extends AuctionsLotStanding", async () => {
      const { types } = await useCausalityStitching()
      expect(types).toContain("AuctionsLotStanding")
    })

    it("resolves a SaleArtwork on an AuctionsLotStanding", async () => {
      const allMergedSchemas = await incrementalMergeSchemas(v2Schema)

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

    describe("auctionsLotStandingConnection", () => {
      it("stitches auctionsLotStandingConnection under Me", async () => {
        const allMergedSchemas = await incrementalMergeSchemas(v2Schema)

        const query = gql`
          {
            me {
              auctionsLotStandingConnection {
                edges {
                  node {
                    rawId
                  }
                }
              }
            }
          }
        `

        addMockFunctionsToSchema({
          schema: allMergedSchemas,
          mocks: {
            Query: () => ({
              me: () => {
                return {
                  internalID: "foo",
                }
              },
            }),
          },
        })

        const result = await graphql(allMergedSchemas, query, {}, {})

        expect(result).toEqual({
          data: {
            me: {
              auctionsLotStandingConnection: {
                edges: [
                  { node: { rawId: "Hello World" } },
                  { node: { rawId: "Hello World" } },
                ],
              },
            },
          },
        })
      })

      describe("when sale artworks are missing", () => {
        let info
        let auctionsLotStandingConnection
        beforeEach(async () => {
          const { resolvers } = await useCausalityStitching()

          // Aka _unused_auctionsLotStandingConnection
          const causalityLotStandingConnection = {
            edges: [
              {
                node: {
                  lot: {
                    internalID: "foo",
                  },
                },
              },
              {
                node: {
                  lot: {
                    internalID: "bar",
                  },
                },
              },
            ],
          }

          info = {
            mergeInfo: {
              delegateToSchema: jest.fn(() => {
                return Promise.resolve(causalityLotStandingConnection)
              }),
            },
          }

          auctionsLotStandingConnection =
            resolvers.Me.auctionsLotStandingConnection
        })

        it("gracefully handles missing sale artwork but removes the lot standing from result", async () => {
          const saleArtworkRootLoader = jest.fn((_id) => {
            return Promise.reject("Im unpublished")
          })

          const result = await auctionsLotStandingConnection.resolve(
            { internalID: "foo" },
            {},
            {
              saleArtworkRootLoader,
            },
            info
          )
          expect(saleArtworkRootLoader.mock.calls).toEqual([["foo"], ["bar"]])
          expect(result.edges).toEqual([])
        })

        it("returns lots with matching sale artwork", async () => {
          const saleArtworkRootLoader = jest.fn((id) => {
            if (id === "bar") {
              return Promise.resolve({ _id: "bar" })
            }
            return Promise.reject("I am unpublished")
          })

          const result = await auctionsLotStandingConnection.resolve(
            { internalID: "foo" },
            {},
            {
              saleArtworkRootLoader,
            },
            info
          )
          expect(saleArtworkRootLoader.mock.calls).toEqual([["foo"], ["bar"]])
          expect(result.edges.map((node) => node.node)).toEqual([
            {
              lot: { internalID: "bar" },
              saleArtwork: { _id: "bar" },
            },
          ])
        })
      })
    })
  })

  describe("AuctionsLotState", () => {
    it("extends AuctionsLotState type with #floorSellingPrice", async () => {
      const { getFields } = await useCausalityStitching()
      expect(await getFields("AuctionsLotState")).toContain("floorSellingPrice")
    })

    it("extends AuctionsLotState type with #onlineAskingPrice", async () => {
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

  describe("Me", () => {
    it("extends Me type with #auctionsLotStandingConnection", async () => {
      const { getFields } = await useCausalityStitching()
      expect(await getFields("Me")).toContain("auctionsLotStandingConnection")
    })
  })

  describe("Lot", () => {
    it("extends Lot type with #lot", async () => {
      const mergedSchema = await incrementalMergeSchemas(v2Schema)
      const lotFields = await getFieldsForTypeFromSchema("Lot", mergedSchema)
      expect(lotFields).toContain("lot")
    })
  })
})
