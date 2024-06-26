import {
  resolveSearchCriteriaLabels,
  SearchCriteriaLabel,
  searchCriteriaLabelsToReturn,
} from "./searchCriteriaLabel"

export const generateDisplayName = async (parent, args, context, info) => {
  // if `only` or `except` is provided, we forcefully resolve display name dynamically
  if (!args?.only && !args?.except) {
    if (parent?.userAlertSettings?.name) return parent?.userAlertSettings?.name
    // When being used from the non-stitched schema, the field is called `settings`
    // instead of `userAlertSettings`
    if (parent?.settings?.name) return parent.settings.name
  }

  const labels = await resolveSearchCriteriaLabels(parent, args, context, info)

  // artist always

  const artistLabels = labels.filter(({ name }) => name === "Artist")

  // then prioritized criteria

  const prioritizedLabels: SearchCriteriaLabel[][] = []

  const price = labels.filter(({ name }) => name === "Price")
  if (price) prioritizedLabels.push(price)

  const medium = labels.filter(({ name }) => name === "Medium")
  if (medium) prioritizedLabels.push(medium)

  const rarity = labels.filter(({ name }) => name === "Rarity")
  if (rarity) prioritizedLabels.push(rarity)

  // then other criteria

  const otherLabels: SearchCriteriaLabel[][] = []

  const size = labels.filter(({ name }) => name === "Size")
  if (size) otherLabels.push(size)

  const waysToBuy = labels.filter(({ name }) => name === "Ways to Buy")
  if (waysToBuy) otherLabels.push(waysToBuy)

  const material = labels.filter(({ name }) => name === "Material")
  if (material) otherLabels.push(material)

  const location = labels.filter(({ name }) => name === "Artwork Location")
  if (location) otherLabels.push(location)

  const period = labels.filter(({ name }) => name === "Time Period")
  if (period) otherLabels.push(period)

  const color = labels.filter(({ name }) => name === "Color")
  if (color) otherLabels.push(color)

  const partner = labels.filter(
    ({ name }) => name === "Galleries and Institutions"
  )
  if (partner) otherLabels.push(partner)

  const artistSeries = labels.filter(({ name }) => name === "Artist Series")
  if (artistSeries) otherLabels.push(artistSeries)

  // concatenate, compact, and trim

  const allLabels = [artistLabels, ...prioritizedLabels, ...otherLabels].filter(
    (labels) => labels.length > 0
  )

  const useableLabels = allLabels.slice(0, 4) // artist + up to 3 others

  // render

  const displayValues = useableLabels.map((labels) => {
    return labels.map((label) => label.displayValue).join(" or ")
  })

  let result = ""
  if (
    searchCriteriaLabelsToReturn(args.only, args.except).includes("artistIDs")
  ) {
    const [artist, ...others] = displayValues
    result = [artist, others.join(", ")].join(others.length > 0 ? " — " : "")
  } else {
    result = displayValues.join(", ")
  }

  const remainingCount = allLabels.length - useableLabels.length
  if (remainingCount > 0) result += ` + ${remainingCount} more`

  return result
}
