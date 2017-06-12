import schema from "../../../schema"
import { runAuthenticatedQuery } from "../../utils"

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
      const query = `
        {
          me {
            conversation(id: "420") {
              id
              initial_message
              from_email
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
          from_email: "fancy_german_person@posteo.de",
        },
      }

      gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
      impulse.onCall(0).returns(Promise.resolve(conversation1))

      return runAuthenticatedQuery(query).then(({ me: conversation }) => {
        expect(conversation).toEqual(expectedConversationData)
      })
    })
  })
})
