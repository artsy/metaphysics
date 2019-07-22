import gql from "lib/gql"

export const OrderBuyerFields = gql`
... on Order {
  id
  mode
  code
  currencyCode
  state
  stateReason
  buyerPhoneNumber
  requestedFulfillment {
    ... on Ship {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
      phoneNumber
    }
    ... on Pickup {
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
  seller {
    ...on Partner {
      id
      name
    }
    ... on User {
      id
      email
    }
  }
  buyer {
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
    last_digits
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
  ... on OfferOrder {
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
... on Order {
  id
  mode
  code
  currencyCode
  state
  stateReason
  buyerPhoneNumber
  requestedFulfillment {
    ... on Ship {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
      phoneNumber
    }
    ... on Pickup {
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
  seller {
    ...on Partner {
      id
      name
    }
  }
  buyer {
    ... on User {
      id
      email
    }
  }
  creditCard {
    id
    brand
    last_digits
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
  ... on OfferOrder {
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
