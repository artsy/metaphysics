export default {
  id: "fooid123",
  code: "1",
  currencyCode: "usd",
  itemsTotalCents: "$4,200",
  shippingTotalCents: "$4,201",
  taxTotalCents: "$4,202",
  commissionFeeCents: "$4,203",
  transactionFeeCents: "$4,204",
  buyerTotalCents: "$8,000",
  sellerTotalCents: "$8,900",
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
  lineItems: {
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
  },
}
