import { GraphQLList, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"

interface Input {
  artistIDs: string[]
  userId: string
}

export const collectArtistsMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "CollectArtistsMutation",
  description: "Collect Multiple Artists",
  inputFields: {
    artistIDs: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_source, _args, { meLoader }) => {
        return meLoader?.()
      },
    },
  },
  mutateAndGetPayload: async (args, { meCreateUserInterestLoader }) => {
    if (!meCreateUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    const uniqueArtistIDs = Array.from(new Set(args.artistIDs))
    try {
      await Promise.all(
        uniqueArtistIDs.map((artistID) => {
          const gravityPayload = {
            interest_id: artistID,
            user_id: args.userId,
            interest_type: "Artist",
            category: "collected_before",
          }
          return meCreateUserInterestLoader(gravityPayload)
        })
      )
      return {}
    } catch (err) {
      if ("body" in (err as any)) {
        const e = err as GravityError
        throw new Error(e.body.text ?? e.body.error)
      }

      throw err
    }
  },
})

interface GravityError {
  statusCode: number
  body: { error: string; text?: string }
}
