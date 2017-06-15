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
            }
          }
        }
      `

      const conversation1 = {
        id: "420",
        initial_message: "10/10 would buy",
        from_email: "fancy_german_person@posteo.de",
      }

      const expectedConversationData = {
        conversation: {
          id: "420",
          initial_message: "10/10 would buy",
          from: {
            email: "fancy_german_person@posteo.de",
          },
        },
      }

      gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(0).returns(Promise.resolve(conversation1))

      return runAuthenticatedQuery(query).then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })

    it("sets the expand[] param when fetching messages", () => {
      const query = `
        {
          me {
            conversation(id: "420") {
              id
              initial_message
              from {
                email
              }
              messages {
                snippet
              }
            }
          }
        }
      `

      const conversation1 = {
        id: "420",
        initial_message: "10/10 would buy",
        from_email: "fancy_german_person@posteo.de",
        messages: [
          {
            snippet: "Take my money!",
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
          messages: [
            {
              snippet: "Take my money!",
            },
          ],
        },
      }

      gravity.onCall(1).returns(Promise.resolve({ token: "token" }))
      impulse.withArgs("conversations/420", {}).returns("Wrong params")
      impulse.withArgs("conversations/420", { expand: ["messages"] }).returns(Promise.resolve(conversation1))

      return runAuthenticatedQuery(query).then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })

    it("does not set the expand[] param when not fetching messages", () => {
      const query = `
        {
          me {
            conversation(id: "420") {
              id
              initial_message
              from {
                email
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

      const expectedConversationData = {
        conversation: {
          id: "420",
          initial_message: "10/10 would buy",
          from: {
            email: "fancy_german_person@posteo.de",
          },
        },
      }

      gravity.onCall(2).returns(Promise.resolve({ token: "token" }))
      impulse.withArgs("conversations/420", { expand: ["messages"] }).returns("Wrong params")
      impulse.withArgs("conversations/420", {}).returns(Promise.resolve(conversation1))

      return runAuthenticatedQuery(query).then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })
  })
})
