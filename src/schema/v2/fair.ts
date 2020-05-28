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
import { ShowsConnection } from "./show"
import { LocationType } from "./location"
import {
  SlugAndInternalIDFields,
  SlugIDField,
  NodeInterface,
} from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import ShowSorts from "./sorts/show_sorts"
import { allViaLoader } from "lib/all"
import { FairArtistSortsType } from "./sorts/fairArtistSorts"
import { ResolverContext } from "types/graphql"
import { sponsoredContentForFair } from "lib/sponsoredContent"
import { connectionWithCursorInfo } from "./fields/pagination"

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
  },
})

export const FairType = new GraphQLObjectType<any, ResolverContext>({
  name: "Fair",
  interfaces: () => {
    const {
      EntityWithFilterArtworksConnectionInterface,
    } = require("./filterArtworksConnection")
    return [NodeInterface, EntityWithFilterArtworksConnectionInterface]
  },
  fields: () => {
    const { filterArtworksConnection } = require("./filterArtworksConnection")
    return {
      ...SlugAndInternalIDFields,
      about: {
        type: GraphQLString,
      },
      followedContent: {
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
      artistsConnection: {
        type: artistConnection.connectionType,
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
      bannerSize: {
        type: GraphQLString,
        resolve: ({ banner_size }) => banner_size,
      },
      counts: {
        type: new GraphQLObjectType<any, ResolverContext>({
          name: "FairCounts",
          fields: {
            artists: numeral(({ artists_count }) => artists_count),
            artworks: numeral(({ artworks_count }) => artworks_count),
            partners: numeral(({ partners_count }) => partners_count),
            partnerShows: numeral(
              ({ partner_shows_count }) => partner_shows_count
            ),
          },
        }),
        resolve: (fair) => fair,
      },
      exhibitionPeriod: {
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
      hasFullFeature: {
        type: GraphQLBoolean,
        resolve: ({ has_full_feature }) => has_full_feature,
      },
      hasHomepageSection: {
        type: GraphQLBoolean,
        resolve: ({ has_homepage_section }) => has_homepage_section,
      },
      hasLargeBanner: {
        type: GraphQLBoolean,
        resolve: ({ has_large_banner }) => has_large_banner,
      },
      hasListing: {
        type: GraphQLBoolean,
        resolve: ({ has_listing }) => has_listing,
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
      mobileImage: {
        /**
         * cannot use Image normalizer because it will grab other image versions; mobile icon is expected to be correctly
         * sized
         */
        type: Image.type,
        resolve: ({ mobile_image }) => mobile_image,
      },
      isPublished: {
        type: GraphQLBoolean,
        resolve: ({ published }) => published,
      },
      location: {
        type: LocationType,
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
      showsConnection: {
        type: ShowsConnection.connectionType,
        description:
          "This connection only supports forward pagination. We're replacing Relay's default cursor with one from Gravity.",
        args: pageable({
          section: {
            type: GraphQLString,
            description: "Number of artworks to return",
          },
          sort: {
            type: ShowSorts,
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
      startAt: date,
      endAt: date,
      activeStartAt: date,
      organizer: {
        type: FairOrganizerType,
      },
      tagline: {
        type: GraphQLString,
      },
      ticketsLink: {
        type: GraphQLString,
        resolve: ({ tickets_link }) => tickets_link,
      },
      exhibitorsGroupedByName: {
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
                      partnerID: {
                        type: GraphQLString,
                        description: "Exhibitors _id",
                        resolve: ({ partner_id }) => partner_id,
                      },
                      profileID: {
                        type: GraphQLString,
                        description: "Partner default profile id",
                        resolve: ({ profile_id }) => profile_id,
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
      filterArtworksConnection: filterArtworksConnection("fair_id"),
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
    }
  },
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
    // TODO: blacklist filterArtworksConnection
    return fairLoader(id)
  },
}

export default Fair

export const fairConnection = connectionWithCursorInfo({ nodeType: FairType })
