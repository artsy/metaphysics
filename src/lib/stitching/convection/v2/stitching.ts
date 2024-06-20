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
      myCollectionArtwork: Artwork
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

          if (myCollectionArtworkID) {
            const { artworkLoader } = context

            if (artworkLoader) {
              const artwork = await artworkLoader(myCollectionArtworkID)

              if (!artwork) {
                throw new Error("Artwork not found")
              }

              const artworkSubmissionData = {
                artistID: artwork.artist?.id,
                title: artwork.title,
                year: (artwork.dates || [])[0]?.toString(),
                medium: artwork.medium,
                // TODO: format category, ideally take Category enum from Convection Schema (ConsignmentSubmissionCategoryAggregation)
                // category: artwork.category,
                attributionClass: artwork.attribution_class
                  ?.replace(" ", "_")
                  ?.toUpperCase(),
                editionNumber:
                  artwork.edition_sets?.[0]?.available_editions?.[0],
                editionSize: artwork.edition_sets?.[0]?.edition_size
                  ? +artwork.edition_sets?.[0]?.edition_size
                  : undefined,
                height: artwork.height,
                width: artwork.width,
                depth: artwork.depth,
                dimensionsMetric: artwork.metric ?? "in",
                provenance: artwork.provenance ?? "",
                locationCity: artwork.collector_location?.city,
                locationCountry: artwork.collector_location?.country,
                locationState: artwork.collector_location?.state,
                locationCountryCode: artwork.collector_location?.countryCode,
                locationPostalCode: artwork.collector_location?.postalCode,
              }

              createSubmissionArgs = {
                ...createSubmissionArgs,
                input: {
                  ...artworkSubmissionData,
                  ...createSubmissionArgs.input,
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
