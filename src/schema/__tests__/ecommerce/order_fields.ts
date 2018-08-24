import gql from "lib/gql"

export const OrderBuyerFields = gql`
... on Order {
  id
  code
  currencyCode
  state
  fulfillmentType
  shippingName
  shippingAddressLine1
  shippingAddressLine2
  shippingCity
  shippingCountry
  shippingPostalCode
  shippingRegion
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
  partner {
    id
    name
  }
  user {
    id
    email
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
  fulfillmentType
  shippingName
  shippingAddressLine1
  shippingAddressLine2
  shippingCity
  shippingCountry
  shippingPostalCode
  shippingRegion
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
  partner {
    id
    name
  }
  user {
    id
    email
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
