import gql from "lib/gql"

export const RequestedFulfillmentFragment = gql`
  ...on EcommerceShip {
    name
    addressLine1
    addressLine2
    city
    region
    country
    postalCode
  }
  ... on EcommercePickup {
    fulfillmentType
  }
`

export const PageInfo = gql`
  pageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`
