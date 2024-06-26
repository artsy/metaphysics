import { incrementalMergeSchemas } from "lib/stitching/mergeSchemas"
import { graphql } from "graphql"
import { addMockFunctionsToSchema } from "graphql-tools"
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

it("resolves the myCollectionArtwork field on Consignment Submission", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { myCollectionArtwork } = resolvers.ConsignmentSubmission
  const info = { mergeInfo: { delegateToSchema: jest.fn() } }

  myCollectionArtwork.resolve(
    { myCollectionArtworkID: "artwork-id" },
    {},
    {},
    info
  )

  expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith(
    expect.objectContaining({
      args: { id: "artwork-id" },
      operation: "query",
      fieldName: "artwork",
    })
  )
})

it("resolves userPhoneNumber field on Consignment Submission", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { userPhoneNumber } = resolvers.ConsignmentSubmission
  const info = { mergeInfo: { delegateToSchema: jest.fn() } }

  userPhoneNumber.resolve({ userPhone: "1234567890" }, {}, {}, info)

  expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith(
    expect.objectContaining({
      args: { phoneNumber: "1234567890" },
      operation: "query",
      fieldName: "phoneNumber",
    })
  )
})

it("resolves null for the myCollectionArtwork field on Consignment Submission if myCollectionArtworkID is null", async () => {
  const { resolvers } = await getConvectionStitchedSchema()
  const { myCollectionArtwork } = resolvers.ConsignmentSubmission
  const info = { mergeInfo: { delegateToSchema: jest.fn() } }

  const response = myCollectionArtwork.resolve(
    { myCollectionArtworkID: null },
    {},
    {},
    info
  )

  expect(response).toEqual(null)
})

describe("createConsignmentSubmission mutation", () => {
  it("delegates to convectionCreateConsignmentSubmission mutation", async () => {
    const { resolvers } = await getConvectionStitchedSchema()
    const { createConsignmentSubmission } = resolvers.Mutation
    const info = { mergeInfo: { delegateToSchema: jest.fn() } }

    createConsignmentSubmission.resolve(
      {},
      { input: { artistID: "banksy" } },
      {},
      info
    )

    expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith(
      expect.objectContaining({
        args: { input: { artistID: "banksy" } },
        operation: "mutation",
        fieldName: "convectionCreateConsignmentSubmission",
      })
    )
  })

  it("uses artwork data to fill in submission when myCollectionArtworkID is specified", async () => {
    const { resolvers } = await getConvectionStitchedSchema()
    const resolver = resolvers.Mutation.createConsignmentSubmission.resolve
    const info = { mergeInfo: { delegateToSchema: jest.fn() } }
    const context = {
      artworkLoader: jest.fn(),
    }

    context.artworkLoader.mockResolvedValue({
      date: "2003",
      category: "Drawing, Collage or other Work on Paper",
      edition_sets: [{ available_editions: ["1"], edition_size: "2" }],
    })

    await resolver(
      {},
      {
        input: {
          artistID: "banksy",
          myCollectionArtworkID: "artwork-id",
          year: "2004",
        },
      },
      context,
      info
    )

    expect(info.mergeInfo.delegateToSchema).toHaveBeenCalledWith(
      expect.objectContaining({
        args: {
          input: {
            artistID: "banksy",
            myCollectionArtworkID: "artwork-id",
            year: "2004",
            category: "DRAWING_COLLAGE_OR_OTHER_WORK_ON_PAPER",
            editionNumber: "1",
            editionSize: 2,
            source: "MY_COLLECTION",
          },
        },
        operation: "mutation",
        fieldName: "convectionCreateConsignmentSubmission",
      })
    )
  })
})
