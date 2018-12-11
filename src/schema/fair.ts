import { omit } from "lodash"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import moment from "moment"
import cached from "./fields/cached"
import date from "./fields/date"
import Profile from "./profile"
import Image from "./image"
import { showConnection } from "./show"
import Location from "./location"
import { GravityIDFields } from "./object_identification"
import filterArtworks from "./filter_artworks"
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { totalViaLoader } from "lib/total"
import ShowSort from "./sorts/show_sort"
import { allViaLoader } from "lib/all"

const FairOrganizerType = new GraphQLObjectType({
  name: "organizer",
  fields: {
    profile_id: {
      type: GraphQLID,
    },
    profile: {
      type: Profile.type,
      resolve: (
        { profile_id },
        _options,
        _request,
        { rootValue: { profileLoader } }
      ) => {
        return profileLoader(profile_id).catch(() => null)
      },
    },
  },
})

const FairType = new GraphQLObjectType({
  name: "Fair",
  fields: () => ({
    ...GravityIDFields,
    cached,
    banner_size: {
      type: GraphQLString,
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
      description: "Are we currently in the fair's active period?",
      resolve: ({ autopublish_artworks_at, end_at }) => {
        const start = moment.utc(autopublish_artworks_at).subtract(7, "days")
        const end = moment.utc(end_at).add(14, "days")
        return moment.utc().isBetween(start, end)
      },
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
      resolve: (
        { id, location, published },
        options,
        _request,
        { rootValue: { fairLoader } }
      ) => {
        if (location) {
          return location
        } else if (published) {
          return fairLoader(id, options).then(fair => {
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
        _request,
        { rootValue: { profileLoader } }
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
      resolve: (
        { id },
        options,
        _request,
        { rootValue: { fairBoothsLoader } }
      ) => {
        const gravityOptions = omit(
          convertConnectionArgsToGravityArgs(options),
          ["page"]
        )
        gravityOptions.sort = gravityOptions.sort || "-featured"

        return Promise.all([
          totalViaLoader(fairBoothsLoader, id, gravityOptions),
          fairBoothsLoader(id, gravityOptions),
        ]).then(([count, { body: { results } }]) => {
          return connectionFromArraySlice(results, options, {
            arrayLength: count,
            sliceStart: gravityOptions.offset,
          })
        })
      },
    },
    start_at: date,
    end_at: date,
    organizer: {
      type: FairOrganizerType,
    },
    published: {
      type: GraphQLBoolean,
      deprecationReason: "Prefix Boolean returning fields with `is_`",
    },
    tagline: {
      type: GraphQLString,
    },
    exhibitors_grouped_by_name: {
      description: "The exhibitors with booths in this fair.",
      type: new GraphQLList(
        new GraphQLObjectType({
          name: "FairExhibitorsGroup",
          fields: {
            letter: {
              type: GraphQLString,
              description: "Letter exhibitors group belongs to",
            },
            exhibitors: {
              type: new GraphQLList(GraphQLString),
              description: "Exhibitors sorted by name",
            },
          },
        })
      ),
      resolve: (
        root,
        _options,
        _request,
        { rootValue: { fairPartnersLoader } }
      ) => {
        if (!root._id) {
          return []
        }
        const exhibitor_groups: {
          [letter: string]: { letter: string; exhibitors: [String] }
        } = {}
        const fetch = allViaLoader(fairPartnersLoader, root._id)

        return fetch.then(result => {
          const fairExhibitors = result.sort((a, b) => {
            const asc = a.name.toLowerCase()
            const desc = b.name.toLowerCase()
            if (asc < desc) return -1
            if (asc > desc) return 1
            return 0
          })
          for (let fairExhibitor of fairExhibitors) {
            const names = fairExhibitor.name.split(" ")
            const firstName = names[0]
            const letter = firstName.charAt(0).toUpperCase()
            if (exhibitor_groups[letter]) {
              exhibitor_groups[letter].exhibitors.push(fairExhibitor.name)
            } else {
              exhibitor_groups[letter] = {
                letter,
                exhibitors: [fairExhibitor.name],
              }
            }
          }
          return Object.values(exhibitor_groups)
        })
      },
    },
    filteredArtworks: filterArtworks("fair_id"),
  }),
})

const Fair = {
  type: FairType,
  description: "A Fair",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Fair",
    },
  },
  resolve: (_root, { id }, _request, { rootValue: { fairLoader } }) => {
    return fairLoader(id)
  },
}

export default Fair
