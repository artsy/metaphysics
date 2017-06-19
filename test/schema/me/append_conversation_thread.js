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
            message {
              id
              radiation_message_id
            }
          }
      }
    `
    const payload = {
      id: "222",
      radiation_message_id: "333",
    }
    const expectedResponseData = {
      message: {
        id: "222",
        radiation_message_id: "333",
      },
    }
    gravity.onCall(0).returns(Promise.resolve({ token: "token" }))
    impulse.onCall(0).returns(Promise.resolve(payload))
    return runAuthenticatedQuery(mutation).then(({ appendConversationThread }) => {
      expect(appendConversationThread).toEqual(expectedResponseData)
    })
  })
})
