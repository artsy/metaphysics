export const baseOrderJson = {
  id: "order-id",
  buyer_phone_number: null,
  buyer_phone_number_country_code: null,
  buyer_total_cents: null,
  code: "order-code",
  currency_code: "USD",
  items_total_cents: 10000,
  shipping_total_cents: null,
  mode: "buy",
  source: "artwork_page",
  shipping_country: "US",
  shipping_postal_code: null,
  shipping_region: null,
  shipping_city: null,
  shipping_address_line1: null,
  shipping_address_line2: null,
  line_items: [
    {
      id: "line-item-id-0",
      artwork_id: "artwork-id-0",
      artwork_version_id: "artwork-version-id-0",
      edition_set_id: null,
      list_price_cents: 10000,
      quantity: 1,
      shipping_total_cents: null,
      currency_code: "USD",
    },
  ],
  available_shipping_countries: ["US", "JP"],
  pickup_available: true,
  fulfillment_options: [
    { type: "pickup", amount_minor: 0 },
    { type: "domestic_flat", amount_minor: 10000, selected: true },
  ],
}

export const baseArtwork = {
  id: "artwork-id-0",
  title: "Artwork Title",
}
