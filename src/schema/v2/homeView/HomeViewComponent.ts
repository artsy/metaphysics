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
    description: {
      type: GraphQLString,
      description: "A description for this section",
      resolve: async (parent, _args, context, _info) => {
        const { description: _description } = parent

        if (typeof _description === "string") {
          return _description
        }

        if (typeof _description === "function") {
          const description = await _description(context)
          return description
        }
      },
    },
    backgroundColor: {
      type: GraphQLString,
      description: "A background color for this section",
      resolve: async (parent, _args, context, _info) => {
        const { backgroundColor } = parent

        if (typeof backgroundColor === "string") {
          return backgroundColor
        }

        if (typeof backgroundColor === "function") {
          const color = await backgroundColor(context)
          return color
        }
      },
    },
  },
})
