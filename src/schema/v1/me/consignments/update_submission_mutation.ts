import { mutationWithClientMutationId, MutationConfig } from "graphql-relay"
import {
  SubmissionType,
  SubmissionCategoryAggregation,
  SubmissionDimensionAggregation,
  SubmissionStateAggregation,
} from "./submission"
import { ResolverContext } from "types/graphql"
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
} from "graphql"

export const config: MutationConfig<any, any, ResolverContext> = {
  name: "UpdateSubmissionMutation",
  description: "Update a consignment using Convection",
  inputFields: {
    id: {
      description: "The GUID for the submission",
      type: new GraphQLNonNull(GraphQLString),
    },
    artist_id: {
      description: "The gravity ID for an Artist",
      type: new GraphQLNonNull(GraphQLString),
    },
    authenticity_certificate: {
      description: "Does the artwork come with an certificate of authenticity?",
      type: GraphQLBoolean,
    },
    category: {
      description: "The set in which to put the work",
      type: SubmissionCategoryAggregation,
    },
    depth: {
      description: "The depth of the work",
      type: GraphQLString,
    },
    dimensions_metric: {
      description: "A string, either CM or IN",
      type: SubmissionDimensionAggregation,
    },
    edition: {
      description: "Is the work a part of an edition",
      type: GraphQLBoolean,
    },
    edition_number: {
      description: "The number of the individual work if in a set",
      type: GraphQLString,
    },
    edition_size: {
      description: "The whole size of the set of works",
      type: GraphQLString,
    },
    height: {
      description: "The height of the work",
      type: GraphQLString,
    },
    location_city: {
      description: "The city where the work currently resides",
      type: GraphQLString,
    },
    location_country: {
      description: "The country where the work currently resides",
      type: GraphQLString,
    },
    location_state: {
      description: "The state where the work currently resides",
      type: GraphQLString,
    },
    medium: {
      description: "The materials in which the work is created",
      type: GraphQLString,
    },
    provenance: {
      description: "The history of an work",
      type: GraphQLString,
    },
    signature: {
      description: "Is this work signed?",
      type: GraphQLBoolean,
    },
    title: {
      description: "The name of the work",
      type: GraphQLString,
    },
    state: {
      description: "The internal state of the work, e.g. draft/submitted",
      type: SubmissionStateAggregation,
    },
    width: {
      description: "The width of the work",
      type: GraphQLString,
    },
    year: {
      description: "The year the work was created",
      type: GraphQLString,
    },
    user_id: {
      description: "The user who submitted the work",
      type: GraphQLID,
    },
  },
  outputFields: {
    consignment_submission: {
      type: SubmissionType,
      resolve: submission => submission,
    },
  },
  mutateAndGetPayload: (submission, { submissionUpdateLoader }) => {
    if (!submissionUpdateLoader) return null
    return submissionUpdateLoader(submission.id, submission)
  },
}

export default mutationWithClientMutationId(config)
