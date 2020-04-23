import * as t from "io-ts"

export const GravityArtistCodec = t.type({
  _id: t.string,
  id: t.string,
  alternate_names: t.array(t.string),
  blurb: t.string,
  birthday: t.string,
  collections: t.string,
  consignable: t.boolean,
  deathday: t.string,
  disable_price_context: t.boolean,
  display_auction_link: t.boolean,
  forsale_artworks_count: t.number,
  hometown: t.string,
  image_url: t.string,
  image_urls: t.record(t.string, t.string),
  image_versions: t.array(t.string),
  location: t.string,
  name: t.string,
  nationality: t.string,
  public: t.boolean,
  published_artworks_count: t.number,
  sortable_id: t.string,
  years: t.string,
})

export type GravityArtistResponse = t.TypeOf<typeof GravityArtistCodec>
