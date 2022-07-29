import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { graphql } from "graphql"
import { addMockFunctionsToSchema } from "graphql-tools"
import { useConvectionStitching } from "./testingUtils"
import gql from "lib/gql"
import schema from "schema/v2/schema"

describe("convection/stitching", () => {
  describe("extending types", () => {
    it("extends ConsignmentSubmission", async () => {
      const { types } = await useConvectionStitching()
      expect(types).toContain("ConsignmentOffer")
    })

    it("extends ConsignmentOffer", async () => {
      const { types } = await useConvectionStitching()
      expect(types).toContain("ConsignmentOffer")
    })
  })

  describe("fields", () => {
    describe("#lowEstimateAmount", () => {
      it("extends ConsignmentOffer type with lowEstimateAmount field", async () => {
        const { getFields } = await useConvectionStitching()
        expect(await getFields("ConsignmentOffer")).toContain(
          "lowEstimateAmount"
        )
      })

      it("formats amount using amount helper", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.lowEstimateAmount.resolve
        expect(resolve({ currency: "USD", lowEstimateCents: 101 }, {})).toEqual(
          "$1.01"
        )
      })

      it("formats other currency types", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.lowEstimateAmount.resolve
        expect(resolve({ currency: "BGN", lowEstimateCents: 101 }, {})).toEqual(
          "лв.1.01"
        )
      })
    })

    describe("#highEstimateAmount", () => {
      it("extends ConsignmentOffer type with highEstimateAmount field", async () => {
        const { getFields } = await useConvectionStitching()
        expect(await getFields("ConsignmentOffer")).toContain(
          "highEstimateAmount"
        )
      })

      it("formats amount using amount helper", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.highEstimateAmount.resolve
        expect(
          resolve({ currency: "USD", highEstimateCents: 101 }, {})
        ).toEqual("$1.01")
      })
    })
  })
})

it("resolves an Artist on a Consignment Submission", async () => {
  const allMergedSchemas = await incrementalMergeSchemas(schema)

  // This test is that a submission gets the artist by stitching a MP
  // Artist into the ConsignmentSubmission inside the schema
  const query = gql`
    {
      submission(id: 123) {
        artistId
        artist {
          name
        }
      }
    }
  `

  // Mock the resolvers for just a submission, and an artist.
  // The part we are testing is the step that goes from a submission
  // to the Artist
  addMockFunctionsToSchema({
    schema: allMergedSchemas,
    mocks: {
      Query: () => ({
        submission: (_root, _params) => {
          return { artistId: "321" }
        },
      }),
    },
  })

  const result = await graphql(allMergedSchemas, query, {
    accessToken: null,
    userID: null,
  })

  expect(result).toEqual({
    data: { submission: { artist: { name: "Hello World" }, artistId: "321" } },
  })
})
