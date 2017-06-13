import { omit } from "lodash"
import gravity from "lib/loaders/gravity"
import total from "lib/loaders/total"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"
import moment from "moment"
import cached from "./fields/cached"
import date from "./fields/date"
import Profile from "./profile"
import Image from "./image"
import { showConnection } from "./show"
import Location from "./location"
import { GravityIDFields } from "./object_identification"
import { GraphQLObjectType, GraphQLID, GraphQLString, GraphQLBoolean, GraphQLNonNull, GraphQLEnumType } from "graphql"

const FairOrganizerType = new GraphQLObjectType({
  name: "organizer",
  fields: {
    profile_id: {
      type: GraphQLID,
    },
    profile: {
      type: Profile.type,
      resolve: ({ profile_id }) => {
        return gravity(`profile/${profile_id}`).catch(() => null)
      },
    },
  },
})

export const ShowsSort = new GraphQLEnumType({
  name: "ShowSort",
  values: {
    START_AT_ASC: {
      value: "start_at",
    },
    START_AT_DESC: {
      value: "-start_at",
    },
    END_AT_ASC: {
      value: "end_at",
    },
    END_AT_DESC: {
      value: "-end_at",
    },
    UPDATED_AT_ASC: {
      value: "updated_at",
    },
    UPDATED_AT_DESC: {
      value: "-updated_at",
    },
    NAME_ASC: {
      value: "name",
    },
    NAME_DESC: {
      value: "-name",
    },
    FEATURED_ASC: {
      value: "featured",
    },
    FEATURED_DESC: {
      value: "-featured",
    },
    SORTABLE_NAME_ASC: {
      value: "sortable_name",
    },
    SORTABLE_NAME_DESC: {
      value: "-sortable_name",
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
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    location: {
      type: Location.type,
      resolve: ({ id, location, published }, options) => {
        if (location) {
          return location
        } else if (published) {
          return gravity(`fair/${id}`, options).then(fair => {
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
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || (organizer && organizer.profile_id)
        return (
          gravity(`profile/${id}`)
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
      }),
      resolve: ({ id }, options) => {
        const path = `fair/${id}/shows`
        const gravityOptions = omit(parseRelayOptions(options), ["page"])

        return Promise.all([
          total(path, Object.assign({}, gravityOptions, { size: 0 })),
          gravity(path, gravityOptions),
        ]).then(([count, { results }]) => {
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
  resolve: (root, { id }) => gravity(`fair/${id}`),
}

export default Fair
