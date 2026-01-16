import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
  addResolveFunctionsToSchema,
} from "graphql-tools"
import { readFileSync } from "fs"
import { GraphQLError } from "graphql"
import { createHttpLink } from "apollo-link-http"

export const executableConvectionSchema = () => {
  const convectionLink = createHttpLink({
    fetch,
    uri: "https://example.com/graphql",
  })
  const convectionTypeDefs = readFileSync("src/data/convection.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: convectionTypeDefs,
    link: convectionLink,
  })

  // Remap the names of certain types from Convection to fit in the larger
  // metaphysics ecosystem.
  const remap = {
    Asset: "ConsignmentSubmissionCategoryAsset",
    AttributionClass: "ConsignmentAttributionClass",
    Category: "ConsignmentSubmissionCategoryAggregation",
    Offer: "ConsignmentOffer",
    OfferConnection: "ConsignmentOfferConnection",
    OfferEdge: "ConsignmentOfferEdge",
    OfferSort: "ConsignmentOfferSort",
    PageCursor: "ConsignmentPageCursor",
    PageCursors: "ConsignmentPageCursors",
    State: "ConsignmentSubmissionStateAggregation",
    Submission: "ConsignmentSubmission",
    SubmissionConnection: "ConsignmentSubmissionConnection",
    SubmissionSort: "ConsignmentSubmissionSort",
    SubmissionSource: "ConsignmentSubmissionSource",
  }

  // Add disabled resolvers to the schema
  addResolveFunctionsToSchema({
    schema,
    resolvers: {
      Query: {
        consignments: () => ({
          edges: [],
          nodes: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 0,
        }),
        offer: () => null,
        offers: () => ({
          edges: [],
          nodes: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 0,
        }),
        submission: () => null,
        submissions: () => ({
          edges: [],
          nodes: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 0,
        }),
      },
      Mutation: {
        removeAssetFromConsignmentSubmission: () => {
          throw new GraphQLError(
            "Artwork submissions are not accepted at this time."
          )
        },
        updateConsignmentSubmission: () => {
          throw new GraphQLError(
            "Artwork submissions are not accepted at this time."
          )
        },
      },
    },
  })

  // Return the new modified schema with disabled resolvers
  return transformSchema(schema, [
    new RenameTypes((name) => {
      const newName = remap[name] || name
      return newName
    }),
    new RenameRootFields((_operation, name) => {
      // We re-define createConsignmentSubmission mutation in Metaphysics, but we want to
      // use the Convection version of the mutation there, that's why we rename it here.
      if (name === "createConsignmentSubmission") {
        return "convectionCreateConsignmentSubmission"
      }

      return name
    }),
  ])
}
