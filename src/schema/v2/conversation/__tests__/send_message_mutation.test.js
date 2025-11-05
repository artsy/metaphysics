/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("SendConversationMessageMutation", () => {
  const conversationLoader = () =>
    Promise.resolve({
      attachments: [
        { name: "foo", type: "bar", url: "baz", id: "bam", size: "20" },
      ],
      from_email: "gallery@example.com",
      id: "420",
      initial_message: "10/10 would buy",
      to_name: "Some Gallery",
      to: ["1234567"],
    })

  it("creates a message and returns its new data payload", () => {
    const mutation = `
      mutation {
        sendConversationMessage(
          input: {
            attachments: [{ name: "foo", type: "bar", url: "baz", id: "bam", size: "20"}],
            bodyHTML: "Body html...",
            bodyText: "Sehr schön!"
            from: "pio-dog@example.com",
            fromId: "123",
            id: "623",
            replyAll: true,
            replyToMessageID: "221",
            to: ["foo@bar.com"]
          }
        ) {
            conversation {
              internalID
            }
            messageEdge {
              cursor
              node {
                internalID
                body
                from {
                  email
                  name
                }
              }
            }
          }
      }
    `

    const context = {
      conversationLoader,
      conversationCreateMessageLoader: () =>
        Promise.resolve({
          id: "222",
          radiation_message_id: "333",
        }),
    }

    return runAuthenticatedQuery(mutation, context).then(
      ({ sendConversationMessage }) => {
        expect(sendConversationMessage).toEqual({
          conversation: { internalID: "420" },
          messageEdge: {
            cursor: "YXJyYXljb25uZWN0aW9uOjA=",
            node: {
              internalID: "222",
              body: "Sehr schön!",
              from: { email: "pio-dog@example.com", name: null },
            },
          },
        })
      }
    )
  })

  it("passes conversationMessageTemplateVersionId to the loader", () => {
    const mutation = `
      mutation {
        sendConversationMessage(
          input: {
            bodyText: "Message with template"
            from: "sender@example.com",
            id: "623",
            replyToMessageID: "221",
            conversationMessageTemplateVersionId: "template-version-456"
          }
        ) {
            conversation {
              internalID
            }
          }
      }
    `

    const conversationCreateMessageLoader = jest.fn(() =>
      Promise.resolve({
        id: "333",
        radiation_message_id: "444",
      })
    )

    const context = {
      conversationLoader,
      conversationCreateMessageLoader,
    }

    return runAuthenticatedQuery(mutation, context).then(() => {
      expect(conversationCreateMessageLoader).toHaveBeenCalledWith(
        "623",
        expect.objectContaining({
          conversation_message_template_version_id: "template-version-456",
        })
      )
    })
  })
})
