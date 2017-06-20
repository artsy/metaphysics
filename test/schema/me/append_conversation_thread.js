import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("AppendConversationThread", () => {
  const gravity = sinon.stub()
  const impulse = sinon.stub()
  const AppendConversationThread = schema.__get__("AppendConversationThread")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)
    impulse.with = sinon.stub().returns(impulse)

    AppendConversationThread.__Rewire__("gravity", gravity)
    AppendConversationThread.__Rewire__("impulse", impulse)
  })

  afterEach(() => {
    AppendConversationThread.__ResetDependency__("gravity")
    AppendConversationThread.__ResetDependency__("impulse")
  })

  it("updates message and returns payload", () => {
    const mutation = `
      mutation {
        appendConversationThread(
          input: {
            id: "623",
            from:"pio@dog.com",
            body_text: "Sehr schön!"
          }
        ) {
            payload {
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
      }
    `
    const messagePayload = {
      id: "222",
      radiation_message_id: "333",
    }
    const conversation = {
      id: "420",
      initial_message: "10/10 would buy",
      to: ["1234567"],
      to_name: "Some Gallery",
      messages: [{ snippet: "Take my money!" }],
    }
    const expectedResponseData = {
      payload: {
        conversation: {
          id: "420",
        },
        messageEdge: {
          cursor: "YXJyYXljb25uZWN0aW9uOjE=",
          node: {
            id: "222",
          },
        },
      },
    }
    gravity.onCall(0).returns(Promise.resolve({ token: "token" })) // First call just adds the message
    impulse.onCall(0).returns(Promise.resolve(messagePayload))
    gravity.onCall(1).returns(Promise.resolve({ token: "token" })) // Second call is for the conversation data
    impulse.onCall(1).returns(Promise.resolve(conversation))
    return runAuthenticatedQuery(mutation).then(({ appendConversationThread }) => {
      expect(appendConversationThread).toEqual(expectedResponseData)
    })
  })
})
