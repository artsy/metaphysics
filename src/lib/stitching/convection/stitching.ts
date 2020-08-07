import { GraphQLSchema } from "graphql"
import { amount, amountSDL } from "schema/v2/fields/money"
import gql from "lib/gql"

export const consignmentStitchingEnvironment = (
  localSchema: GraphQLSchema,
  convectionSchema: GraphQLSchema & { transforms: any }
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend type ConsignmentSubmission {
      artist: Artist
    }

    extend type ConsignmentOffer {
      ${amountSDL("lowEstimateAmount")}
      ${amountSDL("highEstimateAmount")}
    }
  `,

  // Resolvers for the above
  resolvers: {
    ConsignmentSubmission: {
      artist: {
        fragment: `fragment SubmissionArtist on ConsignmentSubmission { artistId }`,
        resolve: (parent, _args, context, info) => {
          const id = parent.artistId
          return info.mergeInfo.delegateToSchema({
            schema: localSchema,
            operation: "query",
            fieldName: "artist",
            args: {
              id,
            },
            context,
            info,
            transforms: convectionSchema.transforms,
          })
        },
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
        resolve: (parent, args) =>
          amount((_) => parent.lowEstimateCents).resolve(
            {
              currencyCode: parent.currency,
            },
            args
          ),
      },
      highEstimateAmount: {
        fragment: gql`
          fragment ConsignmentOfferLowEstimateAmount on ConsignmentOffer {
            currency
            highEstimateCents
          }
        `,
        resolve: (parent, args) =>
          amount((_) => parent.highEstimateCents).resolve(
            {
              currencyCode: parent.currency,
            },
            args
          ),
      },
    },
  },
})
