import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const subGroupfields = {
  id: {
    type: GraphQLString,
  },
  name: {
    type: GraphQLString,
  },
  channel: {
    type: GraphQLString,
  },
  status: {
    type: new GraphQLNonNull(
      new GraphQLEnumType({
        name: "SubGroupStatus",
        values: {
          SUBSCRIBED: { value: "Subscribed" },
          UNSUBSCRIBED: { value: "Unsubscribed" },
        },
      })
    ),
  },
}

const NotificationPreferenceType = new GraphQLObjectType({
  name: "NotificationPreference",
  fields: subGroupfields,
})

export const notificationPreferences: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(NotificationPreferenceType))
  ),
  description: "User's notification preferences",
  args: {
    authenticationToken: {
      type: GraphQLString,
    },
  },
  resolve: (
    _root,
    args,
    { anonNotificationPreferencesLoader, notificationPreferencesLoader }
  ) => {
    if (notificationPreferencesLoader) {
      return notificationPreferencesLoader()
    }

    return anonNotificationPreferencesLoader(args.authenticationToken)
  },
}
