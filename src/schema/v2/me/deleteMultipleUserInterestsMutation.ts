import { GraphQLList, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { UserInterest, userInterestType } from "../userInterests"
import { meType } from "./index"

interface Input {
  ids: [string]
}

export const deleteMultipleUserInterestsMutation = mutationWithClientMutationId<
  Input,
  UserInterest[] | null,
  ResolverContext
>({
  name: "DeleteMultipleUserInterestsMutation",
  description:
    "Deletes multiple UserInterests on the logged in User's CollectorProfile.",
  inputFields: {
    ids: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
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
  mutateAndGetPayload: async (args, { meDeleteUserInterestLoader }) => {
    if (!meDeleteUserInterestLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const uniqueIDs = Array.from(new Set(args.ids))
    try {
      const userInterests = await Promise.all<Promise<UserInterest>>(
        uniqueIDs.map((userInterestId) =>
          meDeleteUserInterestLoader(userInterestId)
        )
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
