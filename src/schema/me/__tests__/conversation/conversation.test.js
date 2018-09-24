/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Conversation", () => {
    const rootValue = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "420",
          initial_message:
            "Buncha secret stuff Message from Percy:\n\nLoved some of the works at your fair booth!",
          from_email: "collector@example.com",
          from_name: "Percy",
          _embedded: {
            last_message: {
              snippet: "Cool snippet",
              from_email_address: "other-collector@example.com",
              id: "25",
            },
          },
          from_last_viewed_message_id: "20",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-42",
              title: "Pwetty Cats",
              properties: {
                title: "Pwetty Cats",
                acquireable: true,
                artists: [
                  {
                    id: "artist-42",
                  },
                ],
              },
            },
            {
              item_type: "PartnerShow",
              item_id: "show-42",
              title: "Catty Show",
              properties: {
                is_reference: true,
                display_on_partner_profile: true,
              },
            },
          ],
        })
      },
      conversationMessagesLoader: ({ sort } = { sort: "asc" }) => {
        let messages = [
          {
            id: "240",
            raw_text: "this is a good message",
            from_email_address: "fancy_german_person@posteo.de",
            from_id: null,
            attachments: [],
            metadata: {
              lewitt_invoice_id: "420i",
            },
            from: `"Percy Z" <percy@cat.com>`,
            from_principal: true,
            body: "I'm a cat",
          },
          {
            id: "241",
            raw_text: "this is a good message",
            from_email_address: "postman@posteo.de",
            from_id: null,
            attachments: [],
            metadata: {},
            from: `"Bitty Z" <Bitty@cat.com>`,
            from_principal: false,
            body: "",
          },
          {
            id: "242",
            raw_text: "this is a good message",
            from_email_address: "fancy_german_person+wunderbar@posteo.de",
            from_id: "user-42",
            attachments: [],
            metadata: {},
            from: `"Matt Z" <matt@cat.com>`,
            body: null,
          },
          {
            id: "243",
            raw_text: "this is a good message",
            from_email_address: "postman+wunderlich@posteo.de",
            from_id: "user-21",
            attachments: [],
            metadata: {},
            from: "<email@email.com>",
            from_principal: null,
            deliveries: [
              {
                opened_at: "2020-12-31T12:00:00+00:00",
              },
            ],
          },
        ]

        if (sort === "desc") {
          messages = messages.reverse()
        }

        return Promise.resolve({
          total_count: 4,
          message_details: messages,
        })
      },
      conversationInvoiceLoader: () =>
        Promise.resolve({
          payment_url: "https://www.adopt-cats.org/adopt-all-the-cats",
          state: "unpaid",
          symbol: "$",
          total_cents: 420000,
          lewitt_invoice_id: "420",
          id: "1",
        }),
    }

    it("returns a conversation", () => {
      const query = `
        {
          me {
            conversation(id: "420") {
              id
              initial_message
              from {
                email
              }
              last_message_id
              unread
              messages(first: 10) {
                edges {
                  node {
                    id
                    is_invoice
                    invoice {
                      __id
                      id
                      payment_url
                      state
                      total
                    }
                    is_from_user
                    from {
                      name
                      email
                    }
                    body
                    deliveries {
                      opened_at
                    }
                  }
                }
              }
            }
          }
        }
      `

      return runAuthenticatedQuery(query, rootValue).then(
        ({ me: conversation }) => {
          expect(conversation).toMatchSnapshot()
        }
      )
    })

    describe("concerning unread indicator", () => {
      it("returns the right unread status", () => {
        const query = `
          {
            me {
              conversation(id: "420") {
                is_last_message_to_user
                last_message_open
                last_message_delivery_id
              }
            }
          }
        `

        const message = {
          message_details: [
            {
              deliveries: [
                {
                  id: "2",
                  email: "collector@example.com",
                  opened_at: "2020-12-31T12:00:00+00:00",
                },
              ],
            },
          ],
        }

        const customRootValue = Object.assign({}, rootValue, {
          conversationMessagesLoader: () => Promise.resolve(message),
        })

        return runAuthenticatedQuery(query, customRootValue).then(
          ({ me: { conversation } }) => {
            expect(conversation).toMatchSnapshot()
          }
        )
      })
    })

    describe("concerning items", () => {
      const query = `
        {
          me {
            conversation(id: "420") {
              items {
                title
                item {
                  __typename
                  ... on Artwork {
                    is_acquireable
                  }
                  ... on Show {
                    is_reference
                  }
                }
              }
            }
          }
        }
      `

      it("returns the conversation items", () => {
        return runAuthenticatedQuery(query, rootValue).then(
          ({
            me: {
              conversation: { items },
            },
          }) => {
            expect(items.length).toEqual(2)
            expect(items).toMatchSnapshot()
          }
        )
      })

      it("doesnt return invalid items", () => {
        const customRootValue = Object.assign({}, rootValue, {
          // Get a copy of the conversation payload, mutate it, and return that instead.
          conversationLoader: () =>
            rootValue.conversationLoader().then(conversation => {
              const convo = conversation
              convo.items[0].properties = {}
              return convo
            }),
        })

        return runAuthenticatedQuery(query, customRootValue).then(
          ({
            me: {
              conversation: { items },
            },
          }) => {
            expect(items.length).toEqual(1)
            expect(items).toMatchSnapshot()
          }
        )
      })
    })

    describe("messages", () => {
      const getQuery = (sort = "ASC") => {
        return `
          {
            me {
              conversation(id: "420") {
                messages(first: 10, sort: ${sort}) {
                  edges {
                    node {
                      id
                      is_from_user
                    }
                  }
                }
              }
            }
          }
        `
      }

      it("returns messages in ascending order", () => {
        const query = getQuery()

        return runAuthenticatedQuery(query, rootValue).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.id).toEqual("240")
          }
        )
      })

      it("returns messages in descending order", () => {
        const query = getQuery("DESC")

        return runAuthenticatedQuery(query, rootValue).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.id).toEqual("243")
          }
        )
      })
      it("returns proper is_from_user for different values of `from_principal`", () => {
        const query = getQuery()

        return runAuthenticatedQuery(query, rootValue).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.is_from_user).toEqual(true)
            expect(messages.edges[1].node.is_from_user).toEqual(false)
            expect(messages.edges[2].node.is_from_user).toEqual(true)
            expect(messages.edges[3].node.is_from_user).toEqual(false)
          }
        )
      })
    })
  })
})
