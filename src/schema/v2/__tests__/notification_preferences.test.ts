import gql from "lib/gql"
import { convertSubGroups } from "../notification_preferences"
import { runQuery } from "../test/utils"

describe("convertSubGroups", () => {
  it("converts subGroups to params for gravity loader", () => {
    const subGroups = [
      { id: "abc1", name: "GroupA", status: "Subscribed", channel: "Email" },
      { id: "abc2", name: "GroupB", status: "Unsubscribed", channel: "Push" },
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
        me {
          notificationPreferences {
            id
            name
            channel
            status
          }
        }
      }
    `

    const notificationPreferences = [
      {
        id: "abc",
        name: "GroupA",
        channel: "email",
        status: "subscribed",
      },
      {
        id: "abc",
        name: "GroupB",
        channel: "push",
        status: "unsubscribed",
      },
    ]

    const context = {
      notificationPreferencesLoader: () =>
        Promise.resolve({
          notification_preferences: notificationPreferences,
        }),
    }

    const data = await runQuery(query, context)
    expect(data!.me.notificationPreferences).toEqual(notificationPreferences)
  })

  it("returns notification preferences for unathenticated user", async () => {})

  it("updates notification preferences when input is valid", async () => {
    // update both email and push notys
  })

  it("returns an error when input value is invalid", async () => {
    // Invalid name
    // Invalid status
    // Invalid channel
  })

  it("returns an error when input value is missing", async () => {
    //Missing name
    // Missing status
    // Missing channel
  })
})

describe("Update notificationPreferences", () => {
  it("updates email notification preferences to 'Subscribed' when input is valid", async () => {})

  it("updates email notification preferences to 'Unsubscribed' when input is valid", async () => {})

  it("updates push notification preferences to 'Subscribed' when input is valid", async () => {})

  it("updates push notification preferences to 'Unsubscribed' when input is valid", async () => {})
})
