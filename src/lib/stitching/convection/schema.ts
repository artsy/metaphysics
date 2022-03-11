import { createConvectionLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableConvectionSchema = () => {
  const convectionLink = createConvectionLink()
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

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes((name) => {
      const newName = remap[name] || name
      return newName
    }),
  ])
}
