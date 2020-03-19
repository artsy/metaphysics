import { GraphQLSchema } from "graphql"

export const consignmentStitchingEnvironment = (
  localSchema: GraphQLSchema,
  convectionSchema: GraphQLSchema & { transforms: any }
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend type ConsignmentSubmission {
      artist: Artist
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
  },
})
