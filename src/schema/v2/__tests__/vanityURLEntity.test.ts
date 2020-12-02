import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("vanityURLEntity", () => {
  it("returns a fair for a profile id associated with a fair type", async () => {
    const profile = {
      id: "some-profile-id",
      owner_type: "Fair",
      owner: {
        id: "some-owner-id",
      },
    }

    const profileLoader = (id) => {
      if (id) {
        return Promise.resolve(profile)
      }
      throw new Error("Unexpected invocation")
    }

    const fair = {
      id: "the-armory-show-2017",
      name: "The Armory Show 2017",
      organizer: {
        profile_id: "the-armory-show",
      },
      mobile_image: {
        image_url: "circle-image.jpg",
      },
    }

    const fairLoader = (id) => {
      if (id) {
        return Promise.resolve(fair)
      }
      throw new Error("Unexpected invocation")
    }

    const partnerLoader = () => {
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        vanityURLEntity(id: "some-profile-id") {
          __typename
        }
      }
    `

    const { vanityURLEntity } = await runAuthenticatedQuery(query, {
      profileLoader,
      partnerLoader,
      fairLoader,
    })
    expect(vanityURLEntity.__typename).toEqual("Fair")
  })

  it("returns a partner for a profile id associated with a partner type", async () => {
    const profile = {
      id: "some-profile-id",
      owner_type: "PartnerGallery",
      owner: {
        id: "some-owner-id",
      },
    }

    const profileLoader = (id) => {
      if (id) {
        return Promise.resolve(profile)
      }
      throw new Error("Unexpected invocation")
    }

    const partner = {
      id: "catty-partner",
      slug: "catty-partner",
      name: "Catty Partner",
      has_full_profile: true,
      profile_banner_display: true,
      partner_categories: [
        {
          id: "blue-chip",
          name: "Blue Chip",
        },
      ],
      website: "https://www.newmuseum.org/",
    }

    const fairLoader = () => {
      throw new Error("Unexpected invocation")
    }

    const partnerLoader = (id) => {
      if (id) {
        return Promise.resolve(partner)
      }
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        vanityURLEntity(id: "some-profile-id") {
          __typename
        }
      }
    `

    const { vanityURLEntity } = await runAuthenticatedQuery(query, {
      profileLoader,
      partnerLoader,
      fairLoader,
    })
    expect(vanityURLEntity.__typename).toEqual("Partner")
  })

  it("throws an error for a profile id with an unrecognized type", async () => {
    const profile = {
      id: "some-profile-id",
      owner_type: "UnknownType",
      owner: {
        id: "some-owner-id",
      },
    }

    const profileLoader = (id) => {
      if (id) {
        return Promise.resolve(profile)
      }
      throw new Error("Unexpected invocation")
    }

    const fairLoader = () => {
      throw new Error("Unexpected invocation")
    }

    const partnerLoader = () => {
      throw new Error("Unexpected invocation")
    }

    const query = gql`
      {
        vanityURLEntity(id: "some-profile-id") {
          __typename
        }
      }
    `
    expect.assertions(1)

    await expect(
      runAuthenticatedQuery(query, {
        profileLoader,
        partnerLoader,
        fairLoader,
      })
    ).rejects.toThrow("Unrecognized profile type: UnknownType")
  })
})
