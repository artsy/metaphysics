import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("SendConversationMessageMutation", () => {
  const impulse = sinon.stub()
  const SendConversationMessageMutation = schema.__get__("SendConversationMessageMutation")

  const rootValue = {
    impulseTokenLoader: () => Promise.resolve({ token: "token" }),
  }

  beforeEach(() => {
    impulse.with = sinon.stub().returns(impulse)
    SendConversationMessageMutation.__Rewire__("impulse", impulse)
  })

  afterEach(() => {
    SendConversationMessageMutation.__ResetDependency__("impulse")
  })

  it("updates message and returns payload", () => {
    const mutation = `
      mutation {
        sendConversationMessage(
          input: {
            id: "623",
            from:"pio@dog.com",
            body_text: "Sehr schön!"
            reply_to_message_id: "221"
          }
        ) {
            conversation {
              id
            }
            messageEdge {
              cursor
              node {
                id
              }
            }
          }
      }
    `
    const messagePayload = {
      id: "222",
      radiation_message_id: "333",
    }
    const conversation = {
      id: "420",
      initial_message: "10/10 would buy",
      from_email: "gallery@example.com",
      to: ["1234567"],
      to_name: "Some Gallery",
    }
    const expectedResponseData = {
      conversation: {
        id: "420",
      },
      messageEdge: {
        cursor: "YXJyYXljb25uZWN0aW9uOjA=",
        node: {
          id: "222",
        },
      },
    }
    impulse.onCall(0).returns(Promise.resolve(messagePayload)) // First call just adds the message
    impulse.onCall(1).returns(Promise.resolve(conversation)) // Second call is for the conversation data
    return runAuthenticatedQuery(mutation, rootValue).then(({ sendConversationMessage }) => {
      expect(sendConversationMessage).toEqual(expectedResponseData)
    })
  })
})
