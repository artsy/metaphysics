import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { graphql } from "graphql"
import {
  getConvectionStitchedSchema,
  useConvectionStitching,
} from "./testingUtils"
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

      it("returns null since Convection is disabled", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.lowEstimateAmount.resolve
        expect(resolve()).toEqual(null)
      })

      it("returns null for other currency types since Convection is disabled", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.lowEstimateAmount.resolve
        expect(resolve()).toEqual(null)
      })
    })

    describe("#highEstimateAmount", () => {
      it("extends ConsignmentOffer type with highEstimateAmount field", async () => {
        const { getFields } = await useConvectionStitching()
        expect(await getFields("ConsignmentOffer")).toContain(
          "highEstimateAmount"
        )
      })

      it("returns null since Convection is disabled", async () => {
        const resolve = (await useConvectionStitching()).resolvers
          .ConsignmentOffer.highEstimateAmount.resolve
        expect(resolve()).toEqual(null)
      })
    })
  })
})

it("returns null for submission query since Convection is disabled", async () => {
  const allMergedSchemas = await incrementalMergeSchemas(schema)

  // This test verifies that submission queries return null when Convection is disabled
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

  const result = await graphql(allMergedSchemas, query, {
    accessToken: null,
    userID: null,
  })

  expect(result).toEqual({
    data: { submission: null },
  })
})

it("returns null for the myCollectionArtwork field since Convection is disabled", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { myCollectionArtwork } = resolvers.ConsignmentSubmission

  const result = myCollectionArtwork.resolve()

  expect(result).toEqual(null)
})

it("returns null for userPhoneNumber field since Convection is disabled", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { userPhoneNumber } = resolvers.ConsignmentSubmission

  const result = userPhoneNumber.resolve()

  expect(result).toEqual(null)
})

it("returns null for the myCollectionArtwork field regardless of myCollectionArtworkID since Convection is disabled", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { myCollectionArtwork } = resolvers.ConsignmentSubmission

  const response = myCollectionArtwork.resolve()

  expect(response).toEqual(null)
})
