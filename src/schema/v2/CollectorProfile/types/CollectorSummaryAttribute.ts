import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const CollectorAttributeKeyEnum = new GraphQLEnumType({
  name: "CollectorAttributeKey",
  values: {
    IS_REPEAT_BUYER: {
      value: "is_repeat_buyer",
    },
    IS_CONFIRMED_BUYER: {
      value: "is_confirmed_buyer",
    },
    IS_RECENT_SIGN_UP: {
      value: "is_recent_sign_up",
    },
    IS_ACTIVE_USER: {
      value: "is_active_user",
    },
    HAS_DEMONSTRATED_BUDGET: {
      value: "has_demonstrated_budget",
    },
    HAS_BOUGHT_WORKS_FROM_PARTNER: {
      value: "has_bought_works_from_partner",
    },
    HAS_BOUGHT_WORKS_FROM_SIMILAR_PARTNERS: {
      value: "has_bought_works_from_similar_partners",
    },
    HAS_INQUIRED_WITH_SIMILAR_PARTNERS: {
      value: "has_inquired_with_similar_partners",
    },
    HAS_FOLLOWED_PARTNER: {
      value: "has_followed_partner",
    },
    HAS_INQUIRED_ABOUT_WORKS_FROM_PARTNER: {
      value: "has_inquired_about_works_from_partner",
    },
    HAS_SAVED_WORKS_FROM_PARTNER: {
      value: "has_saved_works_from_partner",
    },
    HAS_INQUIRED_ABOUT_WORKS_FROM_ARTIST: {
      value: "has_inquired_about_works_from_artist",
    },
    HAS_ENABLED_ALERTS_ON_ARTIST: {
      value: "has_enabled_alerts_on_artist",
    },
    HAS_ENABLED_ALERTS_ON_A_REPRESENTED_ARTIST: {
      value: "has_enabled_alerts_on_a_represented_artist",
    },
    HAS_FOLLOWED_A_REPRESENTED_ARTIST: {
      value: "has_followed_a_represented_artist",
    },
  },
})

export const CollectorSummaryAttributeType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CollectorSummaryAttribute",
  fields: {
    key: {
      type: new GraphQLNonNull(CollectorAttributeKeyEnum),
      description: "The key identifying this attribute type",
    },
    label: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The display text shown to the user",
    },
    value: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Whether this attribute is true for the collector",
    },
  },
})
