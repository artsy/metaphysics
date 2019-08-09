import gql from "lib/gql"

export const OrderBuyerFields = gql`
... on CommerceOrder {
  id
  mode
  code
  currencyCode
  state
  stateReason
  buyerPhoneNumber
  requestedFulfillment {
    ... on CommerceShip {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
      phoneNumber
    }
    ... on CommercePickup {
      fulfillmentType
    }
  }
  itemsTotalCents
  totalListPriceCents
  shippingTotalCents
  taxTotalCents
  commissionFeeCents
  transactionFeeCents
  buyerTotalCents
  sellerTotalCents
  itemsTotal
  totalListPrice
  shippingTotal
  taxTotal
  commissionFee
  transactionFee
  buyerTotal
  sellerTotal
  updatedAt
  createdAt
  stateUpdatedAt
  stateExpiresAt
  lastApprovedAt
  lastSubmittedAt
  sellerDetails {
    ...on Partner {
      id
      name
    }
    ... on User {
      id
      email
    }
  }
  buyerDetails {
    ... on User {
      id
      email
    }
    ...on Partner {
      id
      name
    }
  }
  creditCard {
    id
    brand
    lastDigits
  }
  lineItems {
    edges {
      node {
        fulfillments {
          edges {
            node {
              id
              courier
              trackingId
              estimatedDelivery
            }
          }
        }
        artwork {
          id
          title
          inventoryId
        }
      }
    }
  }
  ... on CommerceOfferOrder {
    myLastOffer {
      id
      taxTotalCents
      shippingTotalCents
      amountCents
      buyerTotalCents
      fromParticipant
      note
    }
    lastOffer {
      id
      amountCents
      taxTotalCents
      shippingTotalCents
      buyerTotalCents
      fromParticipant
      note
    }
    offers {
      edges {
        node {
          id
          amountCents
          taxTotalCents
          shippingTotalCents
          buyerTotalCents
          fromParticipant
        }
      }
    }
    awaitingResponseFrom
  }
}
`

export const OrderSellerFields = gql`
... on CommerceOrder {
  id
  mode
  code
  currencyCode
  state
  stateReason
  buyerPhoneNumber
  requestedFulfillment {
    ... on CommerceShip {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
      phoneNumber
    }
    ... on CommercePickup {
      fulfillmentType
    }
  }
  itemsTotalCents
  totalListPriceCents
  shippingTotalCents
  taxTotalCents
  commissionFeeCents
  transactionFeeCents
  buyerTotalCents
  sellerTotalCents
  itemsTotal
  totalListPrice
  shippingTotal
  taxTotal
  commissionFee
  transactionFee
  buyerTotal
  sellerTotal
  updatedAt
  createdAt
  stateUpdatedAt
  stateExpiresAt
  lastApprovedAt
  lastSubmittedAt
  sellerDetails {
    ...on Partner {
      id
      name
    }
  }
  buyerDetails {
    ... on User {
      id
      email
    }
  }
  creditCard {
    id
    brand
    lastDigits
  }
  lineItems {
    edges {
      node {
        fulfillments {
          edges {
            node {
              id
              courier
              trackingId
              estimatedDelivery
            }
          }
        }
        artwork {
          id
          title
          inventoryId
        }
      }
    }
  }
  ... on CommerceOfferOrder {
    myLastOffer {
      id
      taxTotalCents
      shippingTotalCents
      amountCents
      buyerTotalCents
      fromParticipant
      note
    }
    lastOffer {
      id
      amountCents
      taxTotalCents
      shippingTotalCents
      buyerTotalCents
      fromParticipant
    }
    offers {
      edges {
        node {
          id
          amountCents
          taxTotalCents
          shippingTotalCents
          buyerTotalCents
          fromParticipant
        }
      }
    }
    awaitingResponseFrom
  }
}
`
