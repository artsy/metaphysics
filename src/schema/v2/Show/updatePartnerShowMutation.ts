import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Show from "../show"
import moment from "moment"

interface UpdatePartnerShowMutationInputProps {
  addArtistIds?: string[]
  artistIds?: string[]
  removeArtistIds?: string[]
  description?: string
  displayOnPartnerProfile?: boolean
  endAt?: string
  fairBooth?: string
  fairId?: string
  featured?: boolean
  group?: boolean
  locationId?: string
  name?: string
  partnerCity?: string
  partnerId?: string
  pressRelease?: string
  showId: string
  startAt?: string
  viewingRoomIds?: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: Show.type,
      resolve: (show) => show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerShowMutation = mutationWithClientMutationId<
  UpdatePartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerShowMutation",
  description: "Updates a partner show.",
  inputFields: {
    addArtistIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "Artist slugs to append to the show. Cannot be combined with artistIds.",
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "Artist slugs for the show. Replaces all existing artists. Cannot be combined with addArtistIds or removeArtistIds.",
    },
    removeArtistIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "Artist slugs to remove from the show. Cannot be combined with artistIds.",
    },
    description: {
      type: GraphQLString,
      description: "The description of the show.",
    },
    displayOnPartnerProfile: {
      type: GraphQLBoolean,
      description: "Should the show be displayed on the partner profile page?",
    },
    endAt: {
      type: GraphQLString,
      description:
        "The end date of the show. Can be set to null for fair booth shows only.",
    },
    featured: {
      type: GraphQLBoolean,
      description: "Is the show featured?",
    },
    group: {
      type: GraphQLBoolean,
      description: "Is the show a group show?",
    },
    locationId: {
      type: GraphQLString,
      description: "The location id of the show.",
    },
    name: {
      type: GraphQLString,
      description: "The name of the show.",
    },
    partnerCity: {
      type: GraphQLString,
      description: "The city of the partner for reference shows.",
    },
    partnerId: {
      type: GraphQLString,
      description:
        "The id of the partner. Required for partner-scoped shows, omit for partner-less reference shows.",
    },
    pressRelease: {
      type: GraphQLString,
      description: "The press release of the show.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the show to update.",
    },
    startAt: {
      type: GraphQLString,
      description: "The start date of the show.",
    },
    fairId: {
      type: GraphQLString,
      description: "The id of the fair to update the show for.",
    },
    fairLocation: {
      type: new GraphQLInputObjectType({
        name: "UpdatePartnerShowFairLocationInput",
        fields: {
          booth: {
            type: GraphQLString,
            description: "The booth of the show in the fair.",
          },
          floor: {
            type: GraphQLString,
            description: "The floor of the show in the fair",
          },
          hall: {
            type: GraphQLString,
            description: "The hall of the show in the fair",
          },
          pier: {
            type: GraphQLString,
            description: "The pier of the show in the fair",
          },
          room: {
            type: GraphQLString,
            description: "The room of the show in the fair",
          },
          section: {
            type: GraphQLString,
            description: "The section of the show in the fair",
          },
        },
      }),
    },
    viewingRoomIds: {
      type: new GraphQLList(GraphQLString),
      description: "The viewing room ids of the show.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner show. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, ...args },
    { updatePartnerShowLoader, updateShowLoader, showLoader }
  ) => {
    if (!updatePartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    // artistIds is a full replace; addArtistIds/removeArtistIds are
    // incremental. Using both modes at once is ambiguous, so reject it.
    const hasFullReplace = args.artistIds && args.artistIds.length > 0
    const hasIncremental =
      (args.addArtistIds && args.addArtistIds.length > 0) ||
      (args.removeArtistIds && args.removeArtistIds.length > 0)

    if (hasFullReplace && hasIncremental) {
      throw new Error(
        "Cannot use artistIds with addArtistIds or removeArtistIds. Use artistIds for a full replace, or addArtistIds/removeArtistIds for incremental changes."
      )
    }

    try {
      // Gravity's find_and_assign_many looks up artists by slug, so
      // addArtistIds, removeArtistIds, and the existing show's artist
      // slugs must all be slug values (not _id values).
      let resolvedArtistIds = args.artistIds

      // Fetch existing show if we need it for incremental artist updates
      // or to validate endAt removal
      let existingShow
      if (hasIncremental || args.endAt === null) {
        existingShow = await showLoader(showId)
      }

      if (hasIncremental) {
        const existingSlugs: string[] = (
          existingShow.artists_without_artworks || []
        ).map((a: any) => a.id)

        let merged = existingSlugs

        if (args.addArtistIds && args.addArtistIds.length > 0) {
          merged = Array.from(new Set([...merged, ...args.addArtistIds]))
        }

        if (args.removeArtistIds && args.removeArtistIds.length > 0) {
          const toRemove = new Set(args.removeArtistIds)
          merged = merged.filter((slug) => !toRemove.has(slug))
        }

        resolvedArtistIds = merged
      }

      // Validate that endAt can only be removed for fair shows
      if (args.endAt === null) {
        const fairId = args.fairId ?? existingShow?.fair?.id
        if (!fairId) {
          return {
            _type: "GravityMutationError",
            message: "endAt can only be null for fair booth shows",
            statusCode: 400,
          }
        }
      }

      const addField = (key, value) =>
        value !== undefined ? { [key]: value } : {}

      const gravityArgs = {
        ...addField("artist_ids", resolvedArtistIds),
        ...addField("name", args.name),
        ...addField("featured", args.featured),
        ...addField("group", args.group),
        ...addField("description", args.description),
        ...addField("display_on_partner_profile", args.displayOnPartnerProfile),
        ...addField("partner_city", args.partnerCity),
        ...addField("press_release", args.pressRelease),
        ...addField("partner_location", args.locationId),
        ...addField(
          "start_at",
          args.startAt !== undefined ? moment(args.startAt).unix() : undefined
        ),
        ...addField(
          "end_at",
          (() => {
            if (args.endAt === undefined) return undefined
            if (args.endAt === null) return null
            return moment(args.endAt).unix()
          })()
        ),
        ...addField("fair", args.fairId),
        ...addField("fair_location", args.fairLocation),
        ...addField("viewing_room_ids", args.viewingRoomIds),
      }

      // Use the top-level PUT /show/:id endpoint for partner-less shows
      // (e.g. galaxy partner reference shows), otherwise use the
      // partner-scoped PUT /partner/:partnerId/show/:showId endpoint.
      const response = partnerId
        ? await updatePartnerShowLoader({ partnerId, showId }, gravityArgs)
        : await updateShowLoader(showId, gravityArgs)

      return response
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
