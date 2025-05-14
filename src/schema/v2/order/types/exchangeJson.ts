/**
 * The order json as received from the exchange REST API.
 * Used to nudge our our OrderType resolvers
 */
export interface OrderJSON {
  id: string
  code: string
  source: "artwork_page" | "inquiry" | "private_sale" | "partner_offer"
  mode: "buy" | "offer"
  currency_code: string
  available_shipping_countries: string[]
  buyer_id: string
  buyer_type: string
  seller_id: string
  seller_type: string
  buyer_phone_number?: string
  buyer_phone_number_country_code?: string
  buyer_total_cents?: number
  shipping_total_cents?: number
  items_total_cents?: number
  shipping_name?: string
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_region?: string
  shipping_country?: string
  tax_total_cents?: number
  buyer_state?: string
  buyer_state_expires_at?: string
  fulfillment_type?: string
  fulfillment_options: Array<{
    type:
      | "domestic_flat"
      | "international_flat"
      | "pickup"
      | "artsy_standard"
      | "artsy_express"
      | "artsy_white_glove"
      | "shipping_tbd"
    amount_minor: number
    selected?: boolean
  }>
  selected_fulfillment_option?:
    | "domestic_flat"
    | "international_flat"
    | "pickup"
    | "artsy_standard"
    | "artsy_express"
    | "artsy_white_glove"
    | "shipping_tbd"
  line_items: Array<{
    id: string
    artwork_id: string
    artwork_version_id: string
    edition_set_id?: string
    list_price_cents: number
    quantity: number
    shipping_total_cents?: number
    tax_cents?: number
    currency_code: string
  }>
}
