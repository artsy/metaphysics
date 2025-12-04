type AttributeType = {
  key: string
  label: string
  value: boolean
}

interface SelectCollectorAttributesParams {
  raw_attributes: {
    is_repeat_buyer?: boolean
    is_recent_sign_up?: boolean
    has_demonstrated_budget?: boolean
    has_bought_works_from_partner?: boolean
    has_inquired_about_works_from_artist?: boolean
    has_inquired_about_works_from_partner?: boolean
    has_enabled_alerts_on_a_represented_artist?: boolean
    has_enabled_alerts_on_artist?: boolean
    has_followed_partner?: boolean
    has_followed_a_represented_artist?: boolean
    has_saved_works_from_partner?: boolean
    has_saved_works_from_artist?: boolean
  }
  confirmed_buyer_at?: string | null
  similarGalleriesData: {
    has_purchased_from_similar_galleries: boolean
    has_inquired_with_similar_galleries: boolean
  }
}

export function selectCollectorAttributes(
  params: SelectCollectorAttributesParams
): AttributeType[] {
  const { raw_attributes, confirmed_buyer_at, similarGalleriesData } = params

  // User Activity (pick top 1 that's true)
  const userActivityAttributes: AttributeType[] = [
    {
      key: "is_repeat_buyer",
      label: "Repeat Artsy buyer",
      value: raw_attributes.is_repeat_buyer ?? false,
    },
    {
      key: "is_confirmed_buyer",
      label: "Confirmed Artsy buyer",
      value: !!confirmed_buyer_at,
    },
    {
      key: "is_active_user",
      label: "Active Artsy user",
      value: raw_attributes.is_recent_sign_up === false,
    },
    {
      key: "is_recent_sign_up",
      label: "New Artsy user",
      value: !!raw_attributes.is_recent_sign_up,
    },
  ]

  // Budget Confidence
  const budgetAttributes: AttributeType[] = [
    {
      key: "has_demonstrated_budget",
      label: "Demonstrated budget in line with this artwork",
      value: raw_attributes.has_demonstrated_budget ?? false,
    },
  ]

  // Gallery Interactions (in order of precedence)
  const galleryAttributes: AttributeType[] = [
    {
      key: "has_bought_works_from_partner",
      label: "Purchased from your gallery",
      value: raw_attributes.has_bought_works_from_partner ?? false,
    },
    {
      key: "has_bought_works_from_similar_partners",
      label: "Purchased from galleries like you",
      value: similarGalleriesData.has_purchased_from_similar_galleries,
    },
    {
      key: "has_inquired_about_works_from_artist",
      label: "Inquired on artworks by this artist",
      value: raw_attributes.has_inquired_about_works_from_artist ?? false,
    },
    {
      key: "has_inquired_about_works_from_partner",
      label: "Inquired on works from your gallery",
      value: raw_attributes.has_inquired_about_works_from_partner ?? false,
    },
  ]

  // Artsy Activity (in order of precedence)
  const artsyActivityAttributes: AttributeType[] = [
    {
      key: "has_enabled_alerts_on_artist",
      label: "Enabled alerts on this artist",
      value: raw_attributes.has_enabled_alerts_on_artist ?? false,
    },
    {
      key: "has_enabled_alerts_on_a_represented_artist",
      label: "Enabled alerts on artists your gallery represents",
      value: raw_attributes.has_enabled_alerts_on_a_represented_artist ?? false,
    },
    {
      key: "has_saved_works_from_artist",
      label: "Saved works by this artist",
      value: raw_attributes.has_saved_works_from_artist ?? false,
    },
    {
      key: "has_saved_works_from_partner",
      label: "Saved works from your gallery",
      value: raw_attributes.has_saved_works_from_partner ?? false,
    },
    {
      key: "has_followed_a_represented_artist",
      label: "Follows an artist your gallery represents",
      value: raw_attributes.has_followed_a_represented_artist ?? false,
    },
    {
      key: "has_followed_partner",
      label: "Follows your gallery",
      value: raw_attributes.has_followed_partner ?? false,
    },
  ]

  // 1. Pick top 1 from User Activity
  const topUserActivity = userActivityAttributes.find((attr) => attr.value)
  const userActivityResult = topUserActivity ? [topUserActivity] : []

  // 2. Fill remaining slots (up to 5 total) from other categories in order
  const remainingCategories: AttributeType[] = [
    ...budgetAttributes,
    ...galleryAttributes,
    ...artsyActivityAttributes,
  ]

  const remainingSlotsCount = 5 - userActivityResult.length
  const additionalAttributes = remainingCategories
    .filter((attr) => attr.value)
    .slice(0, remainingSlotsCount)

  return [...userActivityResult, ...additionalAttributes]
}
