import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("PartnersConnection", () => {
  it("returns a list of partners matching array of ids and passes correct arguments", async () => {
    const partnersLoader = jest.fn(({ id }) => {
      if (id) {
        return Promise.resolve({
          body: id.map((id) => ({ _id: id })),
          headers: { "x-total-count": 1 },
        })
      }

      throw new Error("Unexpected invocation")
    })

    const query = gql`
      {
        partnersConnection(
          ids: ["5a958e8e7622dd49f4f4176d"]
          maxDistance: 10
          near: "40.0,-70.0"
          type: GALLERY
          eligibleForListing: true
          excludeFollowedPartners: false
          defaultProfilePublic: false
          sort: CREATED_AT_ASC
        ) {
          edges {
            node {
              internalID
            }
          }
        }
      }
    `
    const { partnersConnection } = await runQuery(query, {
      partnersLoader,
    })

    expect(partnersLoader).toHaveBeenCalledWith({
      id: ["5a958e8e7622dd49f4f4176d"],
      default_profile_public: false,
      max_distance: 10,
      near: "40.0,-70.0",
      page: 1,
      total_count: true,
      eligible_for_listing: true,
      exclude_followed_partners: false,
      sort: "created_at",
      type: ["PartnerGallery"],
    })

    expect(partnersConnection.edges[0].node.internalID).toEqual(
      "5a958e8e7622dd49f4f4176d"
    )
  })

  describe("when `near` param is not provided and ip based location lookup fails", () => {
    it("returns a list of partners without sending `distance` param", async () => {
      const partnersLoader = jest.fn(async () => {
        return {
          body: [{ _id: "test-id" }],
          headers: { "x-total-count": 1 },
        }
      })

      const query = gql`
        {
          partnersConnection(
            maxDistance: 10
            type: GALLERY
            eligibleForListing: true
            excludeFollowedPartners: false
            defaultProfilePublic: false
            sort: DISTANCE
          ) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      `
      const { partnersConnection } = await runQuery(query, {
        partnersLoader,
        requestLocationLoader: () => null,
        ipAddress: "ip-address",
      })

      expect(partnersLoader).toHaveBeenCalledWith({
        default_profile_public: false,
        page: 1,
        total_count: true,
        eligible_for_listing: true,
        exclude_followed_partners: false,
        sort: "-created_at",
        type: ["PartnerGallery"],
      })

      expect(partnersConnection).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "node": {
                "internalID": "test-id",
              },
            },
          ],
        }
      `)
    })
  })
})
