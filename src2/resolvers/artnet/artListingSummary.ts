// See resolver-specs/artnet/ArtworkListingSummary.md
//
// Same-named fields (id, saleName, saleCountries, ...) use the default resolver.

// For auction (lot) listings, the API returns the listing details under `lot`.
const listingData = (listing) => listing.lot

// Field resolvers aren't inherited from an interface by its implementing
// types, so the shared ones are defined once and spread into each type.
const sharedFields = {
  internalID: ({ artListingInternalId }) => artListingInternalId,

  // Nested listing data
  title: (listing) => listingData(listing)?.title,
  uri: (listing) => listingData(listing)?.uri,
  externalUrl: (listing) => listingData(listing)?.externalUri,
  // The API's artwork objects have no id, lastUpdated or uri of their own, so
  // derive them from the listing.
  artworks: (listing) =>
    (listingData(listing)?.artworks ?? []).map((artwork, index) => ({
      id: `${listing.id}:artwork:${index}`,
      lastUpdated: listing.lastUpdated,
      uri: listingData(listing)?.uri,
      ...artwork,
    })),
}

export default {
  ArtListingSummary: {
    __resolveType: (listing) => {
      switch (listing.listingDomain) {
        case "PDB":
        case "PDB_TEASER":
        case "ARTNET_AUCTION":
          return "LotSummary"
        case "GALLERY":
          return "GalleryListingSummary"
        default:
          // TODO: the REST API doesn't return `listingDomain` yet. Until it
          // does, infer lot listings from the presence of `lot`.
          return listing.lot ? "LotSummary" : null
      }
    },
  },

  LotSummary: {
    ...sharedFields,
    catalogLotNumber: (listing) => listingData(listing)?.catalogLotNumber,
    saleNumber: (listing) => listingData(listing)?.saleNumber,
    artListingDetailId: ({ artListingDetailId }) => artListingDetailId,
    // The API returns the sale's start and end dates as `saleDates`.
    timing: ({ saleDates }) =>
      saleDates?.length ? [{ start: saleDates[0], end: saleDates[1] }] : [],
  },

  GalleryListingSummary: sharedFields,
}
