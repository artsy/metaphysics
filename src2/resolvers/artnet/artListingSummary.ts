// See resolver-specs/artnet/ArtworkListingSummary.md
//
// Only the top-level primitive fields are resolved so far. Same-named fields
// (id, saleName, saleCountries, ...) use the default resolver.

// For lot listings, the API returns the listing details under `lot`.
const listingData = (listing) => listing.lot

export default {
  ArtListingSummary: {
    internalID: ({ artListingInternalId }) => artListingInternalId,

    // Nested listing data
    title: (listing) => listingData(listing)?.title,
    catalogLotNumber: (listing) => listingData(listing)?.catalogLotNumber,
    uri: (listing) => listingData(listing)?.uri,
    externalUrl: (listing) => listingData(listing)?.externalUri,
    saleNumber: (listing) => listingData(listing)?.saleNumber,
  },
}
