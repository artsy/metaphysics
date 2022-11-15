import { SaleType } from "./sale/index"
import SaleSorts from "./sale/sorts"
import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { BodyAndHeaders } from "lib/loaders"

export const SalesConnectionField: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({ nodeType: SaleType }).connectionType,
  description: "A list of Sales",
  args: pageable({
    // TODO: This wasn’t needed by Emission and is a tad awkward of an arg. If
    //       this was meant for refetching purposes, then we should add a plural
    //       `nodes` root field and use that instead.
    //
    auctionState: {
      type: new GraphQLEnumType({
        name: "AuctionState",
        values: {
          OPEN: {
            value: "open",
          },
          UPCOMING: {
            value: "upcoming",
          },
          CLOSED: {
            value: "closed",
          },
        },
      }),
    },
    ids: {
      type: new GraphQLList(GraphQLString),
      description: `
        Only return sales matching specified ids.
        Accepts list of ids.
      `,
    },
    isAuction: {
      description: "Limit by auction.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    live: {
      description: "Limit by live status.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    published: {
      description: "Limit by published status.",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    registered: {
      description:
        "Returns sales the user has registered for if true, returns sales the user has not registered for if false.",
      type: GraphQLBoolean,
      defaultValue: undefined,
    },
    sort: SaleSorts,
  }),
  resolve: async (
    _root,
    {
      auctionState,
      ids,
      isAuction,
      live,
      published,
      sort,
      registered,
      ...paginationArgs
    },
    {
      unauthenticatedLoaders: { salesLoaderWithHeaders: loaderWithCache },
      authenticatedLoaders: { salesLoaderWithHeaders: loaderWithoutCache },
    }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(
      paginationArgs
    )

    const loader =
      typeof registered === "boolean" ? loaderWithoutCache : loaderWithCache
    const { body: sales, headers } = ((await loader!(
      {
        auction_state: auctionState,
        id: ids,
        is_auction: isAuction,
        live,
        published,
        sort,
        registered,
        page,
        size,
        total_count: true,
      },
      { headers: true }
    )) as any) as BodyAndHeaders

    return connectionFromArraySlice(sales, paginationArgs, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: offset,
    })
  },
}
