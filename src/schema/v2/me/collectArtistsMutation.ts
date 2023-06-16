import { GraphQLList, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { meType } from "./index"
import { UserInterest, userInterestType } from "../userInterests"

interface Input {
  artistIDs: string[]
}

export const collectArtistsMutation = mutationWithClientMutationId<
  Input,
  UserInterest[] | null,
  ResolverContext
>({
  name: "CollectArtistsMutation",
  description: "Collect Multiple Artists",
  inputFields: {
    artistIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  },
  outputFields: {
    userInterests: {
      type: new GraphQLNonNull(new GraphQLList(userInterestType)),
      resolve: (userInterests) => userInterests,
    },
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
      const userInterests = await Promise.all(
        uniqueArtistIDs.map((artistID) => {
          const gravityPayload = {
            interest_id: artistID,
            interest_type: "Artist",
            category: "collected_before",
          }
          return meCreateUserInterestLoader(gravityPayload)
        })
      )
      return userInterests
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
