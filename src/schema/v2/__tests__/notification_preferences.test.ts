import gql from "lib/gql"
import { convertSubGroups } from "../notification_preferences"
import { runQuery } from "../test/utils"

describe("convertSubGroups", () => {
  it("converts to params for gravity", () => {
    const subGroups = [
      { id: "abc", name: "daily", channel: "email", status: "Subscribed" },
    ]

    const params = convertSubGroups(subGroups)

    expect(params).toEqual({
      subscription_groups: { daily: "subscribed" },
    })
  })
})

describe("notificationPreferences", () => {
  const gravityNotificationPreferences = [
    {
      id: "abc",
      name: "GroupA",
      channel: "email",
      status: "Subscribed",
    },
    {
      id: "abc",
      name: "GroupB",
      channel: "push",
      status: "Unsubscribed",
    },
  ]

  const expectedNotificationPreferences = [
    {
      id: "abc",
      name: "GroupA",
      channel: "email",
      status: "SUBSCRIBED",
    },
    {
      id: "abc",
      name: "GroupB",
      channel: "push",
      status: "UNSUBSCRIBED",
    },
  ]

  it("returns notification preferences for authenticated user", async () => {
    const query = gql`
      {
        notificationPreferences {
          id
          name
          channel
          status
        }
      }
    `

    const context = {
      notificationPreferencesLoader: () =>
        Promise.resolve(gravityNotificationPreferences),
    }

    const data = await runQuery(query, context)
    expect(data!.notificationPreferences).toEqual(
      expectedNotificationPreferences
    )
  })

  it("returns notification preferences for unathenticated user", async () => {
    const query = gql`
      {
        notificationPreferences {
          id
          name
          channel
          status
        }
      }
    `

    const context = {
      anonNotificationPreferencesLoader: () =>
        Promise.resolve(gravityNotificationPreferences),
    }

    const data = await runQuery(query, context)
    expect(data!.notificationPreferences).toEqual(
      expectedNotificationPreferences
    )
  })
})

describe("updateNotificationPreferencesMutation", () => {
  const gravityNotificationPreferences = [
    {
      id: "abc",
      name: "GroupA",
      channel: "email",
      status: "Subscribed",
    },
    {
      id: "abc",
      name: "GroupB",
      channel: "push",
      status: "Unsubscribed",
    },
  ]

  const expectedNotificationPreferences = [
    {
      id: "abc",
      name: "GroupA",
      channel: "email",
      status: "SUBSCRIBED",
    },
    {
      id: "abc",
      name: "GroupB",
      channel: "push",
      status: "UNSUBSCRIBED",
    },
  ]

  it("updates notification preferences for authenticated user", async () => {
    const mutation = gql`
      mutation UpdateNotificationPreferences(
        $input: updateNotificationPreferencesMutationInput!
      ) {
        updateNotificationPreferences(input: $input) {
          notificationPreferences {
            id
            name
            channel
            status
          }
        }
      }
    `

    const input = {
      subscriptionGroups: [
        { name: "GroupA", status: "SUBSCRIBED", channel: "email" },
        { name: "GroupB", status: "UNSUBSCRIBED", channel: "push" },
      ],
    }

    const context = {
      updateNotificationPreferencesLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(gravityNotificationPreferences)),
      notificationPreferencesLoader: () =>
        Promise.resolve(gravityNotificationPreferences),
    }

    const data = await runQuery(mutation, context, { input })

    expect(context.updateNotificationPreferencesLoader).toHaveBeenCalledWith({
      subscription_groups: {
        GroupA: "subscribed",
        GroupB: "unsubscribed",
      },
    })

    expect(data!.updateNotificationPreferences.notificationPreferences).toEqual(
      expectedNotificationPreferences
    )
  })

  it("updates notification preferences for unauthenticated user", async () => {
    const mutation = gql`
      mutation UpdateNotificationPreferences(
        $input: updateNotificationPreferencesMutationInput!
      ) {
        updateNotificationPreferences(input: $input) {
          notificationPreferences {
            id
            name
            channel
            status
          }
        }
      }
    `

    const input = {
      authenticationToken: "123",
      subscriptionGroups: [
        { name: "GroupA", status: "SUBSCRIBED", channel: "email" },
        { name: "GroupB", status: "UNSUBSCRIBED", channel: "push" },
      ],
    }

    const context = {
      anonUpdateNotificationPreferencesLoader: jest
        .fn()
        .mockReturnValue(Promise.resolve(gravityNotificationPreferences)),
      anonNotificationPreferencesLoader: () =>
        Promise.resolve(gravityNotificationPreferences),
    }

    const data = await runQuery(mutation, context, { input })

    expect(
      context.anonUpdateNotificationPreferencesLoader
    ).toHaveBeenCalledWith("123", {
      subscription_groups: {
        GroupA: "subscribed",
        GroupB: "unsubscribed",
      },
    })

    expect(data!.updateNotificationPreferences.notificationPreferences).toEqual(
      expectedNotificationPreferences
    )
  })
})
