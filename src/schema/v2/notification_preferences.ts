import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const convertSubGroups = (subGroups) => {
  const gravityGroups = subGroups.reduce((previous, current) => {
    previous[current.name] = current.status.toLowerCase()
    return previous
  }, {})

  const params = { subscription_groups: gravityGroups }

  return params
}

const subGroupfields = {
  id: {
    type: new GraphQLNonNull(GraphQLString),
  },
  name: {
    type: new GraphQLNonNull(GraphQLString),
  },
  channel: {
    type: new GraphQLNonNull(GraphQLString),
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

const NotificationPreferenceInputType = new GraphQLInputObjectType({
  name: "NotificationPreferenceInput",
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

export const updateNotificationPreferencesMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "updateNotificationPreferencesMutation",
  description: "Update notification preferences.",
  inputFields: {
    authenticationToken: {
      type: GraphQLString,
    },
    subscriptionGroups: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(NotificationPreferenceInputType))
      ),
    },
  },
  outputFields: {},
  mutateAndGetPayload: (
    args,
    {
      anonUpdateNotificationPreferencesLoader,
      updateNotificationPreferencesLoader,
    }
  ) => {
    const subGroups = args.subscriptionGroups
    const params = convertSubGroups(subGroups)

    if (updateNotificationPreferencesLoader) {
      return updateNotificationPreferencesLoader(params)
    }

    return anonUpdateNotificationPreferencesLoader(
      args.authenticationToken,
      params
    )
  },
})
