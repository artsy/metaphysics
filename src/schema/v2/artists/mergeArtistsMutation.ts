import {
  GraphQLID,
  GraphQLInputObjectType,
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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MergeArtistsSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    artist: {
      type: ArtistType,
      resolve: (artist) => artist,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "MergeArtistsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MergeArtistsResponseOrError",
  types: [SuccessType, FailureType],
})

export const mergeArtistsMutation = mutationWithClientMutationId<
  { goodId: string; badIds: string[]; overrides: string },
  unknown,
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
    overrides: {
      description:
        "A map describing the field-level overrides that should be part of this merge.",
      type: new GraphQLInputObjectType({
        name: "MergeArtistsFieldOverrides",
        description:
          "A map describing the field-level overrides that should be part of this merge. " +
          "\n- Each **key** is a field name such as `nationality`" +
          "\n- Each **value** is a BSON ID that indicates the artist record from which we will _prefer_ the value for the given field",
        fields: {
          gender: {
            description:
              "ID of the artist record that contains the `gender` value that we want to preserve.",
            type: GraphQLID,
          },
          nationality: {
            description:
              "ID of the artist record that contains the `nationality` value that we want to preserve.",
            type: GraphQLID,
          },
          birthday: {
            description:
              "ID of the artist record that contains the `birthday` value that we want to preserve.",
            type: GraphQLID,
          },
          deathday: {
            description:
              "ID of the artist record that contains the `deathday` value that we want to preserve.",
            type: GraphQLID,
          },
          hometown: {
            description:
              "ID of the artist record that contains the `hometown` value that we want to preserve.",
            type: GraphQLID,
          },
          location: {
            description:
              "ID of the artist record that contains the `location` value that we want to preserve.",
            type: GraphQLID,
          },
        },
      }),
    },
  },
  outputFields: {
    mergeArtistsResponseOrError: {
      type: ResponseOrErrorType,
      description:
        'On success: the "good" artist record, which was kept after the merge. Upon a successful merge this record may have been updated.',
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { goodId, badIds, overrides } = input
    const { mergeArtistLoader } = context

    if (!mergeArtistLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const result = await mergeArtistLoader({
        good_id: goodId,
        bad_ids: badIds,
        overrides,
      })
      return result
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
