import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateConversationMutation", () => {
  const impulse = sinon.stub()
  const UpdateConversationMutation = schema.__get__("UpdateConversationMutation")

  const rootValue = {
    impulseTokenLoader: () => Promise.resolve({ token: "token" }),
  }

  beforeEach(() => {
    impulse.with = sinon.stub().returns(impulse)
    UpdateConversationMutation.__Rewire__("impulse", impulse)
  })

  afterEach(() => {
    UpdateConversationMutation.__ResetDependency__("impulse")
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

    impulse.onCall(0).returns(Promise.resolve(conversation))

    return runAuthenticatedQuery(mutation, rootValue).then(({ updateConversation }) => {
      expect(updateConversation).toEqual(expectedConversationData)
    })
  })
})
