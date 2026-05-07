import { GraphQLError } from "graphql"

export const convectionLoaders = (_opts) => {
  // Disabled Convection loaders - all operations throw errors
  const createConsignmentInquiryLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  return {
    createConsignmentInquiryLoader,
  }
}
