import gql from "lib/gql"
import { convertSubGroups } from "../notification_preferences"
import { runQuery } from "../test/utils"

describe("convertSubGroups", () => {
  it("converts to params for gravity", () => {
    const subGroups = [
      {
        id: "abc",
        name: "productUpdates",
        channel: "email",
        status: "Subscribed",
      },
      {
        id: "abc",
        name: "artWorldInsights",
        channel: "push",
        status: "Subscribed",
      },
    ]

    const params = convertSubGroups(subGroups)

    expect(params).toEqual({
      subscription_groups: [
        { productUpdates: "subscribed" },
        { artWorldInsights: "subscribed" },
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
        name: "recommendedByArtsy",
        channel: "email",
        status: "Subscribed",
      },
      {
        id: "abc",
        name: "artWorldInsights",
        channel: "push",
        status: "Unsubscribed",
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
