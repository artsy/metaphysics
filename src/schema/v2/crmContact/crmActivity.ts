import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { chunk, groupBy, isNil, omitBy, uniq } from "lodash"
import { error } from "lib/loggers"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import { ArtistType } from "../artist"
import { ArtworkType } from "../artwork"

export const CRMActivityKindEnum = new GraphQLEnumType({
  name: "CRMActivityKind",
  values: {
    CALL: { value: "call" },
    EMAIL: { value: "email" },
    INTEREST: { value: "interest" },
    MEETING: { value: "meeting" },
    NOTE: { value: "note" },
  },
})

export const CRMActivitySortEnum = new GraphQLEnumType({
  name: "CRMActivitySort",
  values: {
    OCCURRED_AT_ASC: { value: "occurred_at" },
    OCCURRED_AT_DESC: { value: "-occurred_at" },
  },
})

export const EmailParticipantRoleEnum = new GraphQLEnumType({
  name: "EmailParticipantRole",
  values: {
    FROM: { value: "from" },
    TO: { value: "to" },
    CC: { value: "cc" },
    BCC: { value: "bcc" },
  },
})

export const EmailMessageDirectionEnum = new GraphQLEnumType({
  name: "EmailMessageDirection",
  values: {
    INBOUND: { value: "inbound" },
    OUTBOUND: { value: "outbound" },
  },
})

export const EmailParticipantType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "EmailParticipant",
    fields: () => ({
      ...InternalIDFields,
      role: { type: EmailParticipantRoleEnum },
      address: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      crmContactID: {
        type: GraphQLString,
        description: "Set when the address belongs to a CRM contact",
        resolve: ({ crm_contact_id }) => crm_contact_id,
      },
    }),
  }
)

export const EmailMessageType = new GraphQLObjectType<any, ResolverContext>({
  name: "EmailMessage",
  fields: () => ({
    ...InternalIDFields,
    direction: { type: EmailMessageDirectionEnum },
    fromAddress: {
      type: GraphQLString,
      resolve: ({ from_address }) => from_address,
    },
    fromName: {
      type: GraphQLString,
      resolve: ({ from_name }) => from_name,
    },
    sentAt: date(),
    receivedAt: date(),
    hasAttachments: {
      type: GraphQLBoolean,
      resolve: ({ has_attachments }) => has_attachments,
    },
    contentVisible: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "Whether the viewer may read the subject and snippet. True for the mailbox owner, and for colleagues once the owner shares content with the partner.",
      resolve: ({ content_visible }) => !!content_visible,
    },
    subject: {
      type: GraphQLString,
      description: "Null unless `contentVisible` is true",
    },
    snippet: {
      type: GraphQLString,
      description: "Null unless `contentVisible` is true",
    },
    participants: {
      type: new GraphQLList(new GraphQLNonNull(EmailParticipantType)),
      description:
        "Bcc participants are only included when the viewer may read the message",
      resolve: ({ participants }) => participants ?? [],
    },
  }),
})

// Gravity limits these list endpoints to pages of 50
const LINKED_PAGE_SIZE = 50

const linkedIDs = ({
  activity,
  targetType,
}: {
  activity: any
  targetType: "artwork" | "artist"
}): string[] =>
  (activity.links ?? [])
    .filter((link) => link.target_type === targetType)
    .map((link) => link.target_id)

// Loads the linked artworks and artists of many activities with one call per
// 50 of each, and stashes them on each activity as `_artworks` and `_artists`.
// Deleted ones are left out.
const attachLinkedEntities = async (
  activities: any[],
  {
    partnerArtworksAllLoader,
    artistsLoader,
  }: Pick<ResolverContext, "partnerArtworksAllLoader" | "artistsLoader">
) => {
  const loadByID = async ({
    ids,
    load,
  }: {
    ids: string[]
    load: (ids: string[]) => Promise<{ body: any[] }>
  }) => {
    const byID = new Map<string, any>()

    if (ids.length === 0) return byID

    try {
      const pages = await Promise.all(chunk(ids, LINKED_PAGE_SIZE).map(load))
      pages.forEach(({ body }) =>
        body.forEach((entity) => byID.set(entity._id, entity))
      )
    } catch (err) {
      // The timeline is still useful without them
      error("Could not load the linked entities of CRM activities", err)
    }

    return byID
  }

  const artistIDs = uniq(
    activities.flatMap((activity) =>
      linkedIDs({ activity, targetType: "artist" })
    )
  )
  const artistsByID = await loadByID({
    ids: artistIDs,
    load: (ids) => artistsLoader({ ids, size: ids.length }),
  })

  await Promise.all(
    Object.entries(groupBy(activities, "partner_id")).map(
      async ([partnerID, partnerActivities]) => {
        const artworksByID = await loadByID({
          ids: partnerArtworksAllLoader
            ? uniq(
                partnerActivities.flatMap((activity) =>
                  linkedIDs({ activity, targetType: "artwork" })
                )
              )
            : [],
          load: (ids) =>
            partnerArtworksAllLoader!(partnerID, {
              artwork_id: ids,
              include_non_artsy_listed: true,
              size: ids.length,
            }),
        })

        partnerActivities.forEach((activity) => {
          activity._artworks = linkedIDs({ activity, targetType: "artwork" })
            .map((id) => artworksByID.get(id))
            .filter(Boolean)
        })
      }
    )
  )

  activities.forEach((activity) => {
    activity._artists = linkedIDs({ activity, targetType: "artist" })
      .map((id) => artistsByID.get(id))
      .filter(Boolean)
    activity._linked = Promise.resolve()
  })
}

// The connection loads a whole page at once; this covers an activity returned
// on its own, such as from a mutation, with one load for all its fields.
const ensureLinkedEntities = ({
  activity,
  loaders,
}: {
  activity: any
  loaders: Pick<ResolverContext, "partnerArtworksAllLoader" | "artistsLoader">
}): Promise<void> => {
  if (!activity._linked) {
    activity._linked = attachLinkedEntities([activity], loaders)
  }

  return activity._linked
}

export const CRMActivityType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMActivity",
  fields: () => ({
    ...InternalIDFields,
    artists: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ArtistType))),
      description:
        "The artists this activity is about. Deleted ones are left out",
      resolve: async (
        activity,
        _args,
        { artistsLoader, partnerArtworksAllLoader }
      ) => {
        await ensureLinkedEntities({
          activity,
          loaders: { artistsLoader, partnerArtworksAllLoader },
        })

        return activity._artists
      },
    },
    artworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtworkType))
      ),
      description:
        "The artworks this activity is about. Deleted ones are left out",
      resolve: async (
        activity,
        _args,
        { artistsLoader, partnerArtworksAllLoader }
      ) => {
        await ensureLinkedEntities({
          activity,
          loaders: { artistsLoader, partnerArtworksAllLoader },
        })

        return activity._artworks
      },
    },
    createdAt: date(),
    crmContactID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ crm_contact_id }) => crm_contact_id,
    },
    description: {
      type: GraphQLString,
    },
    emailMessage: {
      type: EmailMessageType,
      description: "Null for activities that are not emails",
      resolve: ({ email_message }) => email_message ?? null,
    },
    kind: { type: CRMActivityKindEnum },
    occurredAt: date(),
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ partner_id }) => partner_id,
    },
    subject: {
      type: GraphQLString,
    },
    updatedAt: date(),
  }),
})

export const CRMActivityConnectionType = connectionWithCursorInfo({
  name: "CRMActivity",
  nodeType: CRMActivityType,
}).connectionType

export const crmActivitiesConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: CRMActivityConnectionType,
  description: "A connection of the timeline activities of a CRM contact",
  args: pageable({
    crmContactID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the CRM contact",
    },
    kind: {
      type: CRMActivityKindEnum,
      description: "Only activities of this kind",
    },
    sort: {
      type: CRMActivitySortEnum,
      description: "Defaults to OCCURRED_AT_DESC (newest first)",
    },
  }),
  // Gravity embeds each email message, its participants and the links in the
  // page, and the linked artworks and artists are loaded for the page in one
  // go, so no per-node loader calls are needed.
  resolve: async (
    _root,
    args,
    { artistsLoader, crmActivitiesLoader, partnerArtworksAllLoader }
  ) => {
    if (!crmActivitiesLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    // Gravity rejects empty params, so leave out optional ones that are unset or null
    const { body, headers } = await crmActivitiesLoader(
      omitBy(
        {
          crm_contact_id: args.crmContactID,
          kind: args.kind,
          sort: args.sort,
          total_count: true,
          size,
          offset,
        },
        isNil
      )
    )

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    await attachLinkedEntities(body, {
      artistsLoader,
      partnerArtworksAllLoader,
    })

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
