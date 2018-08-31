import gql from "lib/gql"

export const RequestedFulfillmentFragment = gql`
  requestedFulfillment {
    __typename
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

export const BuyerSellerFields = gql`
  seller {
    __typename
    ... on EcommercePartner{
      id
    }
    ... on EcommerceUser {
      id
    }
  }
  buyer {
    __typename
    ... on EcommerceUser {
      id
    }
    ... on EcommercePartner{
      id
    }
  }
`
