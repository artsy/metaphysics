import { GraphQLError } from "graphql"

interface GraphQLArgs {
  query: string
  variables: any
}

export default (_accessToken, _opts) => {
  // Disabled Convection loaders - all operations throw errors or return null
  const convectionTokenLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  const convectionGraphQLLoader = async <T = unknown>({
    query: _query,
    variables: _variables,
  }: GraphQLArgs): Promise<Record<string, T>> => {
    // Return empty data structure for GraphQL queries
    return {} as Record<string, T>
  }

  const createConsignmentInquiryLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  const assetCreateLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  const submissionCreateLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  const submissionsLoader = () => {
    // Return empty array for submissions list with expected structure
    return Promise.resolve({ body: [], headers: { "x-total-count": "0" } })
  }

  const submissionUpdateLoader = () => {
    throw new GraphQLError("Artwork submissions are not accepted at this time.")
  }

  return {
    assetCreateLoader,
    convectionGraphQLLoader,
    convectionTokenLoader,
    createConsignmentInquiryLoader,
    submissionCreateLoader,
    submissionsLoader,
    submissionUpdateLoader,
  }
}
