import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partnerCategories", () => {
  it("passes the correct arguments to gravity", async () => {
    const query = gql`
      {
        partnerCategories(categoryType: GALLERY, size: 10, internal: false) {
          partners(
            eligibleForListing: true
            eligibleForPrimaryBucket: true
            sort: RANDOM_SCORE_DESC
            defaultProfilePublic: true
          ) {
            name
          }
        }
      }
    `

    const partnerCategoriesLoader = jest.fn(() =>
      Promise.resolve([
        {
          _id: "55f0d1ec776f72193900000b",
          id: "19th-century-art",
          category_type: "Gallery",
          name: "19th Century Art",
          internal: false,
        },
      ])
    )
    const partnersLoader = jest.fn(() => Promise.resolve([]))

    await runQuery(query, {
      partnerCategoriesLoader,
      partnersLoader,
    })

    expect(partnersLoader).toBeCalledWith(
      expect.objectContaining({
        default_profile_public: true,
        eligible_for_listing: true,
        eligible_for_primary_bucket: true,
        partner_categories: ["19th-century-art"],
        sort: "-random_score",
      })
    )
  })
})
