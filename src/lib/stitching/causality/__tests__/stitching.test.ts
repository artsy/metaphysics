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
