import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import {
  ArtworkDuplicatePairType,
  ArtworkDuplicatePairStatusEnum,
} from "./artworkDuplicatePairType"

const ArtworkDuplicatePairConnection = connectionWithCursorInfo({
  nodeType: ArtworkDuplicatePairType,
}).connectionType

export const artworkDuplicatePairsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: ArtworkDuplicatePairConnection,
  description: "List artwork duplicate pairs for a partner",
  args: pageable({
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner",
    },
    status: {
      type: ArtworkDuplicatePairStatusEnum,
      description: "Filter by pair status",
    },
    detectionVersion: {
      type: GraphQLString,
      description: "Filter by detection version",
    },
    mergeable: {
      type: GraphQLBoolean,
      description:
        "Filter by whether the pair can be merged (neither artwork is both published and listed on Artsy)",
    },
  }),
  resolve: async (_root, args, { artworkDuplicatePairsLoader }) => {
    if (!artworkDuplicatePairsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: Record<string, any> = {
      partner_id: args.partnerId,
      size,
      page,
      total_count: true,
    }

    if (args.status) {
      gravityArgs.status = args.status
    }

    if (args.detectionVersion) {
      gravityArgs.detection_version = args.detectionVersion
    }

    if (args.mergeable != null) {
      gravityArgs.mergeable = args.mergeable
    }

    const { body, headers } = await artworkDuplicatePairsLoader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body,
      args,
    })
  },
}

export const ArtworkDuplicatePairsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: ArtworkDuplicatePairConnection,
  description: "Artwork duplicate pairs for this partner",
  args: pageable({
    status: {
      type: ArtworkDuplicatePairStatusEnum,
      description: "Filter by pair status",
    },
    detectionVersion: {
      type: GraphQLString,
      description: "Filter by detection version",
    },
    mergeable: {
      type: GraphQLBoolean,
      description:
        "Filter by whether the pair can be merged (neither artwork is both published and listed on Artsy)",
    },
  }),
  resolve: async ({ id }, args, { artworkDuplicatePairsLoader }) => {
    if (!artworkDuplicatePairsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs: Record<string, any> = {
      partner_id: id,
      size,
      page,
      total_count: true,
    }

    if (args.status) {
      gravityArgs.status = args.status
    }

    if (args.detectionVersion) {
      gravityArgs.detection_version = args.detectionVersion
    }

    if (args.mergeable != null) {
      gravityArgs.mergeable = args.mergeable
    }

    const { body, headers } = await artworkDuplicatePairsLoader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body,
      args,
    })
  },
}
