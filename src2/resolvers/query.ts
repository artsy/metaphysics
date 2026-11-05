import { ResolverContext } from "types/graphql"

// See resolver-specs/_query.md
export default {
  Query: {
    artist: (
      _root: unknown,
      { id }: { id: string },
      { artistLoader }: ResolverContext
    ) => {
      if (id.length === 0) return null
      return artistLoader(id)
    },
  },
}
