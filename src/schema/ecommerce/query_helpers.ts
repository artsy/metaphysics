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
      phoneNumber
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

export const BuyerFields = gql`
  id
  buyerTotalCents
  buyerPhoneNumber
  code
  commissionFeeCents
  commissionRate
  displayCommissionRate
  createdAt
  currencyCode
  itemsTotalCents
  ${BuyerSellerFields}
  sellerTotalCents
  ${RequestedFulfillmentFragment}
  shippingTotalCents
  state
  stateReason
  stateExpiresAt
  stateUpdatedAt
  taxTotalCents
  transactionFeeCents
  updatedAt
  lastApprovedAt
  lastSubmittedAt
  lineItems {
    edges {
      node {
        id
        priceCents
        artworkId
        editionSetId
        quantity
      }
    }
  }
`
