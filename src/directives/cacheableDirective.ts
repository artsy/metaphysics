import { GraphQLDirective, DirectiveLocation } from "graphql"

export const CacheableDirective = new GraphQLDirective({
  name: "cacheable",
  locations: [DirectiveLocation.QUERY],
})
