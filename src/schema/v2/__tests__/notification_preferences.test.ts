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
