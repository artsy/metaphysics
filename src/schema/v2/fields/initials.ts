import { get, take } from "lodash"
import { GraphQLString, GraphQLInt, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export function initials(string = "", length = 3) {
  if (!string) return null

  // FIXME: Expected 1 arguments, but got 2.
  // @ts-ignore
  const letters = take(string.match(/\b[A-Z]/g, ""), length)
  if (letters.length >= 1) return letters.join("").toUpperCase()

  // FIXME: Expected 1 arguments, but got 2.
  // @ts-ignore
  return take(string.match(/\b\w/g, ""), length).join("").toUpperCase()
}

export default (attr): GraphQLFieldConfig<void, ResolverContext> => ({
  type: GraphQLString,
  args: {
    length: {
      type: GraphQLInt,
      defaultValue: 3,
    },
  },
  resolve: (obj, { length }) => initials(get(obj, attr), length),
})
