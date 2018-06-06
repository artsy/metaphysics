/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Conversation", () => {
    describe("Message", () => {
      const rootValue = {
        conversationLoader: () =>
          Promise.resolve({
            id: "420",
            initial_message: "Loved some of the works at your fair booth!",
            from_email: "collector@example.com",
          }),
        conversationMessagesLoader: () =>
          Promise.resolve({
            total_count: 1,
            message_details: [
              {
                id: "222",
                raw_text: "I'm a cat",
                from_email_address: "fancy_german_person@posteo.de",
                from_id: null,
                attachments: [],
                metadata: {
                  lewitt_invoice_id: "420i",
                },
                from: `"Percy Z" <percy@cat.com>`,
                from_principal: true,
                original_text: "I'm a cat oh yea!",
                body: "I'm a cat",
              },
            ],
          }),
      }

      it("returns sanitized messages", () => {
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
                      body
                      id
                      from {
                        email
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `

        return runAuthenticatedQuery(query, rootValue).then(
          ({ me: conversation }) => {
            expect(conversation).toMatchSnapshot()
          }
        )
      })

      it("handles null message bodies", () => {
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
                      body
                      id
                    }
                  }
                }
              }
            }
          }
        `

        const message = {
          message_details: [
            {
              body: "null",
              id: "222",
            },
          ],
        }

        const customRootValue = Object.assign({}, rootValue, {
          conversationMessagesLoader: () => Promise.resolve(message),
        })

        return runAuthenticatedQuery(query, customRootValue).then(
          ({ me: { conversation } }) => {
            expect(conversation).toMatchSnapshot()
          }
        )
      })

      it("returns proper is_from_user", () => {
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
                      body
                      id
                      is_from_user
                      from {
                        email
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `

        return runAuthenticatedQuery(query, rootValue).then(
          ({ me: conversation }) => {
            expect(conversation).toMatchSnapshot()
          }
        )
      })
    })
  })
})
