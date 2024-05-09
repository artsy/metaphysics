import { GraphQLString } from "graphql"

const userActivitySentence = ({
  artsy_user_since,
  confirmed_buyer_at,
  first_name_last_initial,
}) => {
  let userActivityFragment = `${first_name_last_initial} is `
  if (confirmed_buyer_at) {
    userActivityFragment += "a Confirmed Artsy Buyer."
  } else if (artsy_user_since) {
    const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    const signedUpWithin30Days = new Date(artsy_user_since) > thirtyDaysAgo

    userActivityFragment += signedUpWithin30Days ? "a New" : "an Active"

    userActivityFragment += " Artsy user."
  }

  return userActivityFragment
}

export const SummarySentenceField = {
  type: GraphQLString,
  resolve: (collectorProfile) => {
    const { artsy_user_since } = collectorProfile

    // If anon. session owner (old conversations), return nothing.
    if (!artsy_user_since) return null

    return userActivitySentence(collectorProfile)
  },
}
