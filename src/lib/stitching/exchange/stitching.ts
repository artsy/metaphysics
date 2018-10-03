// Unions are messed up
// Stitching on EcommercePartner -> Partner
// Stitching on EcommerceUser -> User
// Stitching on order.artwork to an Artwork

import { GraphQLSchema } from "graphql"

export const ecommerceStitchingEnvironment = (
  localSchema: GraphQLSchema,
  exchangeSchema: GraphQLSchema
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
    extend union EcommerceOrderPartyUnion = Partner | User

  `,

  // Resolvers for the above
  resolvers: {
    //   ConsignmentSubmission: {
    //     artist: {
    //       fragment: `fragment SubmissionArtist on ConsignmentSubmission { artist_id }`,
    //       resolve: (parent, _args, context, info) => {
    //         const id = parent.artist_id
    //         return info.mergeInfo.delegateToSchema({
    //           schema: localSchema,
    //           operation: "query",
    //           fieldName: "artist",
    //           args: {
    //             id,
    //           },
    //           context,
    //           info,
    //           transforms: (convectionSchema as any).transforms,
    //         })
    //       },
    //     },
    //   },
  },
})
