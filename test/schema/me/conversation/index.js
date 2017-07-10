import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Conversation", () => {
    const gravity = sinon.stub()
    const impulse = sinon.stub()
    const Me = schema.__get__("Me")
    const Conversation = Me.__get__("Conversation")

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity)
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
        total_count: 2,
        message_details: [
          {
            id: "240",
            raw_text: "this is a good message",
            from_email_address: "fancy_german_person@posteo.de",
            attachments: [],
            metadata: {
              lewitt_invoice_id: "420i",
            },
          },
          {
            id: "241",
            raw_text: "this is a good message",
            from_email_address: "postman@posteo.de",
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
            ],
          },
        },
      }

      gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(0).returns(Promise.resolve(conversation1))
      gravity.onCall(1).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(1).returns(Promise.resolve(conversation1Messages))

      return runAuthenticatedQuery(query).then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })
  })
})
