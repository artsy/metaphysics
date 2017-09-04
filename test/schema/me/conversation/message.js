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
                raw_text:
                  "I'm a cat\n\nAbout this collector:\n\nSarah Scott is based in NY, NY and has been an Artsy member" +
                  "since February 2015.\n\nVIEW FULL INQUIRY ( https://cms-staging.artsy.net/conversations/70 )\n\n" +
                  "( https://staging.artsy.net/artwork/rafael-rozendaal-shadow-object-16-07-03?utm_campaign=20170822" +
                  "&utm_medium=email&utm_source=inquiry-request )\n\nRafaël Rozendaal " +
                  "( https://staging.artsy.net/artist/rafael-rozendaal?utm_campaign=20170822&utm_medium=email&utm_sou" +
                  "rce=inquiry-request )\n\nShadow Object 16 07 03 ( https://staging.artsy.net/artwork/rafael-rozend" +
                  "al-shadow-object-16-07-03?utm_campaign=20170822&utm_medium=email&utm_source=inquiry-request ), " +
                  "2016\n\nSteel\n\n19 7/10 × 19 7/10 in\n\n50 × 50 cm\n\nContact For Price\n\nUnique\n\nThis is an " +
                  "inquiry sent through Artsy regarding interest in the work “Shadow Object 16 07 03” (2016) by Rafaë" +
                  "l Rozendaal. Please respond to this inquiry by replying directly to this email.",
                from_email_address: "fancy_german_person@posteo.de",
                from_id: null,
                attachments: [],
                metadata: {
                  lewitt_invoice_id: "420i",
                },
                from: `"Percy Z" <percy@cat.com>`,
                body:
                  "I'm a cat\n\nAbout this collector:\n\nSarah Scott is based in NY, NY and has been an Artsy member" +
                  "since February 2015.\n\nVIEW FULL INQUIRY ( https://cms-staging.artsy.net/conversations/70 )\n\n" +
                  "( https://staging.artsy.net/artwork/rafael-rozendaal-shadow-object-16-07-03?utm_campaign=20170822" +
                  "&utm_medium=email&utm_source=inquiry-request )\n\nRafaël Rozendaal " +
                  "( https://staging.artsy.net/artist/rafael-rozendaal?utm_campaign=20170822&utm_medium=email&utm_sou" +
                  "rce=inquiry-request )\n\nShadow Object 16 07 03 ( https://staging.artsy.net/artwork/rafael-rozend" +
                  "al-shadow-object-16-07-03?utm_campaign=20170822&utm_medium=email&utm_source=inquiry-request ), " +
                  "2016\n\nSteel\n\n19 7/10 × 19 7/10 in\n\n50 × 50 cm\n\nContact For Price\n\nUnique\n\nThis is an " +
                  "inquiry sent through Artsy regarding interest in the work “Shadow Object 16 07 03” (2016) by Rafaë" +
                  "l Rozendaal. Please respond to this inquiry by replying directly to this email.",
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

        return runAuthenticatedQuery(query, rootValue).then(({ me: conversation }) => {
          expect(conversation).toMatchSnapshot()
        })
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

        return runAuthenticatedQuery(query, customRootValue).then(({ me: { conversation } }) => {
          expect(conversation).toMatchSnapshot()
        })
      })
    })
  })
})
