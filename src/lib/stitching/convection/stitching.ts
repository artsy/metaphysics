import { GraphQLSchema } from "graphql"

export const consignmentStitchingEnvironment = (
  localSchema: GraphQLSchema,
  convectionSchema: GraphQLSchema
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
        fragment: `fragment SubmissionArtist on ConsignmentSubmission { artist_id }`,
        resolve: (parent, _args, context, info) => {
          const id = parent.artist_id
          return info.mergeInfo.delegateToSchema({
            schema: localSchema,
            operation: "query",
            fieldName: "artist",
            args: {
              id,
            },
            context,
            info,
            transforms: (convectionSchema as any).transforms,
          })
        },
      },
    },
  },
})
