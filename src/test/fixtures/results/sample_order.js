export default {
  id: "fooid123",
  code: "1",
  currencyCode: "usd",
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
