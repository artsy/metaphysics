import gql from "lib/gql"

export const OrderBuyerFields = gql`
... on Order {
  id
  code
  currencyCode
  state
  requestedFulfillment {
    ... on Ship {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
    }
    ... on Pickup {
      fulfillmentType
    }
  }
  itemsTotalCents
  shippingTotalCents
  taxTotalCents
  commissionFeeCents
  transactionFeeCents
  buyerTotalCents
  sellerTotalCents
  itemsTotal
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
}
`

export const OrderSellerFields = gql`
... on Order {
  id
  code
  currencyCode
  state
  requestedFulfillment {
    ... on Ship {
      name
      addressLine1
      addressLine2
      city
      region
      country
      postalCode
    }
    ... on Pickup {
      fulfillmentType
    }
  }
  itemsTotalCents
  shippingTotalCents
  taxTotalCents
  commissionFeeCents
  transactionFeeCents
  buyerTotalCents
  sellerTotalCents
  itemsTotal
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
}
`
