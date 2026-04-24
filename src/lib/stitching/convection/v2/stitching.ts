import { GraphQLSchema } from "graphql"
import { amountSDL } from "schema/v2/fields/money"
import { GraphQLError } from "graphql"

export const consignmentStitchingEnvironment = (
  _localSchema: GraphQLSchema,
  _convectionSchema: GraphQLSchema
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend type ConsignmentSubmission {
      artist: Artist
      myCollectionArtwork: Artwork
      userPhoneNumber: PhoneNumberType
    }

    extend type ConsignmentOffer {
      ${amountSDL("lowEstimateAmount")}
      ${amountSDL("highEstimateAmount")}
    }

    extend type Mutation {
      createConsignmentSubmission(
       """
       Parameters for CreateSubmissionMutation
       """
       input: CreateSubmissionMutationInput!
      ): CreateSubmissionMutationPayload
    }
  `,

  // Resolvers for the above
  resolvers: {
    ConsignmentSubmission: {
      artist: {
        selectionSet: `{ artistId }`,
        resolve: () => null,
      },
      myCollectionArtwork: {
        selectionSet: `{ myCollectionArtworkID }`,
        resolve: () => null,
      },
      userPhoneNumber: {
        selectionSet: `{ userPhone }`,
        resolve: () => null,
      },
    },

    ConsignmentOffer: {
      lowEstimateAmount: {
        selectionSet: `{ currency lowEstimateCents }`,
        resolve: () => null,
      },
      highEstimateAmount: {
        selectionSet: `{ currency highEstimateCents }`,
        resolve: () => null,
      },
    },
    Mutation: {
      createConsignmentSubmission: {
        resolve: () => {
          throw new GraphQLError(
            "Artwork submissions are not accepted at this time."
          )
        },
      },
    },
  },
})
