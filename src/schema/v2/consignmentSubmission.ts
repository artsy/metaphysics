import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "./artist"

/**
 * Deprecated stub. Convection is archived, but Eigen < 8.65 still sends
 * `submission(id:) @include(if: false)` on the Sell tab. GraphQL validates
 * the whole document, so without this field those queries fail outright.
 * Remove once the minimum supported Eigen version is >= 8.65.
 */
const ConsignmentSubmissionType = new GraphQLObjectType<any, ResolverContext>({
  name: "ConsignmentSubmission",
  description: "Deprecated: consignment submissions are no longer supported.",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    internalID: { type: GraphQLID },
    title: { type: GraphQLString },
    artist: { type: ArtistType },
  },
})

export const ConsignmentSubmissionField: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ConsignmentSubmissionType,
  deprecationReason: "Consignment submissions are no longer supported.",
  args: {
    externalId: { type: GraphQLID },
    id: { type: GraphQLID },
    sessionID: { type: GraphQLString },
  },
  resolve: () => null,
}
