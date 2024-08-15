import { GraphQLObjectType, GraphQLString } from "graphql"

export const HomeViewComponent = new GraphQLObjectType({
  name: "HomeViewComponent",
  description: "A component specification",
  fields: {
    title: {
      type: GraphQLString,
      description: "A display title for this section",
      resolve: async (parent, _args, context, _info) => {
        const { title: _title } = parent

        if (typeof _title === "string") {
          return _title
        }

        if (typeof _title === "function") {
          const title = await _title(context)
          return title
        }
      },
    },
  },
})
