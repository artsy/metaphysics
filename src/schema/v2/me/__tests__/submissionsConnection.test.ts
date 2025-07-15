/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("submissionsConnection", () => {
  it("returns empty list since Convection is disabled", async () => {
    const query = gql`
      {
        me {
          submissionsConnection(first: 10) {
            totalCount
            edges {
              node {
                state
              }
            }
          }
        }
      }
    `

    const submissionsLoader = jest.fn(async () => {
      return {
        headers: { "x-total-count": "0" },
        body: [],
      }
    })

    const context: any = {
      meLoader: () => Promise.resolve({}),
      submissionsLoader: submissionsLoader,
    }

    const {
      me: { submissionsConnection },
    } = await runAuthenticatedQuery(query, context)

    expect(submissionsLoader).toHaveBeenCalledWith()
    expect(submissionsConnection).toEqual({
      edges: [],
      totalCount: 0,
    })
  })

  it("returns empty list when filtering by state since Convection is disabled", async () => {
    const query = gql`
      {
        me {
          submissionsConnection(first: 10, states: [DRAFT]) {
            totalCount
            edges {
              node {
                state
              }
            }
          }
        }
      }
    `

    const submissionsLoader = jest.fn(async () => {
      return {
        headers: { "x-total-count": "0" },
        body: [],
      }
    })

    const context: any = {
      meLoader: () => Promise.resolve({}),
      submissionsLoader: submissionsLoader,
    }

    const {
      me: { submissionsConnection },
    } = await runAuthenticatedQuery(query, context)

    expect(submissionsLoader).toHaveBeenCalledWith()
    expect(submissionsConnection).toEqual({
      edges: [],
      totalCount: 0,
    })
  })
})

const mockDraftSubmission = {
  id: 225966,
  ext_user_id: null,
  qualified: null,
  artist_id: "",
  title: "",
  medium: "",
  year: "",
  category: null,
  height: "",
  width: "",
  depth: "",
  dimensions_metric: "in",
  signature: null,
  authenticity_certificate: null,
  provenance: "",
  location_city: "",
  location_state: "",
  location_country: "",
  deadline_to_sell: null,
  additional_info: null,
  created_at: "2024-03-01T11:28:04.815Z",
  updated_at: "2024-03-01T11:48:00.968Z",
  edition: null,
  state: "draft",
  receipt_sent_at: null,
  edition_number: "",
  edition_size: "",
  reminders_sent_count: 0,
  admin_receipt_sent_at: null,
  approved_by: null,
  approved_at: null,
  rejected_by: null,
  rejected_at: null,
  primary_image_id: null,
  consigned_partner_submission_id: null,
  user_email: "email@gmail.com",
  offers_count: 0,
  user_id: 46583,
  minimum_price_cents: null,
  currency: "USD",
  user_agent: "Artsy-Mobile ios Artsy-Mobile/8.34.0 Eigen/2022.05.11.13/8.34.0",
  deleted_at: null,
  artist_score: 0,
  auction_score: 0,
  assigned_to: null,
  published_at: null,
  source_artwork_id: null,
  utm_source: "",
  utm_medium: "",
  utm_term: "",
  attribution_class: null,
  publisher: null,
  artist_proofs: null,
  literature: null,
  exhibition: null,
  condition_report: null,
  signature_detail: null,
  coa_by_authenticating_body: null,
  coa_by_gallery: null,
  rejection_reason: null,
  cataloguer: null,
  user_name: "John Does ",
  user_phone: "",
  session_id: null,
  my_collection_artwork_id: null,
  admin_id: null,
  uuid: "safe-049d-4e0c-8a98-7475ea9ca7ee",
  source: "app_inbound",
  location_postal_code: null,
  location_country_code: "",
  listed_artwork_ids: [],
  minimum_price_dollars: null,
  sale_state: null,
  consignment_state: null,
}

const mockRejectedSubmission = {
  id: 157125,
  ext_user_id: null,
  qualified: null,
  artist_id: "5c341559fc5469445dbd236b",
  title: "sorry, internal test",
  medium: "Oil on canvas",
  year: "2021",
  category: "Painting",
  height: "10",
  width: "10",
  depth: "2",
  dimensions_metric: "in",
  signature: null,
  authenticity_certificate: null,
  provenance: "sorry, internal test",
  location_city: "Berlin",
  location_state: "Berlin",
  location_country: "Germany",
  deadline_to_sell: null,
  additional_info: null,
  created_at: "2023-07-07T16:54:31.059Z",
  updated_at: "2023-07-07T17:20:08.255Z",
  edition: null,
  state: "rejected",
  receipt_sent_at: "2023-07-07T16:55:17.858Z",
  edition_number: "",
  edition_size: "",
  reminders_sent_count: 0,
  admin_receipt_sent_at: "2023-07-07T16:55:17.842Z",
  approved_by: null,
  approved_at: null,
  rejected_by: "5ed0fd7e2fbdfe0012e695c2",
  rejected_at: "2023-07-07T17:20:08.255Z",
  primary_image_id: null,
  consigned_partner_submission_id: null,
  user_email: "email@gmail.com",
  offers_count: 0,
  user_id: 46583,
  minimum_price_cents: null,
  currency: "USD",
  user_agent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Artsy-Web Force",
  deleted_at: null,
  artist_score: 0.1533636414,
  auction_score: 0,
  assigned_to: null,
  published_at: null,
  source_artwork_id: null,
  utm_source: null,
  utm_medium: null,
  utm_term: null,
  attribution_class: "unique",
  publisher: null,
  artist_proofs: null,
  literature: null,
  exhibition: null,
  condition_report: null,
  signature_detail: null,
  coa_by_authenticating_body: null,
  coa_by_gallery: null,
  rejection_reason: "Other",
  cataloguer: null,
  user_name: "John Does",
  user_phone: "+49 176724582355",
  session_id: null,
  my_collection_artwork_id: "64a8432a117d26000d355045",
  admin_id: null,
  uuid: "safe-9d6f-40a3-a47b-a93d027eef2b",
  source: "my_collection",
  location_postal_code: null,
  location_country_code: "DE",
  listed_artwork_ids: [],
  minimum_price_dollars: null,
  sale_state: null,
  consignment_state: null,
}

const mockApprovedSubmission = {
  id: 96106,
  ext_user_id: null,
  qualified: null,
  artist_id: "4d8b92b34eb68a1b2c0003f4",
  title: "Internal test",
  medium: "Materials",
  year: "2000",
  category: null,
  height: "2",
  width: "10",
  depth: "110",
  dimensions_metric: "in",
  signature: null,
  authenticity_certificate: null,
  provenance: "From a friend",
  location_city: "Berlin",
  location_state: "Berlin",
  location_country: "Germany",
  deadline_to_sell: null,
  additional_info: null,
  created_at: "2022-10-06T12:33:58.638Z",
  updated_at: "2022-10-06T12:37:57.435Z",
  edition: null,
  state: "approved",
  receipt_sent_at: "2022-10-06T12:34:18.886Z",
  edition_number: "",
  edition_size: "",
  reminders_sent_count: 0,
  admin_receipt_sent_at: "2022-10-06T12:34:18.874Z",
  approved_by: null,
  approved_at: null,
  rejected_by: "5ed0fd7e2fbdfe0012e695c2",
  rejected_at: "2022-10-06T12:37:57.434Z",
  primary_image_id: null,
  consigned_partner_submission_id: null,
  user_email: "email@gmail.com",
  offers_count: 0,
  user_id: 46583,
  minimum_price_cents: null,
  currency: "USD",
  user_agent: "unknown Artsy-Mobile/8.1.3 Eigen/2022.10.05.06/8.1.3",
  deleted_at: null,
  artist_score: 0.3963036854,
  auction_score: 0.30094543625,
  assigned_to: null,
  published_at: null,
  source_artwork_id: null,
  utm_source: "",
  utm_medium: "",
  utm_term: "",
  attribution_class: "unique",
  publisher: null,
  artist_proofs: null,
  literature: null,
  exhibition: null,
  condition_report: null,
  signature_detail: null,
  coa_by_authenticating_body: null,
  coa_by_gallery: null,
  rejection_reason: "Fake",
  cataloguer: null,
  user_name: "John Does ",
  user_phone: "+49 17 6724582355",
  session_id: null,
  my_collection_artwork_id: "633ecb4a693f7e000b701ea1",
  admin_id: null,
  uuid: "safe-be97-48a9-9d55-87c4d40dac42",
  source: "app_inbound",
  location_postal_code: "10233",
  location_country_code: "DE",
  listed_artwork_ids: [],
  minimum_price_dollars: null,
  sale_state: null,
  consignment_state: null,
}
