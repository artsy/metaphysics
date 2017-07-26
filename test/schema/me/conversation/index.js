import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Conversation", () => {
    let gravity
    let impulse
    const Me = schema.__get__("Me")
    const Conversation = Me.__get__("Conversation")

    beforeEach(() => {
      gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)
      impulse = sinon.stub()
      impulse.with = sinon.stub().returns(impulse)

      Conversation.__Rewire__("gravity", gravity)
      Conversation.__Rewire__("impulse", impulse)
    })

    afterEach(() => {
      Conversation.__ResetDependency__("gravity")
      Conversation.__ResetDependency__("impulse")
    })

    it("returns a conversation", () => {
      impulse.with = sinon.stub().returns(impulse)
      Conversation.__Rewire__("impulse", impulse)

      const query = `
        {
          me {
            conversation(id: "420") {
              id
              initial_message
              from {
                email
              }
              messages(first: 10) {
                edges {
                  node {
                    id
                    is_invoice
                    is_from_user
                  }
                }
              }
            }
          }
        }
      `

      const conversation1 = {
        id: "420",
        initial_message: "10/10 would buy",
        from_email: "fancy_german_person@posteo.de",
      }

      const conversation1Messages = {
        total_count: 4,
        message_details: [
          {
            id: "240",
            raw_text: "this is a good message",
            from_email_address: "fancy_german_person@posteo.de",
            from_id: null,
            attachments: [],
            metadata: {
              lewitt_invoice_id: "420i",
            },
          },
          {
            id: "241",
            raw_text: "this is a good message",
            from_email_address: "postman@posteo.de",
            from_id: null,
            attachments: [],
            metadata: {},
          },
          {
            id: "242",
            raw_text: "this is a good message",
            from_email_address: "fancy_german_person+wunderbar@posteo.de",
            from_id: "user-42",
            attachments: [],
            metadata: {},
          },
          {
            id: "243",
            raw_text: "this is a good message",
            from_email_address: "postman+wunderlich@posteo.de",
            from_id: "user-21",
            attachments: [],
            metadata: {},
          },
        ],
      }

      const expectedConversationData = {
        conversation: {
          id: "420",
          initial_message: "10/10 would buy",
          from: {
            email: "fancy_german_person@posteo.de",
          },
          messages: {
            edges: [
              {
                node: {
                  id: "240",
                  is_invoice: true,
                  is_from_user: true,
                },
              },
              {
                node: {
                  id: "241",
                  is_invoice: false,
                  is_from_user: false,
                },
              },
              {
                node: {
                  id: "242",
                  is_invoice: false,
                  is_from_user: true,
                },
              },
              {
                node: {
                  id: "243",
                  is_invoice: false,
                  is_from_user: false,
                },
              },
            ],
          },
        },
      }

      gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(0).returns(Promise.resolve(conversation1))
      gravity.onCall(1).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(1).returns(Promise.resolve(conversation1Messages))

      return runAuthenticatedQuery(query, "user-42").then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })
    describe("concerning items", () => {
      const conversation = {
        initial_message: "Loved some of the works at your fair booth!",
        from_email: "collector@example.com",
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
      }
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
      beforeEach(() => {
        gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
      })
      it("returns the conversation items", () => {
        impulse.onCall(0).returns(Promise.resolve(conversation))
        const expectedItems = [
          {
            title: "Pwetty Cats",
            item: {
              __typename: "Artwork",
              is_acquireable: true,
            },
          },
          {
            title: "Catty Show",
            item: {
              __typename: "Show",
              is_reference: true,
            },
          },
        ]

        return runAuthenticatedQuery(query).then(({ me: { conversation: { items } } }) => {
          expect(items).toEqual(expectedItems)
        })
      })

      it("doesnt return invalid items", () => {
        conversation.items[0].properties = {}
        impulse.onCall(0).returns(Promise.resolve(conversation))
        const expectedItems = [
          {
            title: "Catty Show",
            item: {
              __typename: "Show",
              is_reference: true,
            },
          },
        ]

        return runAuthenticatedQuery(query).then(({ me: { conversation: { items } } }) => {
          expect(items).toEqual(expectedItems)
        })
      })
    })
  })
})
