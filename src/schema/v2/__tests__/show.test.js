/* eslint-disable promise/always-return */
import moment from "moment"
import gql from "lib/gql"
import config from "config"
import { runQuery } from "schema/v2/test/utils"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

describe("Show type", () => {
  let showData = null
  let context = null
  let galaxyData = null

  beforeEach(() => {
    showData = {
      id: "new-museum-1-2015-triennial-surround-audience",
      _id: "abcdefg123456",
      created_at: "2015-02-24T12:00:00+00:00",
      start_at: "2015-02-25T12:00:00+00:00",
      end_at: "2015-05-24T12:00:00+00:00",
      press_release: "**foo** *bar*",
      displayable: true,
      partner: {
        id: "new-museum",
      },
      display_on_partner_profile: true,
      eligible_artworks_count: 8,
      is_reference: true,
      name: " Whitespace Abounds ",
      artists: [
        {
          id: "henry-moore",
          name: "Henry Moore",
        },
        {
          id: "pierre-bonnard",
          name: "Pierre Bonnard",
        },
        {
          id: "pablo-picasso",
          name: "Pablo Picasso",
        },
      ],
      featured: true,
    }

    galaxyData = {
      id: "1",
      name: "Galaxy Partner",
      _links: "blah",
    }

    context = {
      showLoader: sinon.stub().returns(Promise.resolve(showData)),
      showsWithHeadersLoader: sinon.stub().returns(
        Promise.resolve({
          body: [showData],
          headers: {
            "x-total-count": 1,
          },
        })
      ),
      galaxyGalleryLoader: sinon.stub().returns(Promise.resolve(galaxyData)),
      partnerShowLoader: sinon.stub().returns(Promise.resolve(showData)),
      unauthenticatedLoaders: {
        showLoader: sinon.stub().returns(Promise.resolve(showData)),
      },
      authenticatedLoaders: {
        showLoader: sinon.stub().returns(Promise.resolve(showData)),
      },
    }
  })

  it("include true has_location flag for shows with location", async () => {
    showData.location = "test location"
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          hasLocation
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        hasLocation: true,
      },
    })
  })

  it("include true has_location flag for shows with fair_location", async () => {
    showData.fair = "test location"
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          hasLocation
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        hasLocation: true,
      },
    })
  })

  it("include true has_location flag for shows with partner_city", async () => {
    showData.partner_city = "test location"
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          hasLocation
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        hasLocation: true,
      },
    })
  })

  it("include false has_location flag for shows without any location", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          hasLocation
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        hasLocation: false,
      },
    })
  })

  it("doesn't return a show that’s neither displayable nor a reference show nor a stub show", async () => {
    showData.displayable = false
    showData.is_reference = false
    showData.is_local_discovery = false
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          name
        }
      }
    `
    await expect(runQuery(query, context)).rejects.toThrow("Show Not Found")
  })

  it("returns a fair booth even with displayable set to false", async () => {
    showData.fair = {
      id: "the-art-show-2019",
      name: "The Art Show 2019",
    }
    showData.displayable = false

    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          name
          fair {
            slug
            name
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data.show.fair.slug).toEqual("the-art-show-2019")
  })

  it("returns a local discovery stub show even with displayable set to false", async () => {
    showData.is_local_discovery = true
    showData.displayable = false

    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          name
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data.show.name).toEqual("Whitespace Abounds")
  })

  it("returns correct value for isFeatured field", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          isFeatured
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        isFeatured: true,
      },
    })
  })

  describe("isReverseImageSearchEnabled flag", () => {
    it("should be true when show artworks are indexed in tineye", async () => {
      context.showLoader = sinon.stub().returns(
        Promise.resolve({
          ...showData,
          reverse_image_search_enabled: true,
        })
      )

      const query = gql`
        {
          show(id: "show-with-indexed-tineye-artworks") {
            isReverseImageSearchEnabled
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        show: {
          isReverseImageSearchEnabled: true,
        },
      })
    })

    it("should be false when show artworks are NOT indexed in tineye", async () => {
      context.showLoader = sinon.stub().returns(
        Promise.resolve({
          ...showData,
          reverse_image_search_enabled: false,
        })
      )

      const query = gql`
        {
          show(id: "show-without-indexed-tineye-artworks") {
            isReverseImageSearchEnabled
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        show: {
          isReverseImageSearchEnabled: false,
        },
      })
    })
  })

  describe("is_followed", () => {
    let gravityLoader

    beforeEach(() => {
      gravityLoader = jest.fn()
      context.followedShowLoader = trackedEntityLoaderFactory(gravityLoader, {
        paramKey: "show_ids",
        trackingKey: "is_followed",
        entityKeyPath: "partner_show",
      })
    })

    it("returns true if the show is returned", async () => {
      gravityLoader.mockReturnValue(
        Promise.resolve([
          {
            partner_show: {
              id: showData._id,
            },
          },
        ])
      )
      const data = await runQuery(
        gql`
      {
        show(id: "${showData._id}") {
          isFollowed
        }
      }
    `,
        context
      )
      expect(data.show.isFollowed).toBeTruthy()
    })

    it("returns false if the show is not returned", async () => {
      gravityLoader.mockReturnValue(Promise.resolve([]))
      const data = await runQuery(
        gql`
          {
            show(id: "some_other_id") {
              isFollowed
            }
          }
        `,
        context
      )
      expect(data.show.isFollowed).toBeFalsy()
    })
  })

  describe("name", () => {
    it("strips whitespace from the name", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          name: "Whitespace Abounds",
        },
      })
    })

    it("returns null when the name is null", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `
      showData.name = null
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          name: null,
        },
      })
    })
  })

  describe("city", () => {
    it("returns the location city if one is set", async () => {
      showData.location = {
        city: "Quonochontaug",
      }
      showData.partner_city = "Something Else"
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          city: "Quonochontaug",
        },
      })
    })

    it("returns the partner_city if one is set", async () => {
      showData.partner_city = "Quonochontaug"
      showData.location = null
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          city: "Quonochontaug",
        },
      })
    })

    it("returns the fair city if one is set", async () => {
      showData.fair = {
        location: {
          city: "Quonochontaug",
        },
      }
      showData.partner_city = "Something Else"
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          city: "Quonochontaug",
        },
      })
    })
  })

  describe("kind", () => {
    it("returns fair when a fair booth", async () => {
      showData.fair = {
        id: "foo",
      }
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "fair",
        },
      })
    })

    it("returns solo when only one artist in a ref show", async () => {
      showData.artists = []
      showData.artists_without_artworks = [
        {
          id: "foo",
        },
      ]
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "solo",
        },
      })
    })

    it("returns group when more than one artist in a ref show", async () => {
      showData.artists = []
      showData.artists_without_artworks = [
        {
          id: "foo",
        },
        {
          id: "bar",
        },
      ]
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "group",
        },
      })
    })

    it("returns solo when only one artist", async () => {
      showData.artists = [
        {
          id: "foo",
        },
      ]
      showData.artists_without_artworks = null
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "solo",
        },
      })
    })

    it("returns group when more than one artist in a regular show", async () => {
      showData.artists = [
        {
          id: "foo",
        },
        {
          id: "bar",
        },
      ]
      showData.artists_without_artworks = null
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "group",
        },
      })
    })

    it("returns group when only one artist but the show is flagged as group", async () => {
      showData.artists = [
        {
          id: "foo",
        },
      ]
      showData.artists_without_artworks = null
      showData.group = true
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          kind: "group",
        },
      })
    })
  })

  describe("href", () => {
    it("returns the href for a regular show", async () => {
      showData.is_reference = false
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          href: "/show/new-museum-1-2015-triennial-surround-audience",
        },
      })
    })

    it("returns null for a reference show", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          href: null,
        },
      })
    })
  })

  it("includes the galaxy partner information when galaxy_partner_id is present", async () => {
    showData.galaxy_partner_id = "galaxy-partner"
    showData.partner = null
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          partner {
            ... on ExternalPartner {
              name
            }
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        partner: {
          name: "Galaxy Partner",
        },
      },
    })
  })

  it("doesnt crash when no partner info is present", async () => {
    showData.galaxy_partner_id = null
    showData.partner = null
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          partner {
            ... on ExternalPartner {
              name
            }
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        partner: null,
      },
    })
  })

  it("includes a formattable create, start, and end date", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          slug
          createdAt(format: "MM/DD/YYYY")
          startAt(format: "dddd, MMMM Do YYYY, h:mm:ss a")
          endAt(format: "YYYY")
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        slug: "new-museum-1-2015-triennial-surround-audience",
        createdAt: "02/24/2015",
        startAt: "Wednesday, February 25th 2015, 12:00:00 pm",
        endAt: "2015",
      },
    })
  })

  it("includes a formatted exhibition period", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibitionPeriod
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        exhibitionPeriod: "February 25 – May 24, 2015",
      },
    })
  })

  it("includes a formatted exhibition period with abbreviated months", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibitionPeriod(format: SHORT)
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        exhibitionPeriod: "Feb 25 – May 24, 2015",
      },
    })
  })

  it("includes an update on upcoming status changes", async () => {
    showData.end_at = moment().add(1, "d")
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          statusUpdate
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        statusUpdate: "Closing tomorrow",
      },
    })
  })

  it("includes the html version of markdown", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          pressRelease(format: HTML)
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        pressRelease: "<p><strong>foo</strong> <em>bar</em></p>\n",
      },
    })
  })

  it("includes the total number of artworks", async () => {
    context.partnerShowArtworksLoader = sinon.stub().returns(
      Promise.resolve({
        headers: {
          "x-total-count": 42,
        },
      })
    )
    context.partnerShowArtistsLoader = jest.fn(() =>
      Promise.resolve({
        headers: {
          "x-total-count": 21,
        },
      })
    )
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        counts: {
          artworks: 42,
        },
      },
    })
  })

  it("includes the total number of artists", async () => {
    context.partnerShowArtistsLoader = jest.fn(() =>
      Promise.resolve({
        headers: {
          "x-total-count": 21,
        },
      })
    )
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artists
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        counts: {
          artists: 21,
        },
      },
    })
  })

  it("includes the total number of eligible artworks", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            eligibleArtworks
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        counts: {
          eligibleArtworks: 8,
        },
      },
    })
  })

  it("includes the number of artworks by a specific artist", async () => {
    context.partnerShowArtworksLoader = sinon.stub().returns(
      Promise.resolve({
        headers: {
          "x-total-count": 2,
        },
      })
    )
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks(artistID: "juliana-huxtable")
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        counts: {
          artworks: 2,
        },
      },
    })
  })

  it("does not return errors when there is no cover image", () => {
    context.partnerShowArtworksLoader = sinon.stub().returns(
      Promise.resolve({
        body: [],
      })
    )
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          coverImage {
            internalID
          }
        }
      }
    `
    return runQuery(query, context).then(({ show }) => {
      expect(show).toEqual({
        coverImage: null,
      })
    })
  })

  describe("nearby shows", () => {
    it("provides a connection for nearby shows", async () => {
      showData.location = {
        coordinates: {
          lat: 0.23,
          lng: 0.34,
        },
      }
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            nearbyShowsConnection(first: 1) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          nearbyShowsConnection: {
            edges: [
              {
                node: {
                  slug: "new-museum-1-2015-triennial-surround-audience",
                },
              },
            ],
          },
        },
      })
    })

    it("provides an empty connection for a show with no location", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            nearbyShowsConnection {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          nearbyShowsConnection: {
            edges: [],
          },
        },
      })
    })

    it("requests displayable shows, by default", async () => {
      showData.location = {
        coordinates: {
          lat: 0.23,
          lng: 0.34,
        },
      }
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            nearbyShowsConnection(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.args[0][0]

      expect(gravityOptions).toMatchObject({
        displayable: true,
      })
      expect(gravityOptions).not.toHaveProperty("discoverable")
    })

    it("can request all discoverable shows, optionally", async () => {
      showData.location = {
        coordinates: {
          lat: 0.23,
          lng: 0.34,
        },
      }
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            nearbyShowsConnection(first: 1, discoverable: true) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `
      await runQuery(query, context)
      const gravityOptions = context.showsWithHeadersLoader.args[0][0]

      expect(gravityOptions).toMatchObject({
        discoverable: true,
      })
      expect(gravityOptions).not.toHaveProperty("displayable")
    })
  })

  describe("artists", () => {
    it("include a list of artists", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            artists {
              slug
              name
            }
          }
        }
      `

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          artists: [
            {
              slug: "henry-moore",
              name: "Henry Moore",
            },
            {
              slug: "pierre-bonnard",
              name: "Pierre Bonnard",
            },
            {
              slug: "pablo-picasso",
              name: "Pablo Picasso",
            },
          ],
        },
      })
    })

    it("includes a list of artists grouped by name", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            artistsGroupedByName {
              letter
              items {
                slug
                name
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          artistsGroupedByName: [
            {
              letter: "B",
              items: [
                {
                  slug: "pierre-bonnard",
                  name: "Pierre Bonnard",
                },
              ],
            },
            {
              letter: "M",
              items: [
                {
                  slug: "henry-moore",
                  name: "Henry Moore",
                },
              ],
            },
            {
              letter: "P",
              items: [
                {
                  slug: "pablo-picasso",
                  name: "Pablo Picasso",
                },
              ],
            },
          ],
        },
      })
    })
  })

  describe("#artworksConnection", () => {
    let artworksResponse

    beforeEach(() => {
      artworksResponse = [
        {
          id: "michelangelo-pistoletto-untitled-12",
        },
        {
          id: "lucio-fontana-concetto-spaziale-attese-139",
        },
        {
          id: "pier-paolo-calzolari-untitled-146",
        },
      ]
      context = {
        partnerShowArtworksLoader: () =>
          Promise.resolve({
            body: artworksResponse,
            headers: {
              "x-total-count": artworksResponse.length,
            },
          }),
        showLoader: () => Promise.resolve(showData),
        unauthenticatedLoaders: {
          showLoader: sinon.stub().returns(Promise.resolve(showData)),
        },
        authenticatedLoaders: {
          showLoader: sinon.stub().returns(Promise.resolve(showData)),
        },
      }
    })

    it("returns artworks", async () => {
      const query = `
        {
          show(id:"cardi-gallery-cardi-gallery-at-art-basel-miami-beach-2018") {
            artworksConnection(first: 3) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        show: {
          artworksConnection: {
            edges: [
              {
                node: {
                  slug: "michelangelo-pistoletto-untitled-12",
                },
              },
              {
                node: {
                  slug: "lucio-fontana-concetto-spaziale-attese-139",
                },
              },
              {
                node: {
                  slug: "pier-paolo-calzolari-untitled-146",
                },
              },
            ],
          },
        },
      })
    })

    it("returns hasNextPage=true when first is below total", async () => {
      const query = `
        {
          show(id:"cardi-gallery-cardi-gallery-at-art-basel-miami-beach-2018") {
            artworksConnection(first: 1) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        show: {
          artworksConnection: {
            pageInfo: {
              hasNextPage: true,
            },
          },
        },
      })
    })

    it("returns hasNextPage=false when first is above total", async () => {
      const query = `
        {
          show(id:"cardi-gallery-cardi-gallery-at-art-basel-miami-beach-2018") {
            artworksConnection(first: 3) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)

      expect(data).toEqual({
        show: {
          artworksConnection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })

  // FIXME: Results in an extra object... I don't full understand this test
  describe.skip("#filteredArtworks", () => {
    it("fetches FilterArtworks using the show id and partner id", async () => {
      context = {
        ...context,
        authenticatedLoaders: {
          showLoader: sinon.stub().returns(Promise.resolve(showData)),
        },
        unauthenticatedLoaders: {
          filterArtworksLoader: jest.fn().mockReturnValue(
            Promise.resolve({
              hits: [
                {
                  _id: "1",
                  title: "foo-artwork",
                },
                {
                  _id: "2",
                  title: "bar-artwork",
                },
              ],
              aggregations: {
                total: {
                  value: 303,
                },
              },
            })
          ),
          showLoader: sinon.stub().returns(Promise.resolve(showData)),
        },
      }

      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            filterArtworksConnection(aggregations: [TOTAL], first: 1) {
              edges {
                node {
                  internalID
                  title
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, context)
      expect(
        context.unauthenticatedLoaders.filterArtworksLoader
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          partner_show_id: "abcdefg123456",
          partner_id: "new-museum",
        })
      )
      expect(data).toEqual({
        show: {
          filterArtworksConnection: {
            edges: [
              {
                node: {
                  internalID: "1",
                  title: "foo-artwork",
                },
              },
            ],
          },
        },
      })
    })
  })
})
