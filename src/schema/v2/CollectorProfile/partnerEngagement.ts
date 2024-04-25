import { GraphQLString } from "graphql"
import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { ResolverContext } from "types/graphql"

export const PartnerEngagementType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerEngagement",
  fields: {
    counts: {
      type: new GraphQLObjectType({
        name: "PartnerEngagementCounts",
        description:
          "Counts relating to a collector's interest in the gallery program",
        fields: {
          artworkInquiries: {
            type: new GraphQLNonNull(GraphQLInt),
            args: {
              artistID: {
                type: GraphQLString,
                description:
                  "When present, returns the inquiry count for the artist (across partners).",
              },
            },
            resolve: async (
              { collectorProfileID, partnerID },
              { artistID },
              { partnerCollectorProfileArtworkInquiryCountLoader }
            ) => {
              if (!partnerCollectorProfileArtworkInquiryCountLoader) {
                throw new Error(
                  "You need to be signed in to perform this action"
                )
              }

              const {
                artwork_inquiry_requests_count,
              } = await partnerCollectorProfileArtworkInquiryCountLoader(
                { partnerID, collectorProfileID },
                { artist_id: artistID }
              )

              return artwork_inquiry_requests_count
            },
          },
          followedArtists: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: ({ artist_follows_count }) => artist_follows_count,
          },
          savedArtworks: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: ({ saved_artworks_count }) => saved_artworks_count,
          },
          alerts: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: ({ alerts_count }) => alerts_count,
          },
        },
      }),
      resolve: async (
        { collectorProfileID, partnerID },
        _args,
        { partnerCollectorProfileEngagementLoader },
        info
      ) => {
        const fieldsNotRequireLoader = ["artworkInquiries"]
        const defaultResolvedData = { collectorProfileID, partnerID }

        if (includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)) {
          if (!partnerCollectorProfileEngagementLoader) {
            throw new Error("You need to be signed in to perform this action")
          }

          const data = await partnerCollectorProfileEngagementLoader({
            partnerID,
            collectorProfileID,
          })

          return {
            ...data,
            ...defaultResolvedData,
          }
        } else {
          return defaultResolvedData
        }
      },
    },
  },
})
