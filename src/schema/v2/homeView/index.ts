import { GraphQLObjectType, GraphQLFieldConfig, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

// homeView.hello -- hello world

const Hello: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLString,
  description: "Hello, world",
  resolve: () => "world",
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    hello: Hello,
  },
})

export const HomeView: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomeViewType,
  description: "Home view content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}
