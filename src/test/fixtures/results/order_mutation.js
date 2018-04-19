export default {
  updateOrder: {
    clientMutationId: null,
    order: {
      id: "fooid123",
      telephone: "6073499419",
      email: null,
      line_items: [
        {
          quantity: 1,
          artwork: {
            id: "michele-pred-pussy-grabs-back-1",
            title: "Pussy Grabs Back",
            artist: {
              name: "Michele Pred",
            },
          },
          edition_set: {
            id: "editionset1",
            is_for_sale: true,
            is_sold: false,
            price: "$2,000",
            is_acquireable: true,
            edition_of: "Edition 8/10",
          },
          partner: null,
          partner_location: null,
          shipping_note: null,
          sale_conditions_url: null,
        },
      ],
      item_total: {
        amount: "$2,000",
        display: "$2,000.00",
      },
      shipping_address: {
        name: "sarah sarah",
        street: "401 Broadway, 25th Floor",
        city: "New York",
        region: "NY",
        postal_code: null,
        country: null,
      },
    },
  },
}
