import { GraphQLSchema } from "graphql"
import { amountSDL } from "schema/v2/fields/money"
import gql from "lib/gql"
import { GraphQLSchemaWithTransforms } from "graphql-tools"
import { GraphQLError } from "graphql"

export const consignmentStitchingEnvironment = (
  _localSchema: GraphQLSchema,
  _convectionSchema: GraphQLSchemaWithTransforms
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
        fragment: `fragment SubmissionArtist on ConsignmentSubmission { artistId }`,
        resolve: () => null,
      },
      myCollectionArtwork: {
        fragment: `fragment SubmissionArtwork on ConsignmentSubmission { myCollectionArtworkID }`,
        resolve: () => null,
      },
      userPhoneNumber: {
        fragment: gql`
          fragment ConsignmentSubmissionUserPhoneNumber on ConsignmentSubmission {
            userPhone
          }
        `,
        resolve: () => null,
      },
    },

    ConsignmentOffer: {
      lowEstimateAmount: {
        fragment: gql`
          fragment ConsignmentOfferLowEstimateAmount on ConsignmentOffer {
            currency
            lowEstimateCents
          }
        `,
        resolve: () => null,
      },
      highEstimateAmount: {
        fragment: gql`
          fragment ConsignmentOfferLowEstimateAmount on ConsignmentOffer {
            currency
            highEstimateCents
          }
        `,
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
