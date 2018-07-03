export default {
  id: "fooid123",
  code: "1",
  currencyCode: "usd",
  itemsTotalCents: "$4,200",
  shippingTotalCents: "$4,201",
  taxTotalCents: "$4,202",
  commissionFeeCents: "$4,203",
  transactionFeeCents: "$4,204",
  state: "PENDING",
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
          },
        },
      },
    ],
  },
}
