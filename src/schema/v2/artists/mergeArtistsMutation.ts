import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"

type Input = {
  goodId: string
  badIds: string[]
}

type Output = {
  artist: any // 🥵
}

export const mergeArtistsMutation = mutationWithClientMutationId<
  Input,
  Output,
  ResolverContext
>({
  name: "MergeArtistsMutation",
  description: "Merge multiple artist records in order to deduplicate artists",
  inputFields: {
    goodId: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        'The database ID of the "good" artist record, which will be **kept** after the merge. Relevant fields and associations from the bad records will be merged into this one.',
    },
    badIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        'The database ID of the "bad" artist record(s), which will be **discarded** after the merge',
    },
  },
  outputFields: {
    artist: {
      type: ArtistType,
      description:
        'The "good" artist record, which was kept after the merge. Upon a successful merge this record may have been updated.',
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { goodId, badIds } = input
    const { mergeArtistLoader } = context

    if (!mergeArtistLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const mergedArtist = await mergeArtistLoader({
        good_id: goodId,
        bad_ids: badIds,
      })

      return {
        artist: mergedArtist,
      }
    } catch (error) {
      const message = error?.body?.message ?? "Artists could not be merged"
      throw new Error(message)
    }
  },
})
