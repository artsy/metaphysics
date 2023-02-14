import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { markdown } from "schema/v2/fields/markdown"

const MarkdownContentType = new GraphQLObjectType<any, ResolverContext>({
  name: "MarkdownContent",
  fields: {
    content: markdown(({ content }) => content),
  },
})

class RoleRequiredError extends Error {}

export const MarkdownContent: GraphQLFieldConfig<void, ResolverContext> = {
  type: MarkdownContentType,
  args: {
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { content }, { meLoader }) => {
    if (!meLoader)
      throw new Error("You need to be signed in to perform this action")

    try {
      const { roles } = await meLoader()
      if (!roles.includes("content_manager"))
        throw new RoleRequiredError(
          "You need to have the `content_manager` role to perform this action"
        )
    } catch (err) {
      if (err instanceof RoleRequiredError) throw err
      throw new Error("You need to be signed in to perform this action")
    }

    return { content }
  },
}
