import gql from "lib/gql"
import { convertSubGroups } from "../notification_preferences"
import { runQuery } from "../test/utils"

describe("convertSubGroups", () => {
  it("converts subGroups to params for gravity loader", () => {
    const subGroups = [
      { id: "abc", name: "GroupA", status: "Subscribed", channel: "Email" },
      { id: "abc", name: "GroupB", status: "Unsubscribed", channel: "Push" },
    ]

    const params = convertSubGroups(subGroups)

    expect(params).toEqual({
      subscription_groups: [
        { name: "GroupA", status: "subscribed", channel: "email" },
        { name: "GroupB", status: "unsubscribed", channel: "push" },
      ],
    })
  })
})

describe("notificationPreferences", () => {
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

    const notificationPreferences = [
      {
        id: "abc",
        name: "GroupA",
        channel: "EMAIL",
        status: "SUBSCRIBED",
      },
      {
        id: "abc",
        name: "GroupB",
        channel: "PUSH",
        status: "UNSUBSCRIBED",
      },
    ]

    const context = {
      notificationPreferencesLoader: () =>
        Promise.resolve(notificationPreferences),
    }

    const data = await runQuery(query, context)
    expect(data!.notificationPreferences).toEqual(notificationPreferences)
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

    const notificationPreferences = [
      {
        id: "abc",
        name: "GroupA",
        channel: "EMAIL",
        status: "SUBSCRIBED",
      },
      {
        id: "abc",
        name: "GroupB",
        channel: "PUSH",
        status: "UNSUBSCRIBED",
      },
    ]

    const context = {
      anonNotificationPreferencesLoader: () =>
        Promise.resolve(notificationPreferences),
    }

    const data = await runQuery(query, context)
    expect(data!.notificationPreferences).toEqual(notificationPreferences)
  })

  it.skip("returns an error when there is a problem returning notification preferences", async () => {
    // add error handling or is this backend?
  })
})

describe("Update notificationPreferences", () => {
  it.skip("updates notification preferences when input is valid", async () => {})
  it.skip("updates email notification preferences to 'Subscribed' when input is valid", async () => {})

  it.skip("updates email notification preferences to 'Unsubscribed' when input is valid", async () => {})

  it.skip("updates push notification preferences to 'Subscribed' when input is valid", async () => {})

  it.skip("updates push notification preferences to 'Unsubscribed' when input is valid", async () => {})

  it.skip("returns an error when input value is invalid", async () => {
    // Invalid name
    // Invalid status
    // Invalid channel
  })

  it.skip("returns an error when input value is missing", async () => {
    //Missing name
    // Missing status
    // Missing channel
  })
})
