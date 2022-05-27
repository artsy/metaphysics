import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"

type Input = {
  goodId: string
  badIds: string[]
}

type Output = {
  artist: any // 🥵🥵🥵
}

const MergeArtistsMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MergeArtistsMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
    },
  }),
})

const MergeArtistsMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MergeArtistsMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const MergeArtistsMutationType = new GraphQLUnionType({
  name: "MergeArtistsMutationType",
  types: [MergeArtistsMutationSuccessType, MergeArtistsMutationFailureType],
})

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
    mergedArtistOrError: {
      type: MergeArtistsMutationType,
      resolve: (result) => result,
      description: `
      Upon success: the "good" artist record, which was kept after the merge, and may have been updated.

      Upon error: a message from Gravity.
      `,
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
      return mergedArtist
    } catch (error) {
      // const message = error?.body?.message ?? "Artists could not be merged"
      // throw new Error(message)

      const formattedErr = formatGravityError(error)
      console.log({ error })
      console.log({ formattedErr })

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
