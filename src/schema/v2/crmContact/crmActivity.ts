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
import { isFieldRequested } from "lib/isFieldRequested"
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

type LinkedLoaders = Pick<
  ResolverContext,
  "partnerArtistsAllLoader" | "partnerArtworksAllLoader"
>

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

// Loads what the activities are linked to with one call per partner and 50
// links, and stashes it on each activity under `field`. Entities that no
// longer exist are left out, and a failed call leaves the list empty.
const attachLinked = async ({
  activities,
  field,
  targetType,
  load,
}: {
  activities: any[]
  field: "_artworks" | "_artists"
  targetType: "artwork" | "artist"
  load: (params: { partnerID: string; ids: string[] }) => Promise<any[]>
}) => {
  await Promise.all(
    Object.entries(groupBy(activities, "partner_id")).map(
      async ([partnerID, partnerActivities]) => {
        const ids = uniq(
          partnerActivities.flatMap((activity) =>
            linkedIDs({ activity, targetType })
          )
        )
        const byID = new Map<string, any>()

        try {
          const pages = await Promise.all(
            chunk(ids, LINKED_PAGE_SIZE).map((pageIDs) =>
              load({ partnerID, ids: pageIDs })
            )
          )
          pages.flat().forEach((entity) => byID.set(entity._id, entity))
        } catch (err) {
          // The timeline is still useful without them
          error(
            `Could not load the linked ${targetType}s of CRM activities`,
            err
          )
        }

        partnerActivities.forEach((activity) => {
          activity[field] = linkedIDs({ activity, targetType })
            .map((id) => byID.get(id))
            .filter(Boolean)
        })
      }
    )
  )
}

const attachLinkedArtworks = (
  activities: any[],
  { partnerArtworksAllLoader }: Pick<LinkedLoaders, "partnerArtworksAllLoader">
) => {
  return attachLinked({
    activities,
    field: "_artworks",
    targetType: "artwork",
    load: async ({ partnerID, ids }) => {
      if (!partnerArtworksAllLoader) return []

      const { body } = await partnerArtworksAllLoader(partnerID, {
        artwork_id: ids,
        include_non_artsy_listed: true,
        size: ids.length,
      })

      return body
    },
  })
}

// Goes through the partner's artists, not `artists?ids`, which leaves out
// artists that are not public, such as ones the partner added itself.
const attachLinkedArtists = (
  activities: any[],
  { partnerArtistsAllLoader }: Pick<LinkedLoaders, "partnerArtistsAllLoader">
) => {
  return attachLinked({
    activities,
    field: "_artists",
    targetType: "artist",
    load: async ({ partnerID, ids }) => {
      if (!partnerArtistsAllLoader) return []

      const { body } = await partnerArtistsAllLoader(partnerID, {
        artist_ids: ids,
        size: ids.length,
      })

      return body.map((partnerArtist) => partnerArtist.artist).filter(Boolean)
    },
  })
}

export const CRMActivityType = new GraphQLObjectType<any, ResolverContext>({
  name: "CRMActivity",
  fields: () => ({
    ...InternalIDFields,
    artists: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ArtistType))),
      description:
        "The artists this activity is about. Deleted ones are left out",
      // The connection loads a whole page at once; this covers an activity
      // returned on its own, such as from a mutation.
      resolve: async (activity, _args, { partnerArtistsAllLoader }) => {
        if (!activity._artists) {
          await attachLinkedArtists([activity], { partnerArtistsAllLoader })
        }

        return activity._artists
      },
    },
    artworks: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtworkType))
      ),
      description:
        "The artworks this activity is about. Deleted ones are left out",
      resolve: async (activity, _args, { partnerArtworksAllLoader }) => {
        if (!activity._artworks) {
          await attachLinkedArtworks([activity], { partnerArtworksAllLoader })
        }

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
    { crmActivitiesLoader, partnerArtistsAllLoader, partnerArtworksAllLoader },
    resolveInfo
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

    // Only load what the query selects, both at the same time
    await Promise.all([
      isFieldRequested("edges.node.artworks", resolveInfo) &&
        attachLinkedArtworks(body, { partnerArtworksAllLoader }),
      isFieldRequested("edges.node.artists", resolveInfo) &&
        attachLinkedArtists(body, { partnerArtistsAllLoader }),
    ])

    return paginationResolver({ totalCount, offset, page, size, body, args })
  },
}
