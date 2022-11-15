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
import { createPageCursors } from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import { pick } from "lodash"
import { fairConnection } from "./fair"
import { articleConnection } from "./article"
import ArticleSorts, { ArticleSort } from "./sorts/article_sorts"
import { formatMarkdownValue, markdown } from "./fields/markdown"
import { FairSorts } from "./sorts/fair_sorts"
import { EventStatus } from "./input_fields/event_status"

export const FairOrganizerType = new GraphQLObjectType<any, ResolverContext>({
  name: "FairOrganizer",
  fields: () => {
    return {
      ...SlugAndInternalIDFields,
      about: {
        type: GraphQLString,
        args: {
          ...markdown().args,
        },
        resolve: ({ about }, { format }) => {
          return formatMarkdownValue(about, format).trim()
        },
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
              "Get only articles with with 'standard', 'feature', 'series' or 'video' layouts.",
          },
        }),
        resolve: async (
          { id },
          args: {
            inEditorialFeed?: boolean
            sort?: ArticleSort
          } & CursorPageable,
          { articlesLoader, fairsLoader }
        ) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const gravityOptions = {
            fair_organizer_id: id,
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
            in_editorial_feed?: boolean
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
        args: {
          hasFullFeature: {
            type: GraphQLBoolean,
          },
          hasHomepageSection: {
            type: GraphQLBoolean,
          },
          hasListing: {
            type: GraphQLBoolean,
          },
          sort: FairSorts,
          status: EventStatus,
          ...pageable(),
        },
        resolve: async (
          { id },
          {
            fairOrganizerID,
            hasFullFeature,
            hasHomepageSection,
            hasListing,
            sort,
            status,
            ...args
          },
          { fairsLoader }
        ) => {
          const connectionArgs = pick(args, "before", "after", "first", "last")
          const { size, page, offset } = convertConnectionArgsToGravityArgs(
            connectionArgs
          )
          const gravityOptions = {
            fair_organizer_id: id,
            has_full_feature: hasFullFeature,
            has_homepage_section: hasHomepageSection,
            has_listing: hasListing,
            page,
            size,
            sort,
            status,
            total_count: true,
          }

          const { body, headers } = await fairsLoader(gravityOptions)
          const totalCount = parseInt(headers["x-total-count"] || "0", 10)

          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArraySlice(body, connectionArgs, {
              sliceStart: offset,
              arrayLength: totalCount,
            }),
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
