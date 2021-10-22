/* eslint-disable promise/always-return */
import moment from "moment"
import gql from "lib/gql"
import { runQuery } from "schema/v1/test/utils"
import trackedEntityLoaderFactory from "lib/loaders/loaders_with_authentication/tracked_entity"

describe("Show type", () => {
  let showData = null
  let context = null
  let galaxyData = null

  beforeEach(() => {
    showData = {
      id: "new-museum-1-2015-triennial-surround-audience",
      _id: "abcdefg123456",
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
      galaxyGalleriesLoader: sinon.stub().returns(Promise.resolve(galaxyData)),
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
          has_location
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        has_location: true,
      },
    })
  })

  it("include true has_location flag for shows with fair_location", async () => {
    showData.fair = "test location"
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        has_location: true,
      },
    })
  })

  it("include true has_location flag for shows with partner_city", async () => {
    showData.partner_city = "test location"
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        has_location: true,
      },
    })
  })

  it("include false has_location flag for shows without any location", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        has_location: false,
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
    try {
      await runQuery(query, context)
      throw new Error("Did not expect query to not throw an error")
    } catch (error) {
      expect(error.message).toEqual("Show Not Found")
    }
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
            id
            name
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data.show.fair.id).toEqual("the-art-show-2019")
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
          is_followed
        }
      }
    `,
        context
      )
      expect(data.show.is_followed).toBeTruthy()
    })

    it("returns false if the show is not returned", async () => {
      gravityLoader.mockReturnValue(Promise.resolve([]))
      const data = await runQuery(
        gql`
          {
            show(id: "some_other_id") {
              is_followed
            }
          }
        `,
        context
      )
      expect(data.show.is_followed).toBeFalsy()
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

  it("includes a formattable start and end date", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          id
          start_at(format: "dddd, MMMM Do YYYY, h:mm:ss a")
          end_at(format: "YYYY")
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        id: "new-museum-1-2015-triennial-surround-audience",
        start_at: "Wednesday, February 25th 2015, 12:00:00 pm",
        end_at: "2015",
      },
    })
  })

  it("includes a formatted exhibition period", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibition_period
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        exhibition_period: "February 25 – May 24, 2015",
      },
    })
  })

  it("includes an update on upcoming status changes", async () => {
    showData.end_at = moment().add(1, "d")
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          status_update
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        status_update: "Closing tomorrow",
      },
    })
  })

  it("includes the html version of markdown", async () => {
    const query = gql`
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          press_release(format: markdown)
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        press_release: "<p><strong>foo</strong> <em>bar</em></p>\n",
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
            eligible_artworks
          }
        }
      }
    `
    const data = await runQuery(query, context)
    expect(data).toEqual({
      show: {
        counts: {
          eligible_artworks: 8,
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
            artworks(artist_id: "juliana-huxtable")
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
          cover_image {
            id
          }
        }
      }
    `
    return runQuery(query, context).then(({ show }) => {
      expect(show).toEqual({
        cover_image: null,
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
            nearbyShows(first: 1) {
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
          nearbyShows: {
            edges: [
              {
                node: {
                  id: "new-museum-1-2015-triennial-surround-audience",
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
            nearbyShows {
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
          nearbyShows: {
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
            nearbyShows(first: 1) {
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
            nearbyShows(first: 1, discoverable: true) {
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
              id
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
        },
      })
    })

    it("includes a list of artists grouped by name", async () => {
      const query = gql`
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            artists_grouped_by_name {
              letter
              items {
                id
                name
              }
            }
          }
        }
      `

      const data = await runQuery(query, context)
      expect(data).toEqual({
        show: {
          artists_grouped_by_name: [
            {
              letter: "B",
              items: [
                {
                  id: "pierre-bonnard",
                  name: "Pierre Bonnard",
                },
              ],
            },
            {
              letter: "M",
              items: [
                {
                  id: "henry-moore",
                  name: "Henry Moore",
                },
              ],
            },
            {
              letter: "P",
              items: [
                {
                  id: "pablo-picasso",
                  name: "Pablo Picasso",
                },
              ],
            },
          ],
        },
      })
    })
  })

  describe("#artworks_connection", () => {
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
            artworks_connection(first: 3) {
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
          artworks_connection: {
            edges: [
              {
                node: {
                  id: "michelangelo-pistoletto-untitled-12",
                },
              },
              {
                node: {
                  id: "lucio-fontana-concetto-spaziale-attese-139",
                },
              },
              {
                node: {
                  id: "pier-paolo-calzolari-untitled-146",
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
            artworks_connection(first: 1) {
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
          artworks_connection: {
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
            artworks_connection(first: 3) {
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
          artworks_connection: {
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      })
    })
  })
  describe("#filteredArtworks", () => {
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
                  id: "1",
                  title: "foo-artwork",
                },
                {
                  id: "2",
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
            filteredArtworks(aggregations: [TOTAL]) {
              artworks_connection(first: 1) {
                edges {
                  node {
                    id
                    title
                  }
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
          filteredArtworks: {
            artworks_connection: {
              edges: [
                {
                  node: {
                    id: "1",
                    title: "foo-artwork",
                  },
                },
              ],
            },
          },
        },
      })
    })
  })
})
