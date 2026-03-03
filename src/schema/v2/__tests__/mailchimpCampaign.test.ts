import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("mailchimpCampaign", () => {
  describe("single campaign query", () => {
    const query = `
      {
        mailchimpCampaign(id: "c-1") {
          internalID
          subjectLine
          status
        }
      }
    `

    const mockGravityResponse = {
      id: "c-1",
      _id: "c-1",
      subject_line: "Hello World",
      status: "draft",
      partner_id: "partner-1",
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        mailchimpCampaignLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes the id to the loader", async () => {
      await runAuthenticatedQuery(query, context)

      expect(context.mailchimpCampaignLoader as jest.Mock).toHaveBeenCalledWith(
        "c-1"
      )
    })

    it("returns campaign fields", async () => {
      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "mailchimpCampaign": {
            "internalID": "c-1",
            "status": "DRAFT",
            "subjectLine": "Hello World",
          },
        }
      `)
    })
  })

  describe("campaigns list query", () => {
    const query = `
      {
        mailchimpCampaigns(partnerId: "partner-1") {
          internalID
          subjectLine
          status
        }
      }
    `

    const mockGravityResponse = {
      body: [
        {
          id: "c-1",
          _id: "c-1",
          subject_line: "Hello World",
          status: "sent",
          partner_id: "partner-1",
        },
      ],
      headers: { "x-total-count": "1" },
    }

    let context: Partial<ResolverContext>

    beforeEach(() => {
      context = {
        mailchimpCampaignsLoader: jest
          .fn()
          .mockResolvedValue(mockGravityResponse),
      }
    })

    it("passes correct params to loader", async () => {
      await runAuthenticatedQuery(query, context)

      expect(
        context.mailchimpCampaignsLoader as jest.Mock
      ).toHaveBeenCalledWith({
        partner_id: "partner-1",
        status: undefined,
        size: undefined,
        offset: undefined,
      })
    })

    it("returns list of campaigns", async () => {
      const result = await runAuthenticatedQuery(query, context)

      expect(result).toMatchInlineSnapshot(`
        {
          "mailchimpCampaigns": [
            {
              "internalID": "c-1",
              "status": "SENT",
              "subjectLine": "Hello World",
            },
          ],
        }
      `)
    })
  })
})
