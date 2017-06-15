import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateConversation", () => {
  const gravity = sinon.stub()
  const impulse = sinon.stub()
  const UpdateConversation = schema.__get__("UpdateConversation")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)
    impulse.with = sinon.stub().returns(impulse)

    UpdateConversation.__Rewire__("gravity", gravity)
    UpdateConversation.__Rewire__("impulse", impulse)
  })

  afterEach(() => {
    UpdateConversation.__ResetDependency__("gravity")
    UpdateConversation.__ResetDependency__("impulse")
  })

  it("updates and returns a conversation", () => {
    const mutation = `
      mutation {
        updateConversation(input: { ids: ["3"], buyer_outcome: HIGH_PRICE }) {
          conversations {
            id
            initial_message
            from {
              email
            }
          }
        }
      }
    `

    const conversation = {
      id: "3",
      initial_message: "omg im sooo interested",
      from_email: "percy@cat.com",
    }

    const expectedConversationData = {
      conversations: [
        {
          id: "3",
          initial_message: "omg im sooo interested",
          from: {
            email: "percy@cat.com",
          },
        },
      ],
    }

    gravity.onCall(0).returns(Promise.resolve({ token: "token" }))

    impulse.onCall(0).returns(Promise.resolve(conversation))

    return runAuthenticatedQuery(mutation).then(({ updateConversation }) => {
      expect(updateConversation).toEqual(expectedConversationData)
    })
  })
})
