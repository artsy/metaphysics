import { GraphQLError } from "graphql"

export default (_accessToken, _opts) => {
  // Convection is retired; these keep the remaining native consignment fields answering.
  const createConsignmentInquiryLoader = (
    _args?: Record<string, unknown>
  ): Promise<never> => {
    return Promise.reject(
      new GraphQLError("Artwork submissions are not accepted at this time.")
    )
  }

  const submissionsLoader = () => {
    // Return empty array for submissions list with expected structure
    return Promise.resolve({ body: [], headers: { "x-total-count": "0" } })
  }

  return {
    createConsignmentInquiryLoader,
    submissionsLoader,
  }
}
