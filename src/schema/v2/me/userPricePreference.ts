import { GraphQLFloat } from "graphql"
import type { GraphQLFieldConfig } from "graphql"
import type { ResolverContext } from "types/graphql"

export const UserPricePreference: GraphQLFieldConfig<void, ResolverContext> = {
  type: GraphQLFloat,
  description: "User's price preference, in USD.",
  resolve: async (_parent, _args, context, _info) => {
    const { userPricePreferenceLoader } = context

    if (!userPricePreferenceLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const vortexResponse = await userPricePreferenceLoader?.()
    return vortexResponse?.data?.[0]?.price_preference
  },
}
