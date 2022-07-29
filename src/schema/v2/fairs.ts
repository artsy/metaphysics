import _, { pick } from "lodash"
import FairSorts, { FairSortsType } from "./sorts/fair_sorts"
import EventStatus, { EventStatusType } from "./input_fields/event_status"
import Near, { NearType } from "./input_fields/near"
import Fair, { fairConnection } from "./fair"
import {
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"

const Fairs: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Fair.type),
  description: "A list of Fairs",
  args: {
    fairOrganizerID: {
      type: GraphQLString,
    },
    hasFullFeature: {
      type: GraphQLBoolean,
    },
    hasHomepageSection: {
      type: GraphQLBoolean,
    },
    hasListing: {
      type: GraphQLBoolean,
    },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return fairs matching specified ids.
        Accepts list of ids.
      `,
    },
    near: {
      type: Near,
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
    sort: FairSorts,
    status: EventStatus,
  },
  resolve: async (
    _root,
    {
      fairOrganizerID,
      hasFullFeature,
      hasHomepageSection,
      hasListing,
      ..._options
    },
    { fairsLoader }
  ) => {
    const options: any = {
      fair_organizer_id: fairOrganizerID,
      has_full_feature: hasFullFeature,
      has_homepage_section: hasHomepageSection,
      has_listing: hasListing,
      ..._options,
    }
    let gravityOptions = options
    if (options.near) {
      gravityOptions = _.assign(options, {
        // eslint-disable-line no-param-reassign
        near: `${options.near.lat},${options.near.lng}`,
        max_distance: options.near.max_distance,
      })
    }
    if (options.ids) {
      gravityOptions.id = options.ids
      delete gravityOptions.ids
    }
    const { body: fairs } = await fairsLoader(gravityOptions)
    return fairs
  },
}

export default Fairs

export const fairsConnection: GraphQLFieldConfig<
  void,
  ResolverContext,
  {
    fairOrganizerID?: string
    hasFullFeature?: boolean
    hasHomepageSection?: boolean
    hasListing?: boolean
    ids?: string[]
    near?: NearType
    sort?: FairSortsType
    status?: EventStatusType
  } & CursorPageable
> = {
  type: fairConnection.connectionType,
  args: pageable({
    fairOrganizerID: { type: GraphQLString },
    hasFullFeature: { type: GraphQLBoolean },
    hasHomepageSection: { type: GraphQLBoolean },
    hasListing: { type: GraphQLBoolean },
    ids: {
      type: new GraphQLList(GraphQLString),
      description:
        "Only return fairs matching specified IDs. Accepts list of IDs.",
    },
    near: { type: Near },
    sort: FairSorts,
    status: EventStatus,
  }),
  description: "A list of fairs",
  resolve: async (_root, args, { fairsLoader }) => {
    const { size, offset, page } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await fairsLoader({
      fair_organizer_id: args.fairOrganizerID,
      has_full_feature: args.hasFullFeature,
      has_homepage_section: args.hasHomepageSection,
      has_listing: args.hasListing,
      id: args.ids,
      page,
      size,
      sort: args.sort,
      status: args.status,
      total_count: true,
      ...(args.near
        ? {
            near: `${args.near.lat},${args.near.lng}`,
            max_distance: args.near.maxDistance,
          }
        : {}),
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArraySlice(
        body,
        pick(args, "before", "after", "first", "last"),
        {
          arrayLength: totalCount,
          sliceStart: offset,
        }
      ),
    }
  },
}
