import schema from "schema"
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateBuyerOutcome", () => {
  const gravity = sinon.stub()
  const impulse = sinon.stub()
  const UpdateBuyerOutcome = schema.__get__("UpdateBuyerOutcome")

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity)
    impulse.with = sinon.stub().returns(impulse)

    UpdateBuyerOutcome.__Rewire__("gravity", gravity)
    UpdateBuyerOutcome.__Rewire__("impulse", impulse)
  })

  afterEach(() => {
    UpdateBuyerOutcome.__ResetDependency__("gravity")
    UpdateBuyerOutcome.__ResetDependency__("impulse")
  })

  it("updates and returns a conversation", () => {
    const mutation = `
      mutation {
        updateBuyerOutcome(input: { ids: ["3"], buyer_outcome: HIGH_PRICE }) {
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

    return runAuthenticatedQuery(mutation).then(({ updateBuyerOutcome }) => {
      expect(updateBuyerOutcome).toEqual(expectedConversationData)
    })
  })
})
