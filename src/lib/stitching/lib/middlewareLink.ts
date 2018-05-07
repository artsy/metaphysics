import { ApolloLink } from "apollo-link"

// We want to set up an authentication chain for making network requests
// when making GraphQL calls to other services. In order to do this we need
// what is essentially a starting point to chain from. This middleware link
// is that.
//
export const middlewareLink = new ApolloLink(
  (operation, forward) => (forward && operation && forward(operation)) || null
)
