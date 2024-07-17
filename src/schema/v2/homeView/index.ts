import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

// homeView.hello -- hello world

const Hello: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(GraphQLString),
  description: "Hello, world",
  resolve: () => "world",
}

// homeView.sections -- a list of blank-slate sections

const SectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "Section",
  description: "A generic section in the home view",
  fields: {
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: "The title of the section",
    },
  },
})

const Sections: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(GraphQLList(GraphQLNonNull(SectionType))),
  description: "A list of sections on the home view",
  resolve: () => {
    return Array.from({ length: 10 }).map((_, i) => {
      return {
        title: `Section ${i}`,
      }
    })
  },
}

// root homeView field

const HomeViewType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeView",
  description: "Experimental schema for new home view",
  fields: {
    hello: Hello,
    sections: Sections,
  },
})

export const HomeView: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLNonNull(HomeViewType),
  description: "Home view content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}
