import { convertSubGroups } from "../notification_preferences"

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

describe("notificationPreferenceType", () => {
  // test for each notification field
  it("can update push notification preferences for recommendedByArtsy", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "recommendedByArtsy",
        channel: "push",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
  it("can update email notification preferences recommendedByArtsy", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "recommendedByArtsy",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
})
