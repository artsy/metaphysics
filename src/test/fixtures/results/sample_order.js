const defaultResponse = {
  id: "fooid123",
  code: "1",
  currencyCode: "usd",
  fulfillmentType: "SHIP",
  shippingAddressLine1: "Vanak 123",
  shippingAddressLine2: "P 80",
  shippingCity: "Tehran",
  shippingRegion: "Tehran",
  shippingCountry: "IR",
  shippingPostalCode: "09821",
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
  createdAt: "2018-07-03 17:57:47 UTC",
  updatedAt: "2018-07-03 17:57:47 UTC",
  stateUpdatedAt: "2018-07-03 17:57:47 UTC",
  stateExpiresAt: "2018-07-03 17:57:47 UTC",
  partner: {
    id: "111",
    name: "Subscription Partner",
  },
  user: {
    id: "111",
    email: "bob@ross.com",
  },
  lineItems: [],
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
  if (fulfillments) {
    return {
      edges: [
        {
          node: {
            artwork: {
              id: "hubert-farnsworth-smell-o-scope",
              title: "Smell-O-Scope",
              inventoryId: "inventory note",
            },
            fulfillments: sampleFulfillments(),
          },
        },
      ],
    }
  }
  return {
    edges: [
      {
        node: {
          artwork: {
            id: "hubert-farnsworth-smell-o-scope",
            title: "Smell-O-Scope",
            inventoryId: "inventory note",
          },
        },
      },
    ],
  }
}

export default function sampleResponse(lineItems = true, fulfillments = false) {
  if (lineItems) {
    return { ...defaultResponse, lineItems: sampleLineItems(fulfillments) }
  } else {
    return defaultResponse
  }
}
