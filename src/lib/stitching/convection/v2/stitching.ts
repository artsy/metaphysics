import { GraphQLSchema } from "graphql"
import { amount, amountSDL } from "schema/v2/fields/money"
import gql from "lib/gql"
import { artworkToSubmissionMapping } from "lib/artworkToSubmissionMapping"
import { GraphQLSchemaWithTransforms } from "graphql-tools"

export const consignmentStitchingEnvironment = (
  localSchema: GraphQLSchema,
  convectionSchema: GraphQLSchemaWithTransforms
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
      myCollectionArtwork: {
        fragment: `fragment SubmissionArtwork on ConsignmentSubmission { myCollectionArtworkID }`,
        resolve: (parent, _args, context, info) => {
          const id = parent.myCollectionArtworkID

          if (!id) return null

          return info.mergeInfo.delegateToSchema({
            schema: localSchema,
            operation: "query",
            fieldName: "artwork",
            args: {
              id,
            },
            context,
            info,
            transforms: convectionSchema.transforms,
          })
        },
      },
      userPhoneNumber: {
        fragment: gql`
          fragment ConsignmentSubmissionUserPhoneNumber on ConsignmentSubmission {
            userPhone
          }
        `,
        resolve: (parent, _args, context, info) => {
          const phoneNumber = parent.userPhone
          return info.mergeInfo.delegateToSchema({
            schema: localSchema,
            operation: "query",
            fieldName: "phoneNumber",
            args: {
              phoneNumber: phoneNumber || "",
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
    Mutation: {
      createConsignmentSubmission: {
        resolve: async (_source, args, context, info) => {
          const myCollectionArtworkID = args.input?.myCollectionArtworkID
          let createSubmissionArgs = args

          // when myCollectionArtworkID is specified, use artwork data to fill in submission
          if (myCollectionArtworkID) {
            if (context.artworkLoader) {
              const artwork = await context.artworkLoader(myCollectionArtworkID)

              if (!artwork) {
                throw new Error("Artwork not found")
              }

              const artworkSubmissionData = artworkToSubmissionMapping(artwork)

              // use artwork data to fill in submission, but allow input to override
              createSubmissionArgs = {
                ...createSubmissionArgs,
                input: {
                  ...artworkSubmissionData,
                  ...createSubmissionArgs.input,
                  source: "MY_COLLECTION",
                },
              }
            }
          }

          return await info.mergeInfo.delegateToSchema({
            schema: convectionSchema,
            operation: "mutation",
            fieldName: "convectionCreateConsignmentSubmission",
            args: createSubmissionArgs,
            context,
            info,
            transforms: [],
          })
        },
      },
    },
  },
})
