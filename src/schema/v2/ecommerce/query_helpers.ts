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

export const PaginationFields = gql`
  totalPages
  pageCursors {
    first {
      cursor
      isCurrent
      page
    }
    last {
      cursor
      isCurrent
      page
    }
    around {
      cursor
      isCurrent
      page
    }
    previous {
      cursor
      isCurrent
      page
    }
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
  ... on EcommerceOffer {
    id
    createdAt
    creatorId
    amountCents
    note
    shippingTotalCents
    taxTotalCents
    respondsTo {
      id
      createdAt
      creatorId
      amountCents
      note
      shippingTotalCents
      taxTotalCents
      buyerTotalCents
      fromParticipant
    }
    buyerTotalCents
    fromParticipant
    submittedAt
    from {
      __typename
      ... on EcommerceUser {
        id
      }
      ... on EcommercePartner{
        id
      }
    }
  }
`

export const OfferRelatedFields = gql`
  ... on EcommerceOfferOrder {
    myLastOffer {
      ${OfferFields}
    }
    lastOffer {
      ${OfferFields}
    }
    offers {
      edges {
        node {
          ${OfferFields}
        }
      }
    }
    awaitingResponseFrom
  }
`

export const BuyerOrderFields = gql`
  ${ParticipantFields}
  ${RequestedFulfillmentFragment}
  ${OfferRelatedFields}
  __typename
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
  totalListPriceCents
  transactionFeeCents
  lastTransactionFailed
  updatedAt
  lineItems {
    edges {
      node {
        id
        priceCents
        listPriceCents
        artworkId
        artworkVersionId
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
  mode
  sellerTotalCents
  shippingTotalCents
  state
  stateExpiresAt
  stateReason
  stateUpdatedAt
  taxTotalCents
  totalListPriceCents
  transactionFeeCents
  lastTransactionFailed
  updatedAt
`

export const AllOrderFields = gql`
  __typename
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
  totalListPriceCents
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
  lastTransactionFailed
`
