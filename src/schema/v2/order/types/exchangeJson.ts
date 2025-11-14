/**
 * The order json as received from the exchange REST API.
 * Used to nudge our our OrderType resolvers
 */
export interface FulfillmentOptionJson {
  type:
    | "domestic_flat"
    | "international_flat"
    | "pickup"
    | "artsy_standard"
    | "artsy_express"
    | "artsy_white_glove"
    | "shipping_tbd"
  amount_minor?: number
  selected?: boolean
  shipping_quote_id?: string
}

type OrderPaymentMethodEnum =
  | "credit card"
  | "wire_transfer"
  | "us_bank_account"
  | "sepa_debit"

type OrderBuyerState =
  | "incomplete" // before order is submitted.
  | "submitted"
  | "offer_received"
  | "payment_failed"
  | "processing_payment"
  | "processing_offline_payment" // the action from buyer to complete the payment is required
  | "approved"
  | "shipped"
  | "completed"
  | "refunded"
  | "declined_by_seller" // offers that are not approved because of seller
  | "declined_by_buyer" // offers that are not approved because of buyer
  | "canceled" // catch all canceled state if more detailed info is not available
  | "unknown" // if we don't get to any known buyer_state. Possible on some old orders.

interface OfferJSON {
  id: string
  amount_cents: number
  buyer_total_cents: number | null
  currency_code: string
  from_participant: string
  note: string | null
  shipping_total_cents: number | null
  tax_total_cents: number | null
  created_at: string
}

export interface OrderJSON {
  available_payment_methods: OrderPaymentMethodEnum[]
  available_shipping_countries: string[]
  awaiting_response_from: "buyer" | "seller" | null
  bank_account_id?: string
  buyer_id: string
  buyer_phone_number?: string
  buyer_phone_number_country_code?: string
  buyer_state?: OrderBuyerState
  buyer_state_expires_at?: string
  buyer_total_cents?: number
  buyer_type: string
  created_at: string
  code: string
  credit_card_id?: string
  credit_card_wallet_type?: "apple_pay" | "google_pay"
  stripe_confirmation_token?: string
  currency_code: string
  delivery_info?: {
    shipper_name?: string
    tracking_id?: string
    tracking_url?: string
    type: "artsy_shipping" | "partner_shipping"
    estimated_delivery?: string
    estimated_delivery_window?: string
  }
  fulfillment_options: Array<FulfillmentOptionJson>
  fulfillment_type?: string
  id: string
  impulse_conversation_id?: string
  items_total_cents?: number
  line_items: Array<{
    artwork_id: string
    artwork_version_id: string
    currency_code: string
    edition_set_id?: string
    id: string
    list_price_cents: number
    quantity: number
    shipping_total_cents?: number
    tax_cents?: number
  }>
  mode: "buy" | "offer"
  payment_method?: OrderPaymentMethodEnum
  selected_fulfillment_option?: FulfillmentOptionJson
  seller_id: string
  seller_type: string
  shipping_address_line1?: string
  shipping_address_line2?: string
  shipping_city?: string
  shipping_country?: string
  shipping_name?: string
  shipping_origin?: string
  shipping_postal_code?: string
  shipping_region?: string
  shipping_total_cents?: number
  source: "artwork_page" | "inquiry" | "private_sale" | "partner_offer"
  tax_total_cents?: number
  total_list_price_cents?: number
  submitted_offers?: Array<OfferJSON>
  pending_offer?: OfferJSON | null
  last_submitted_offer?: OfferJSON | null
}
