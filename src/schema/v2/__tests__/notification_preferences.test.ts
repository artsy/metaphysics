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
  // recommendedByArtsy
  it("can update push notification preferences for recommendedByArtsy", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "recommendedByArtsyPush",
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
        name: " recommendedByArtsyEmail",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })

  // artWorldInsights
  it("can update push notification preferences for artWorldInsights", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "artWorldInsightsPush",
        channel: "push",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
  it("can update email notification preferences artWorldInsights", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "artWorldInsightsEmail",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })

  // productUpdates
  it("can update push notification preferences for productUpdates", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "productUpdatesPush",
        channel: "push",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
  it("can update email notification preferences productUpdates", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "productUpdatesEmail",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })

  // guidanceOnCollecting
  it("can update push notification preferences for guidanceOnCollecting", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "guidanceOnCollectingPush",
        channel: "push",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
  it("can update email notification preferences guidanceOnCollecting", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "guidanceOnCollectingEmail",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })

  // customAlerts
  it("can update push notification preferences for customAlerts", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "customAlertsPush",
        channel: "push",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
  it("can update email notification preferences customAlerts", () => {
    const pushSubGroups = [
      {
        id: "abc",
        name: "customAlertsEmail",
        channel: "email",
        status: "Subscribed",
      },
    ]

    expect(pushSubGroups).toBeTrue()
  })
})
