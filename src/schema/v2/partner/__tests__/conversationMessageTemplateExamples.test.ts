import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversationMessageTemplateExamples", () => {
  it("returns all examples when no templates exist", async () => {
    const partnerLoader = jest.fn().mockResolvedValue({ id: "partner-id" })
    const conversationMessageTemplatesLoader = jest
      .fn()
      .mockResolvedValue({ body: [], headers: { "x-total-count": "0" } })

    const query = gql`
      {
        partner(id: "partner-id") {
          conversationMessageTemplateExamples {
            internalID
            title
            body
          }
        }
      }
    `

    const data = await runQuery(query, {
      partnerLoader,
      conversationMessageTemplatesLoader,
    })
    const examples = data.partner.conversationMessageTemplateExamples

    expect(examples.length).toBeGreaterThan(0)
    expect(examples[0]).toHaveProperty("internalID")
    expect(examples[0]).toHaveProperty("title")
    expect(examples[0]).toHaveProperty("body")
  })

  it("filters out claimed examples (both saved and dismissed)", async () => {
    const partnerLoader = jest.fn().mockResolvedValue({ id: "partner-id" })
    const conversationMessageTemplatesLoader = jest
      .fn()
      .mockImplementation(({ is_deleted }) => {
        if (is_deleted === false) {
          return Promise.resolve({
            body: [
              {
                id: "template-1",
                source_example_id: "general-inquiry",
                is_deleted: false,
              },
            ],
            headers: { "x-total-count": "1" },
          })
        }
        return Promise.resolve({
          body: [
            {
              id: "template-2",
              source_example_id: "work-not-available",
              is_deleted: true,
            },
          ],
          headers: { "x-total-count": "1" },
        })
      })

    const query = gql`
      {
        partner(id: "partner-id") {
          conversationMessageTemplateExamples {
            internalID
            title
          }
        }
      }
    `

    const data = await runQuery(query, {
      partnerLoader,
      conversationMessageTemplatesLoader,
    })
    const examples = data.partner.conversationMessageTemplateExamples

    const exampleIds = examples.map((ex) => ex.internalID)
    expect(exampleIds).not.toContain("general-inquiry")
    expect(exampleIds).not.toContain("work-not-available")
  })

  it("returns all examples when loader is not available", async () => {
    const partnerLoader = jest.fn().mockResolvedValue({ id: "partner-id" })

    const query = gql`
      {
        partner(id: "partner-id") {
          conversationMessageTemplateExamples {
            internalID
            title
          }
        }
      }
    `

    const data = await runQuery(query, {
      partnerLoader,
    })
    const examples = data.partner.conversationMessageTemplateExamples

    expect(examples.length).toBeGreaterThan(0)
  })
})
