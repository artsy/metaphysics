// See resolver-specs/artnet/ArtworkListingSummary.md
//
// Same-named fields (id, saleName, saleCountries, ...) use the default resolver.

// For lot listings, the API returns the listing details under `lot`.
const listingData = (listing) => listing.lot

export default {
  ArtListingSummary: {
    internalID: ({ artListingInternalId }) => artListingInternalId,

    // Nested listing data
    title: (listing) => listingData(listing)?.title,
    catalogLotNumber: (listing) => listingData(listing)?.catalogLotNumber,
    // The API's artwork objects have no id, lastUpdated or uri of their own, so
    // derive them from the listing.
    artworks: (listing) =>
      (listingData(listing)?.artworks ?? []).map((artwork, index) => ({
        id: `${listing.id}:artwork:${index}`,
        lastUpdated: listing.lastUpdated,
        uri: listingData(listing)?.uri,
        ...artwork,
      })),
    uri: (listing) => listingData(listing)?.uri,
    externalUrl: (listing) => listingData(listing)?.externalUri,
    saleNumber: (listing) => listingData(listing)?.saleNumber,
  },
}
