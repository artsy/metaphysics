const ValidSubmissionCategories = [
  "ARCHITECTURE",
  "DESIGN_DECORATIVE_ART",
  "DRAWING_COLLAGE_OR_OTHER_WORK_ON_PAPER",
  "FASHION_DESIGN_AND_WEARABLE_ART",
  "INSTALLATION",
  "JEWELRY",
  "MIXED_MEDIA",
  "PAINTING",
  "PERFORMANCE_ART",
  "PHOTOGRAPHY",
  "PRINT",
  "SCULPTURE",
  "TEXTILE_ARTS",
  "VIDEO_FILM_ANIMATION",
]

export const artworkToSubmissionCategory = (category: string) => {
  if (!category) return

  // replace all spaces, commas, and slashes with underscores, remove double underscores, and uppercase
  const normalizedArtworkCategory = category
    .replace(/ /g, "_")
    .replace(/,/g, "_")
    .replace(/\//g, "_")
    .replace(/\_\_/g, "_")
    .toUpperCase()

  if (ValidSubmissionCategories.includes(normalizedArtworkCategory)) {
    return normalizedArtworkCategory
  }

  return "OTHER"
}

// artwork is an object taken from the Gravity API (artworkLoader)
export const artworkToSubmissionMapping = (artwork) => {
  return (
    Object.entries({
      artistID: artwork.artist?.id,
      title: artwork.title,
      year: (artwork.dates || [])[0]?.toString(),
      medium: artwork.medium,
      category: artworkToSubmissionCategory(artwork.category),
      attributionClass: artwork.attribution_class
        ?.replace(" ", "_")
        ?.toUpperCase(),
      editionNumber: artwork.edition_sets?.[0]?.available_editions?.[0],
      editionSize: artwork.edition_sets?.[0]?.edition_size
        ? +artwork.edition_sets?.[0]?.edition_size
        : undefined,
      height: artwork.height,
      width: artwork.width,
      depth: artwork.depth,
      dimensionsMetric: artwork.metric,
      provenance: artwork.provenance,
      locationCity: artwork.collector_location?.city,
      locationCountry: artwork.collector_location?.country,
      locationState: artwork.collector_location?.state,
      locationCountryCode: artwork.collector_location?.countryCode,
      locationPostalCode: artwork.collector_location?.postalCode,
    })
      // Remove undefined values
      .filter(([_key, value]) => value !== undefined)
      .reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})
  )
}
