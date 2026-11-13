# ArtworkListingSummary interface

Discriminator field: `listingDomain`:

- When `listingDomain` is `PDB`, `PDB_TEASER`, or `ARTNET_AUCTION`, resolve to `LotSummary`
- When `listingDomain` is `GALLERY`, resolve to `GalleryListingSummary`

## Field mapping: special cases

- `internalID`: `artListingInternalId`

The following fields come from a nested object in the API result (`lot`, for auction listings):

- title
- catalogLotNumber
- artworks
- uri
- externalUrl: `externalUri`
- saleNumber
- `timing`: a single `{ start, end }` from the first and second entries of `saleDates`
