import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  convertConnectionArgsToGravityArgs,
  defineCustomLocale,
} from "lib/helpers"
import { createPageCursors, emptyConnection } from "./fields/pagination"
import { connectionFromArray } from "graphql-relay"
import { artworkConnection } from "./artwork"
import { pageable } from "relay-cursor-paging"
import moment from "moment"
import { PartnerType } from "./partner/partner"
import { dateRange } from "lib/date"
import { GravityARImageType } from "./GravityARImageType"
import { ViewingRoomSubsectionType } from "./viewingRoomSubsection"
import { ViewingRoomArtworkType } from "./viewingRoomArtwork"
import { InternalIDField } from "./object_identification"

const LocaleEnViewingRoomRelativeShort = "en-viewing-room-relative-short"
defineCustomLocale(LocaleEnViewingRoomRelativeShort, {
  parentLocale: "en",
  relativeTime: {
    future: "soon",
    s: "",
    ss: "",
    m: "",
    mm: "",
    h: "",
    hh: "",
    d: "",
    dd: "",
    M: "",
    MM: "",
    y: "",
    yy: "",
  },
})

const LocaleEnViewingRoomRelativeLong = "en-viewing-room-relative-long"
defineCustomLocale(LocaleEnViewingRoomRelativeLong, {
  parentLocale: "en",
  relativeTime: {
    s: "%d second",
    ss: "%d seconds",
    m: "%d minute",
    mm: "%d minutes",
    h: "%d hour",
    hh: "%d hours",
    d: "%d day",
    dd: "%d days",
    M: "%d month",
    MM: "%d months",
    y: "%d year",
    yy: "%d years",
  },
})

export const ViewingRoomType = new GraphQLObjectType<any, ResolverContext>({
  name: "ViewingRoom",
  fields: () => {
    const { PartnerArtworks } = require("schema/v2/partner/partnerArtworks")

    return {
      ...InternalIDField,
      artworkIDs: {
        type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        resolve: ({ artwork_ids }) => artwork_ids,
      },
      artworksConnection: {
        type: artworkConnection.connectionType,
        args: pageable({}),
        resolve: ({ artwork_ids }, args, { artworksLoader }) => {
          // qs ignores empty array/object and prevents us from sending `?array[]=`.
          // This is a workaround to map an empty array to `[null]` so it gets treated
          // as an empty string.
          // https://github.com/ljharb/qs/issues/362
          //
          // Note that we can't easily change this globally as there are multiple places
          // clients are sending params of empty array but expecting Gravity to return
          // non-empty data. This only fixes the issue for viewing room artworks.
          let ids = artwork_ids
          if (ids.length === 0) {
            ids = [null]
          }

          const { page, size } = convertConnectionArgsToGravityArgs(args)
          return artworksLoader({ ids, batched: true }).then((body) => {
            const totalCount = body.length
            return {
              totalCount,
              pageCursors: createPageCursors({ page, size }, totalCount),
              ...connectionFromArray(body, args),
            }
          })
        },
      },
      body: {
        type: GraphQLString,
        description: "Body copy",
        resolve: ({ body }) => body,
      },
      distanceToClose: {
        type: GraphQLString,
        args: {
          short: {
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
          },
        },
        resolve: (
          { start_at: _startAt, end_at: _endAt },
          { short = false }
        ) => {
          if (_startAt === null || _endAt === null) {
            return null
          }

          const startAt = moment(_startAt)
          const endAt = moment(_endAt)
          const now = moment()

          if (startAt > now) {
            return null
          }

          if (endAt < now) {
            return null
          }

          if (short) {
            if (endAt > now.clone().add(5, "days")) {
              return null
            }
          } else {
            if (endAt > now.clone().add(30, "days")) {
              return null
            }
          }

          return `${moment
            .duration(endAt.diff(now))
            .locale(LocaleEnViewingRoomRelativeLong)
            .humanize(false, { ss: 1, d: 31 })}`
        },
      },
      distanceToOpen: {
        type: GraphQLString,
        args: {
          short: {
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
          },
        },
        resolve: ({ start_at: _startAt }, { short = false }) => {
          if (_startAt === null) {
            return null
          }

          const startAt = moment(_startAt)
          const now = moment()

          if (startAt < now) {
            return null
          }

          if (!short && startAt > now.clone().add(30, "days")) {
            return null
          }

          const distance = moment.duration(startAt.diff(now))
          return distance
            .locale(
              short
                ? LocaleEnViewingRoomRelativeShort
                : LocaleEnViewingRoomRelativeLong
            )
            .humanize(short, { ss: 1, d: 31 })
        },
      },
      endAt: {
        type: GraphQLString,
        description:
          "Datetime after which the viewing room is no longer viewable",
        resolve: ({ end_at }) => end_at,
      },
      exhibitionPeriod: {
        type: GraphQLString,
        resolve: ({ start_at, end_at }) => dateRange(start_at, end_at, "UTC"),
      },
      firstLiveAt: {
        type: GraphQLString,
        description: "Datetime when viewing room first viewable",
        resolve: ({ first_live_at }) => first_live_at,
      },
      heroImageURL: {
        type: GraphQLString,
        deprecationReason: "Use image field instead",
        resolve: ({ hero_image_url }) => hero_image_url,
      },
      href: {
        type: GraphQLString,
        resolve: ({ slug }) => `/viewing-room/${slug}`,
      },
      image: {
        type: GravityARImageType,
      },
      introStatement: {
        type: GraphQLString,
        description: "Introductory paragraph",
        resolve: ({ intro_statement }) => intro_statement,
      },
      partner: {
        type: PartnerType,
        resolve: ({ partner_id }, _args, { partnerLoader }) => {
          return partnerLoader(partner_id)
        },
      },
      partnerArtworksConnection: {
        type: artworkConnection.connectionType,
        args: pageable({}),
        resolve: ({ partner_id, id }, args, context, info) => {
          if (!PartnerArtworks?.resolve) {
            return emptyConnection
          }

          return PartnerArtworks.resolve(
            undefined,
            {
              partnerID: partner_id,
              viewingRoomID: id,
              ...args,
            },
            context,
            info
          )
        },
      },
      partnerID: {
        type: new GraphQLNonNull(GraphQLString),
        description: "ID of the partner associated with this viewing room",
        resolve: ({ partner_id }) => partner_id,
      },
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
      pullQuote: {
        type: GraphQLString,
        resolve: ({ pull_quote }) => pull_quote,
      },
      slug: {
        type: new GraphQLNonNull(GraphQLString),
      },
      startAt: {
        type: GraphQLString,
        description: "Datetime when the viewing room is viewable",
        resolve: ({ start_at }) => start_at,
      },
      status: {
        type: new GraphQLNonNull(GraphQLString),
        description:
          "Calculated field to reflect visibility and state of this viewing room",
      },
      subsections: {
        type: new GraphQLNonNull(new GraphQLList(ViewingRoomSubsectionType)),
        resolve: async ({ id }, _args, { viewingRoomSubsectionsLoader }) => {
          return viewingRoomSubsectionsLoader(id)
        },
      },
      timeZone: {
        type: GraphQLString,
        resolve: ({ time_zone }) => time_zone,
      },
      title: {
        type: new GraphQLNonNull(GraphQLString),
        description: "Viewing room name",
      },
      viewingRoomArtworks: {
        type: new GraphQLNonNull(new GraphQLList(ViewingRoomArtworkType)),
        resolve: async ({ id }, _args, { viewingRoomArtworksLoader }) => {
          return viewingRoomArtworksLoader(id)
        },
      },
    }
  },
})

export const ViewingRoom: GraphQLFieldConfig<void, ResolverContext> = {
  type: ViewingRoomType,
  description: "Find a viewing room by ID",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  resolve: async (_root, { id }, { viewingRoomLoader }) => {
    return viewingRoomLoader(id)
  },
}
