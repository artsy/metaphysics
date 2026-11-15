import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("PartnerList.publication", () => {
  const query = gql`
    {
      partner(id: "gallery-1") {
        partnerList(id: "list-abc") {
          publication {
            internalID
            published
            passcodeProtected
            passcode
            slug
            href
            description
            heading
            showGalleryName
            artworksCount
          }
        }
      }
    }
  `

  it("returns the publication for a partner list", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        partner_list_id: "list-abc",
        published: true,
        passcode_protected: true,
        passcode: "letmein",
        slug: "some-gallery-for-anna",
        description: "For Anna",
        heading: "For Anna",
        show_gallery_name: false,
        artworks_count: 3,
      }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(context.partnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc"
    )
    expect(result.partner.partnerList.publication).toEqual({
      internalID: "pub-1",
      published: true,
      passcodeProtected: true,
      passcode: "letmein",
      slug: "some-gallery-for-anna",
      href: "/private-viewing-room/some-gallery-for-anna",
      description: "For Anna",
      heading: "For Anna",
      showGalleryName: false,
      artworksCount: 3,
    })
  })

  it("resolves the cover image, or null without one", async () => {
    const coverQuery = gql`
      {
        partner(id: "gallery-1") {
          partnerList(id: "list-abc") {
            publication {
              coverImage {
                internalID
                url(version: "wide")
                isProcessing
              }
            }
          }
        }
      }
    `
    const buildContext = (coverImage) => ({
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        cover_image: coverImage,
      }),
    })

    const withCover = await runAuthenticatedQuery(
      coverQuery,
      buildContext({
        id: "img-1",
        image_url: "https://d32dm0rphc51dk.cloudfront.net/abc/:version.jpg",
        gemini_token_updated_at: new Date().toISOString(),
        image_versions: ["wide"],
        image_urls: {
          wide: "https://d32dm0rphc51dk.cloudfront.net/abc/wide.jpg",
        },
      })
    )
    const withoutCover = await runAuthenticatedQuery(
      coverQuery,
      buildContext(null)
    )

    expect(withCover.partner.partnerList.publication.coverImage).toEqual({
      internalID: "img-1",
      url: "https://d32dm0rphc51dk.cloudfront.net/abc/wide.jpg",
      // Only `wide` exists: done for this template, though the default
      // (artwork) template would still call it processing.
      isProcessing: false,
    })
    expect(withoutCover.partner.partnerList.publication.coverImage).toBeNull()
  })

  it("returns null when no publication exists yet", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListPublicationLoader: jest
        .fn()
        .mockRejectedValue({ statusCode: 404 }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(result.partner.partnerList.publication).toBeNull()
  })

  it("re-throws a non-404 error instead of swallowing it", async () => {
    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({ id: "list-abc" }),
      partnerListPublicationLoader: jest
        .fn()
        .mockRejectedValue({ statusCode: 500, message: "Gravity is down" }),
    }

    await expect(runAuthenticatedQuery(query, context)).rejects.toThrow()
  })

  it("does not resolve publication for a list reached through partnerListsConnection (N+1 guard)", async () => {
    const connectionQuery = gql`
      {
        partner(id: "gallery-1") {
          partnerListsConnection(first: 1) {
            edges {
              node {
                internalID
                publication {
                  slug
                }
              }
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListsLoader: jest.fn().mockResolvedValue({
        body: [{ id: "list-abc" }],
        headers: { "x-total-count": "1" },
      }),
      // If the connection path ever resolves `publication`, this would fire —
      // it must not, since there's no Gravity endpoint to batch this and the
      // resolver refuses to call it outside the single-list lookup.
      partnerListPublicationLoader: jest
        .fn()
        .mockRejectedValue(new Error("should not be called")),
    }

    const result = await runAuthenticatedQuery(connectionQuery, context)

    expect(context.partnerListPublicationLoader).not.toHaveBeenCalled()
    expect(
      result.partner.partnerListsConnection.edges[0].node.publication
    ).toBeNull()
  })

  it("resolves publication on a PartnerList returned from a mutation payload", async () => {
    // Regression guard: a first-pass fix inverted this the wrong way around
    // (opted single-list nodes in via a flag set only in Partner.partnerList),
    // which broke every mutation that returns a PartnerList — updatePartnerList
    // among them — via the same partnerListLoader(id) call. The connection is
    // the one place this must NOT resolve; everywhere else, it should.
    const mutation = gql`
      mutation {
        updatePartnerList(input: { id: "list-abc", name: "New name" }) {
          partnerListOrError {
            ... on UpdatePartnerListSuccess {
              partnerList {
                publication {
                  slug
                }
              }
            }
          }
        }
      }
    `

    const context = {
      updatePartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "New name",
      }),
      partnerListPublicationLoader: jest.fn().mockResolvedValue({
        id: "pub-1",
        slug: "some-gallery-for-anna",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.partnerListPublicationLoader).toHaveBeenCalledWith(
      "list-abc"
    )
    expect(
      result.updatePartnerList.partnerListOrError.partnerList.publication
    ).toEqual({ slug: "some-gallery-for-anna" })
  })
})

describe("PartnerList.published / PartnerList.passcodeProtected", () => {
  it("reads inline from partner_list_publication on partnerListsConnection, with no per-node Gravity call", async () => {
    const query = gql`
      {
        partner(id: "gallery-1") {
          partnerListsConnection(first: 2) {
            edges {
              node {
                internalID
                published
                passcodeProtected
              }
            }
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListsLoader: jest.fn().mockResolvedValue({
        body: [
          {
            id: "list-published",
            partner_list_publication: {
              published: true,
              passcode_protected: false,
            },
          },
          { id: "list-unpublished", partner_list_publication: null },
        ],
        headers: { "x-total-count": "2" },
      }),
      // Batched inline on the index response — must not trigger a
      // per-node lookup the way PartnerList.publication does.
      partnerListPublicationLoader: jest
        .fn()
        .mockRejectedValue(new Error("should not be called")),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(context.partnerListPublicationLoader).not.toHaveBeenCalled()
    expect(
      result.partner.partnerListsConnection.edges.map((edge) => edge.node)
    ).toEqual([
      {
        internalID: "list-published",
        published: true,
        passcodeProtected: false,
      },
      {
        internalID: "list-unpublished",
        published: null,
        passcodeProtected: null,
      },
    ])
  })

  it("also resolves on a single partnerList lookup, from the same inline key", async () => {
    const query = gql`
      {
        partner(id: "gallery-1") {
          partnerList(id: "list-abc") {
            published
            passcodeProtected
          }
        }
      }
    `

    const context = {
      partnerLoader: jest.fn().mockResolvedValue({ id: "gallery-1" }),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        partner_list_publication: {
          published: false,
          passcode_protected: true,
        },
      }),
    }

    const result = await runAuthenticatedQuery(query, context)

    expect(result.partner.partnerList).toEqual({
      published: false,
      passcodeProtected: true,
    })
  })
})
