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

export const ParticipantFields = gql`
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

export const OfferFields = gql`
  id
  createdAt
  creatorId
  amountCents
  from {
    __typename
    ... on EcommerceUser {
      id
    }
    ... on EcommercePartner{
      id
    }
  }
`

export const OfferRelatedFields = gql`
  lastOffer {
    ${OfferFields}
  }
  offerTotalCents
  offers {
    edges {
      node {
        ${OfferFields}
      }
    }
  }
`

export const BuyerOrderFields = gql`
  ${ParticipantFields}
  ${RequestedFulfillmentFragment}
  ${OfferRelatedFields}
  buyerPhoneNumber
  buyerTotalCents
  code
  commissionFeeCents
  commissionRate
  createdAt
  currencyCode
  displayCommissionRate
  id
  itemsTotalCents
  lastApprovedAt
  lastSubmittedAt
  mode
  sellerTotalCents
  shippingTotalCents
  state
  stateExpiresAt
  stateReason
  stateUpdatedAt
  taxTotalCents
  transactionFeeCents
  updatedAt
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

export const SellerOrderFields = gql`
  ${ParticipantFields}
  ${RequestedFulfillmentFragment}
  ${OfferRelatedFields}
  buyerPhoneNumber
  buyerTotalCents
  code
  commissionFeeCents
  commissionRate
  createdAt
  currencyCode
  displayCommissionRate
  id
  itemsTotalCents
  lastApprovedAt
  lastSubmittedAt
  mode
  sellerTotalCents
  shippingTotalCents
  state
  stateExpiresAt
  stateReason
  stateUpdatedAt
  taxTotalCents
  transactionFeeCents
  updatedAt
`

export const AllOrderFields = gql`
  id
  mode
  code
  currencyCode
  state
  stateReason
  ${OfferRelatedFields}
  ${ParticipantFields}
  creditCardId
  ${RequestedFulfillmentFragment}
  itemsTotalCents
  shippingTotalCents
  taxTotalCents
  commissionFeeCents
  transactionFeeCents
  buyerPhoneNumber
  buyerTotalCents
  sellerTotalCents
  updatedAt
  createdAt
  stateUpdatedAt
  stateExpiresAt
  lastApprovedAt
  lastSubmittedAt
  commissionRate
  displayCommissionRate
`
