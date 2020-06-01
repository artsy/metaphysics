import { omit, map } from "lodash"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { dateRange, formattedOpeningHours } from "lib/date"
import { artistConnection } from "./artist"
import moment from "moment"
import cached from "./fields/cached"
import date from "./fields/date"
import numeral from "./fields/numeral"
import Profile from "./profile"
import Image from "./image"
import Artist from "./artist"
import Partner from "./partner"
import { showConnection } from "./show"
import Location from "./location"
import { SlugAndInternalIDFields, SlugIDField } from "./object_identification"
import filterArtworks from "./filter_artworks"
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import ShowSort from "./sorts/show_sort"
import { allViaLoader } from "lib/all"
import { FairArtistSortsType } from "./sorts/fairArtistSorts"
import { ResolverContext } from "types/graphql"
import { sponsoredContentForFair } from "lib/sponsoredContent"
import { deprecate } from "lib/deprecation"

const FollowedContentType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowedContent",
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
    },
    galleries: {
      type: new GraphQLList(Partner.type),
    },
  }),
})

const FairOrganizerType = new GraphQLObjectType<any, ResolverContext>({
  name: "organizer",
  fields: {
    ...SlugAndInternalIDFields,
    profile_id: {
      type: GraphQLID,
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
  },
})

export const FairType = new GraphQLObjectType<any, ResolverContext>({
  name: "Fair",
  fields: () => ({
    ...SlugAndInternalIDFields,
    about: {
      type: GraphQLString,
    },
    followed_content: {
      type: FollowedContentType,
      resolve: (
        fair,
        _options,
        { followedArtistsLoader, followedPartnersLoader }
      ) => {
        if (!followedArtistsLoader || !followedPartnersLoader) return null
        const fair_id = fair.id

        return {
          artists: followedArtistsLoader({ fair_id }).then(({ body }) => {
            return body.map((artist_follow) => artist_follow.artist)
          }),
          galleries: followedPartnersLoader({
            fair_id,
            owner_types: ["PartnerGallery"],
          }).then(({ body }) => {
            return body.map((profile_follow) => profile_follow.profile.owner)
          }),
        }
      },
    },
    artists: {
      type: artistConnection,
      args: pageable({
        sort: {
          type: FairArtistSortsType,
          description: "Sorts for artists in a fair",
        },
      }),
      resolve: ({ id }, options, { fairArtistsLoader, artistsLoader }) => {
        const gravityOptions = omit(
          convertConnectionArgsToGravityArgs(options),
          ["page"]
        )

        gravityOptions.total_count = true

        return fairArtistsLoader(id, gravityOptions).then(
          ({ body, headers }) => {
            return artistsLoader({ ids: map(body, "artist_id") }).then(
              (artists) => {
                return connectionFromArraySlice(artists, options, {
                  arrayLength: parseInt(headers["x-total-count"] || "0", 10),
                  sliceStart: gravityOptions.offset,
                })
              }
            )
          }
        )
      },
    },
    cached,
    banner_size: {
      type: GraphQLString,
    },
    counts: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "FairCounts",
        fields: {
          artists: numeral(({ artists_count }) => artists_count),
          artworks: numeral(({ artworks_count }) => artworks_count),
          partners: numeral(({ partners_count }) => partners_count),
          partner_shows: numeral(
            ({ partner_shows_count }) => partner_shows_count
          ),
        },
      }),
      resolve: (fair) => fair,
    },
    exhibition_period: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      resolve: ({ start_at, end_at }) => dateRange(start_at, end_at, "UTC"),
    },
    formattedOpeningHours: {
      type: GraphQLString,
      description:
        "A formatted description of when the fair starts or closes or if it is closed",
      resolve: ({ start_at, end_at }) =>
        formattedOpeningHours(start_at, end_at, "UTC"),
    },
    has_full_feature: {
      type: GraphQLBoolean,
    },
    has_homepage_section: {
      type: GraphQLBoolean,
    },
    has_large_banner: {
      type: GraphQLBoolean,
    },
    has_listing: {
      type: GraphQLBoolean,
    },
    hours: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || (organizer && organizer.profile_id)
        return `/${id}`
      },
    },
    image: Image,
    is_active: {
      type: GraphQLBoolean,
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "isActive",
      }),
      resolve: ({ autopublish_artworks_at, end_at }) => {
        const start = moment.utc(autopublish_artworks_at).subtract(7, "days")
        const end = moment.utc(end_at).add(14, "days")
        return moment.utc().isBetween(start, end)
      },
    },
    isActive: {
      type: GraphQLBoolean,
      description: "Are we currently in the fair's active period?",
      resolve: ({ active_start_at }) => {
        const activeStart = moment.utc(active_start_at)
        const now = moment.utc()
        return now.isAfter(activeStart)
      },
    },
    links: {
      type: GraphQLString,
    },
    mobile_image: {
      /**
       * cannot use Image normalizer because it will grab other image versions; mobile icon is expected to be correctly
       * sized
       */
      type: Image.type,
    },
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    location: {
      type: Location.type,
      resolve: ({ id, location, published }, options, { fairLoader }) => {
        if (location) {
          return location
        } else if (published) {
          return fairLoader(id, options).then((fair) => {
            return fair.location
          })
        }
        return null
      },
    },
    name: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: (
        { default_profile_id, organizer },
        _options,
        { profileLoader }
      ) => {
        const id = default_profile_id || (organizer && organizer.profile_id)
        return (
          profileLoader(id)
            // Some profiles are private and return 403
            .catch(() => null)
        )
      },
    },
    shows_connection: {
      type: showConnection,
      description:
        "This connection only supports forward pagination. We're replacing Relay's default cursor with one from Gravity.",
      args: pageable({
        section: {
          type: GraphQLString,
          description: "Number of artworks to return",
        },
        sort: {
          type: ShowSort,
          description: "Sorts for shows in a fair",
        },
      }),
      resolve: ({ id }, options, { fairBoothsLoader }) => {
        interface GravityOptions {
          size: number
          sort: string
          cursor?: string
          section: string
        }
        const gravityOptions: GravityOptions = {
          sort: options.sort || "-featured",
          section: options.section,
          size: options.first,
        }
        if (!!options.after) {
          gravityOptions.cursor = options.after
        }
        return fairBoothsLoader(id, gravityOptions).then(
          ({ body: { results, next } }) => {
            const connection = connectionFromArraySlice(results, options, {
              arrayLength: results.length,
              sliceStart: 0,
            })
            connection.pageInfo.endCursor = next
            connection.pageInfo.hasNextPage = !!next
            return connection
          }
        )
      },
    },
    start_at: date,
    end_at: date,
    active_start_at: date,
    organizer: {
      type: FairOrganizerType,
    },
    published: {
      type: GraphQLBoolean,
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "is_published",
      }),
    },
    tagline: {
      type: GraphQLString,
    },
    ticketsLink: {
      type: GraphQLString,
      resolve: ({ tickets_link }) => tickets_link,
    },
    exhibitors_grouped_by_name: {
      description: "The exhibitors with booths in this fair with letter.",
      type: new GraphQLList(
        new GraphQLObjectType<any, ResolverContext>({
          name: "FairExhibitorsGroup",
          fields: {
            letter: {
              type: GraphQLString,
              description: "Letter exhibitors group belongs to",
            },
            exhibitors: {
              description: "The exhibitor data.",
              type: new GraphQLList(
                new GraphQLObjectType<any, ResolverContext>({
                  name: "FairExhibitor",
                  fields: {
                    ...SlugIDField,
                    name: {
                      type: GraphQLString,
                      description: "Exhibitor name",
                    },
                    partner_id: {
                      type: GraphQLString,
                      description: "Exhibitors _id",
                    },
                    profile_id: {
                      type: GraphQLString,
                      description: "Partner default profile id",
                    },
                  },
                })
              ),
            },
          },
        })
      ),
      resolve: (root, _options, { fairPartnersLoader }) => {
        if (!root._id) {
          return []
        }
        const exhibitor_groups: {
          [letter: string]: {
            letter: string
            exhibitors: [
              {
                name: string
                profile_id: string
                id: string
                partner_id: string
              }
            ]
          }
        } = {}
        const fetch = allViaLoader(fairPartnersLoader, { path: root._id })

        return fetch.then((result) => {
          const fairExhibitors = result.sort((a, b) => {
            const asc = a.name.toLowerCase()
            const desc = b.name.toLowerCase()
            if (asc < desc) return -1
            if (asc > desc) return 1
            return 0
          })
          for (const fairExhibitor of fairExhibitors) {
            const names = fairExhibitor.name.split(" ")
            const firstName = names[0]
            const letter = firstName.charAt(0).toUpperCase()
            if (exhibitor_groups[letter]) {
              exhibitor_groups[letter].exhibitors.push({
                name: fairExhibitor.name,
                profile_id: fairExhibitor.partner_show_ids[0],
                id: fairExhibitor.id,
                partner_id: fairExhibitor.partner_id,
              })
            } else {
              exhibitor_groups[letter] = {
                letter,
                exhibitors: [
                  {
                    name: fairExhibitor.name,
                    profile_id: fairExhibitor.partner_show_ids[0],
                    id: fairExhibitor.id,
                    partner_id: fairExhibitor.partner_id,
                  },
                ],
              }
            }
          }
          return Object.values(exhibitor_groups)
        })
      },
    },
    filteredArtworks: filterArtworks("fair_id"),
    sponsoredContent: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "FairSponsoredContent",
        fields: {
          activationText: {
            type: GraphQLString,
          },
          pressReleaseUrl: {
            type: GraphQLString,
          },
        },
      }),
      resolve: (fair) => sponsoredContentForFair(fair.id),
    },
  }),
})

const Fair: GraphQLFieldConfig<void, ResolverContext> = {
  type: FairType,
  description: "A Fair",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Fair",
    },
  },
  resolve: (_root, { id }, { fairLoader }) => {
    return fairLoader(id)
  },
}

export default Fair
