/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("Conversation", () => {
    const context = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "420",
          initial_message: "Loved some of the works at your fair booth!",
          from_email: "collector@example.com",
          from_name: "Percy",
          _embedded: {
            last_message: {
              snippet:
                "Loved some of the works at your fair booth! About this collector: Percy is a good cat",
              from_email_address: "other-collector@example.com",
              id: "25",
              order: 1,
            },
          },
          from_last_viewed_message_id: "20",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-42",
              title: "Pwetty Cats",
              properties: {
                id: "artwork-42",
                title: "Pwetty Cats",
                acquireable: true,
                artists: [
                  {
                    id: "artist-42",
                  },
                ],
              },
              liveArtwork: {
                slug: "artwork-42",
                isOfferableFromInquiry: true,
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
    }

    it("returns a conversation", () => {
      const query = `
        {
          me {
            conversation(id: "420") {
              internalID
              initialMessage
              from {
                email
              }
              lastMessage
              unread
              messages(first: 10) {
                edges {
                  node {
                    internalID
                    isInvoice
                    invoice {
                      id
                      internalID
                      paymentURL
                      state
                      total
                    }
                    isFromUser
                    from {
                      name
                      email
                    }
                    body
                    deliveries {
                      openedAt
                    }
                  }
                }
              }
            }
          }
        }
      `

      return runAuthenticatedQuery(query, context).then(
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
                isLastMessageToUser
                unread
                lastMessageDeliveryID
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

        const customRootValue = Object.assign({}, context, {
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
                    isAcquireable
                  }
                  ... on Show {
                    isReference
                  }
                }
              }
            }
          }
        }
      `

      it("returns the conversation items", () => {
        return runAuthenticatedQuery(query, context).then(
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
        const customRootValue = Object.assign({}, context, {
          // Get a copy of the conversation payload, mutate it, and return that instead.
          conversationLoader: () =>
            context.conversationLoader().then((conversation) => {
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

      it("returns the conversation live artwork item", () => {
        const newContext = {
          conversationLoader: () => {
            return Promise.resolve({
              id: "420",
              initial_message: "Loved some of the works at your fair booth!",
              from_email: "collector@example.com",
              from_name: "Percy",
              _embedded: {
                last_message: {
                  snippet:
                    "Loved some of the works at your fair booth! About this collector: Percy is a good cat",
                  from_email_address: "other-collector@example.com",
                  id: "25",
                  order: 1,
                },
              },
              from_last_viewed_message_id: "20",
              items: [
                {
                  item_type: "Artwork",
                  item_id: "artwork-42",
                  title: "Pwetty Cats",
                  properties: {
                    id: "artwork-42",
                    title: "Pwetty Cats",
                    acquireable: true,
                    artists: [
                      {
                        id: "artist-42",
                      },
                    ],
                    published: true,
                  },
                  liveArtwork: {
                    slug: "artwork-42",
                    isOfferableFromInquiry: true,
                  },
                },
              ],
            })
          },

          artworkLoader: () => {
            return Promise.resolve({
              id: "artwork-42",
              title: "Untitled (Portrait)",
              forsale: true,
              offerable_from_inquiry: true,
              artists: [],
              published: true,
            })
          },
        }

        const query = `
          {
            me {
              conversation(id: "420") {
                items {
                  title
                  liveArtwork {
                    ... on Artwork {
                      slug
                      isForSale
                      isOfferableFromInquiry
                    }
                  }
                }
              }
            }
          }
        `

        return runAuthenticatedQuery(query, newContext).then(
          ({
            me: {
              conversation: { items },
            },
          }) => {
            const artwork = items[0]
            expect(artwork.liveArtwork.isOfferableFromInquiry).toBe(true)
            expect(artwork.liveArtwork.isForSale).toBe(true)
            expect(artwork.liveArtwork.slug).toBe("artwork-42")
          }
        )
      })

      it("returns null when the artwork is not published", () => {
        const newContext = {
          conversationLoader: () => {
            return Promise.resolve({
              id: "420",
              initial_message: "Loved some of the works at your fair booth!",
              from_email: "collector@example.com",
              from_name: "Percy",
              _embedded: {
                last_message: {
                  snippet:
                    "Loved some of the works at your fair booth! About this collector: Percy is a good cat",
                  from_email_address: "other-collector@example.com",
                  id: "25",
                  order: 1,
                },
              },
              from_last_viewed_message_id: "20",
              items: [
                {
                  item_type: "Artwork",
                  item_id: "artwork-42",
                  title: "Pwetty Cats",
                  properties: {
                    id: "artwork-42",
                    title: "Pwetty Cats",
                    acquireable: true,
                    artists: [
                      {
                        id: "artist-42",
                      },
                    ],
                    published: true,
                  },
                  liveArtwork: null,
                },
              ],
            })
          },

          artworkLoader: () => Promise.reject({ error: "Artwork Not Found" }),
        }

        const query = `
          {
            me {
              conversation(id: "420") {
                items {
                  title
                  liveArtwork {
                    ... on Artwork {
                      slug
                      isForSale
                      isOfferableFromInquiry
                    }
                  }
                }
              }
            }
          }
        `

        return runAuthenticatedQuery(query, newContext).then(
          ({
            me: {
              conversation: { items },
            },
          }) => {
            const artwork = items[0]
            expect(artwork.liveArtwork).toBe(null)
          }
        )
      })

      it("returns null when item is a partner show", () => {
        const newContext = {
          conversationLoader: () => {
            return Promise.resolve({
              id: "420",
              initial_message: "Loved some of the works at your fair booth!",
              from_email: "collector@example.com",
              from_name: "Percy",
              _embedded: {
                last_message: {
                  snippet:
                    "Loved some of the works at your fair booth! About this collector: Percy is a good cat",
                  from_email_address: "other-collector@example.com",
                  id: "25",
                  order: 1,
                },
              },
              from_last_viewed_message_id: "20",
              items: [
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
        }

        const query = `
          {
            me {
              conversation(id: "420") {
                items {
                  title
                  liveArtwork {
                    ... on Artwork {
                      slug
                      isForSale
                      isOfferableFromInquiry
                    }
                  }
                }
              }
            }
          }
        `

        return runAuthenticatedQuery(query, newContext).then(
          ({
            me: {
              conversation: { items },
            },
          }) => {
            const artwork = items[0]
            expect(artwork.liveArtwork).toBe(null)
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
                      internalID
                      isFromUser
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

        return runAuthenticatedQuery(query, context).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.internalID).toEqual("240")
          }
        )
      })

      it("returns messages in descending order", () => {
        const query = getQuery("DESC")

        return runAuthenticatedQuery(query, context).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.internalID).toEqual("243")
          }
        )
      })
      it("returns proper is_from_user for different values of `from_principal`", () => {
        const query = getQuery()

        return runAuthenticatedQuery(query, context).then(
          ({
            me: {
              conversation: { messages },
            },
          }) => {
            expect(messages.edges.length).toEqual(4)
            expect(messages.edges[0].node.isFromUser).toEqual(true)
            expect(messages.edges[1].node.isFromUser).toEqual(false)
            expect(messages.edges[2].node.isFromUser).toEqual(true)
            expect(messages.edges[3].node.isFromUser).toEqual(false)
          }
        )
      })
    })
  })
})
