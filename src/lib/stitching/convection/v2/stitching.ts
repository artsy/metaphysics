import { GraphQLSchema } from "graphql"
import gql from "lib/gql"
import { GraphQLSchemaWithTransforms } from "graphql-tools"

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
  },
})
