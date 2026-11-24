# ArtistSeries type

## Field mapping: special cases

- `internalID`: `_id`
- `slug`: `id`
- `artworksCountMessage`: Computed string:
  - If `for_sale_artworks_count` is non-zero: `{for_sale_artworks_count} available`
  - Otherwise: `{artworks_count} works` (or `1 work` if `artworks_count` is 1)

## Nested queries

### artists

GET: "/api/v1/artists"

Query params:

- `ids[]`: artist IDs of the current ArtistSeries
