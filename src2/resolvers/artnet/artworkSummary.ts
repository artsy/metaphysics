// See resolver-specs/artnet/ArtworkSummary.md and CreatorSummary.md
//
// Same-named fields use the default resolver.

// The API serializes unset enums as "UNSPECIFIED", which isn't in our schema.
const era = (value?: string | null) =>
  value === "BCE" || value === "CE" ? value : null

// For ArtistSummary, the API returns an `artists` array with a single artist.
const artistOf = (creator) => creator.artists?.[0]

export default {
  ArtworkSummary: {
    classifications: (artwork) => artwork.classification ?? [],
    objectTypes: (artwork) => artwork.objectType ?? [],
    // `materials` is often empty; `mediumRaw` is the free-text medium
    // (e.g. "acrylic on canvas").
    media: (artwork) => {
      const materials = (artwork.materials ?? [])
        .map((material) => material.value ?? material.key)
        .filter(Boolean)
      if (materials.length > 0) return materials
      return artwork.mediumRaw ? [artwork.mediumRaw] : []
    },
    // `movements` and `attributionQualifier` live elsewhere in the API response
    // (artwork.movement and creator.modifier), so fold them into the creator
    // object that the CreatorSummary types resolve from.
    creator: (artwork) => {
      const { creator } = artwork
      if (!creator) return null
      return {
        ...creator,
        attributionQualifier: creator.modifier || null,
        movements: artwork.movement ?? [],
      }
    },
  },

  CreatorSummary: {
    __resolveType: (creator) => {
      switch (creator.kind ?? creator.creatorType) {
        case "ARTIST":
          return "ArtistSummary"
        case "COLLABORATION":
          return "CollaborationSummary"
        case "MANUFACTURER":
          return "ManufacturerSummary"
        default:
          return null
      }
    },
  },

  ArtistSummary: {
    birthYear: (creator) => artistOf(creator)?.birthYear,
    birthYearEra: (creator) => era(artistOf(creator)?.birthYearEra),
    deathYear: (creator) => artistOf(creator)?.deathYear,
    deathYearEra: (creator) => era(artistOf(creator)?.deathYearEra),
    nationalities: (creator) => artistOf(creator)?.nationalities ?? [],
  },
}
