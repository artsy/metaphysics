import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql"
import { SlugAndInternalIDFields } from "./object_identification"
import Profile from "./profile"
import { ResolverContext } from "types/graphql"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "./fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { pick } from "lodash"
import { fairConnection } from "./fair"
import { articleConnection } from "./article"
import ArticleSorts, { ArticleSort } from "./sorts/article_sorts"

export const FairOrganizerType = new GraphQLObjectType<any, ResolverContext>({
  name: "FairOrganizer",
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      about: {
        type: GraphQLString,
      },
      articlesConnection: {
        description: "A connection of articles related to a partner.",
        type: articleConnection.connectionType,
        args: pageable({
          sort: ArticleSorts,
          page: { type: GraphQLInt },
          inEditorialFeed: {
            type: GraphQLBoolean,
            description:
              "Articles that are ready to be publicly viewed in the feed by everyone.",
          },
        }),
        resolve: async (
          { profile_id },
          args: {
            inEditorialFeed?: Boolean
            sort?: ArticleSort
          } & CursorPageable,
          { articlesLoader, fairsLoader }
        ) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const gravityOptions = {
            fair_organizer_id: profile_id,
            size: 100,
          }

          const { body } = await fairsLoader(gravityOptions)

          interface ArticleArgs {
            published: boolean
            fair_ids: [string]
            limit: number
            count: boolean
            offset: number
            sort?: ArticleSort
            in_editorial_feed?: Boolean
          }

          const articleArgs: ArticleArgs = {
            published: true,
            fair_ids: body.map((fair) => fair._id),
            limit: size,
            count: true,
            offset,
            sort: args.sort,
            in_editorial_feed: args.inEditorialFeed,
          }

          const { results, count } = await articlesLoader(articleArgs)

          return {
            totalCount: count,
            pageCursors: createPageCursors({ ...args, page, size }, count),
            ...connectionFromArraySlice(results, args, {
              arrayLength: count,
              sliceStart: offset,
            }),
          }
        },
      },
      fairsConnection: {
        type: fairConnection.connectionType,
        args: pageable(),
        resolve: async ({ profile_id }, args, { fairsLoader }) => {
          const { size, page, offset } = convertConnectionArgsToGravityArgs(
            args
          )
          const gravityOptions = {
            fair_organizer_id: profile_id,
            total_count: true,
            size,
            page,
          }

          const { body, headers } = await fairsLoader(gravityOptions)
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArraySlice(
              body,
              pick(args, "before", "after", "first", "last"),
              { sliceStart: offset, arrayLength: totalCount }
            ),
          }
        },
      },
      name: {
        type: GraphQLString,
      },
      profileID: {
        type: GraphQLID,
        resolve: ({ profile_id }) => profile_id,
      },
      profile: {
        type: Profile.type,
        resolve: ({ profile_id }, _options, { profileLoader }) => {
          return profileLoader(profile_id).catch(() => null)
        },
      },
      website: {
        type: GraphQLString,
      },
    }
  },
})

const FairOrganizer: GraphQLFieldConfig<void, ResolverContext> = {
  type: FairOrganizerType,
  description: "A fair organizer, e.g. The Armory Show",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Fair organizer",
    },
  },
  resolve: (_root, { id }, { fairOrganizerLoader }) => {
    return fairOrganizerLoader(id)
  },
}

export default FairOrganizer
