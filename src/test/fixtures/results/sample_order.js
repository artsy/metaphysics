const defaultResponse = {
  id: "fooid123",
  mode: "BUY",
  code: "1",
  currencyCode: "usd",
  requestedFulfillment: {
    name: "Dr Collector",
    addressLine1: "Vanak 123",
    addressLine2: "P 80",
    city: "Tehran",
    region: "Tehran",
    country: "IR",
    postalCode: "09821",
    phoneNumber: "093929821",
  },
  buyerPhoneNumber: "093929821",
  itemsTotalCents: 420000,
  itemsTotal: "$4,200",
  shippingTotalCents: 420100,
  shippingTotal: "$4,201",
  taxTotalCents: 420200,
  taxTotal: "$4,202",
  commissionFeeCents: 420300,
  commissionFee: "$4,203",
  transactionFeeCents: 420400,
  transactionFee: "$4,204",
  buyerTotalCents: 800000,
  buyerTotal: "$8,000",
  sellerTotalCents: 890000,
  sellerTotal: "$8,900",
  state: "PENDING",
  stateReason: null,
  createdAt: "2018-07-03 17:57:47 UTC",
  updatedAt: "2018-07-03 17:57:47 UTC",
  stateUpdatedAt: "2018-07-03 17:57:47 UTC",
  stateExpiresAt: "2018-07-03 17:57:47 UTC",
  lastApprovedAt: "2018-04-03 17:57:47 UTC",
  lastSubmittedAt: "2018-03-03 17:57:47 UTC",
  creditCard: null,
  seller: {
    id: "111",
    name: "Subscription Partner",
  },
  buyer: {
    id: "111",
    email: "bob@ross.com",
  },
  lineItems: [],
}

const creditCard = {
  id: "card123",
  brand: "Visa",
  last_digits: "4242",
}

function sampleFulfillments() {
  return {
    edges: [
      {
        node: {
          id: "f-1",
          courier: "fedEx",
          trackingId: "track1",
          estimatedDelivery: "2018-05-18",
        },
      },
    ],
  }
}

function sampleLineItems(fulfillments = false) {
  return {
    edges: [
      {
        node: {
          artwork: {
            id: "hubert-farnsworth-smell-o-scope",
            title: "Smell-O-Scope",
            inventoryId: "inventory note",
          },
          fulfillments: fulfillments ? sampleFulfillments() : null,
        },
      },
    ],
  }
}

export function sampleOrder({
  lineItems = true,
  fulfillments = false,
  includeCreditCard = false,
  mode = "BUY",
} = {}) {
  let orderResponse = defaultResponse

  if (lineItems) {
    orderResponse = {
      ...defaultResponse,
      lineItems: sampleLineItems(fulfillments),
      mode,
    }
  }

  if (includeCreditCard) {
    orderResponse = { ...orderResponse, creditCard }
  }

  return orderResponse
}
