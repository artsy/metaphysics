import moment from "moment"
import { runQuery } from "test/utils"

describe("Show type", () => {
  let showData = null
  let rootValue = null
  let galaxyData = null

  beforeEach(() => {
    showData = {
      id: "new-museum-1-2015-triennial-surround-audience",
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
    }

    galaxyData = {
      id: "1",
      name: "Galaxy Partner",
      _links: "blah",
    }

    rootValue = {
      showLoader: sinon.stub().returns(Promise.resolve(showData)),
      galaxyGalleriesLoader: sinon.stub().returns(Promise.resolve(galaxyData)),
      partnerShowLoader: sinon.stub().returns(Promise.resolve(showData)),
    }
  })

  it("include true has_location flag for shows with location", () => {
    showData.location = "test location"
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          has_location: true,
        },
      })
    })
  })
  it("include true has_location flag for shows with fair_location", () => {
    showData.fair = "test location"
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          has_location: true,
        },
      })
    })
  })
  it("include true has_location flag for shows with partner_city", () => {
    showData.partner_city = "test location"
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          has_location: true,
        },
      })
    })
  })
  it("include false has_location flag for shows without any location", () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          has_location
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          has_location: false,
        },
      })
    })
  })
  it("doesn't return a show that’s neither displayable nor a reference", () => {
    showData.displayable = false
    showData.is_reference = false
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          name
        }
      }
    `
    return runQuery(query, rootValue)
      .then(() => {
        throw new Error("Did not expect query to not throw an error")
      })
      .catch(error => {
        expect(error.statusCode).toEqual(404)
      })
  })

  describe("name", () => {
    it("strips whitespace from the name", () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            name: "Whitespace Abounds",
          },
        })
      })
    })

    it("returns null when the name is null", () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `
      showData.name = null
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            name: null,
          },
        })
      })
    })
  })

  describe("city", () => {
    it("returns the location city if one is set", () => {
      showData.location = { city: "Quonochontaug" }
      showData.partner_city = "Something Else"
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            city: "Quonochontaug",
          },
        })
      })
    })
    it("returns the partner_city if one is set", () => {
      showData.partner_city = "Quonochontaug"
      showData.location = null
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            city: "Quonochontaug",
          },
        })
      })
    })
  })

  describe("kind", () => {
    it("returns fair when a fair booth", () => {
      showData.fair = { id: "foo" }
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "fair",
          },
        })
      })
    })
    it("returns solo when only one artist in a ref show", () => {
      showData.artists = []
      showData.artists_without_artworks = [{ id: "foo" }]
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "solo",
          },
        })
      })
    })
    it("returns group when more than one artist in a ref show", () => {
      showData.artists = []
      showData.artists_without_artworks = [{ id: "foo" }, { id: "bar" }]
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "group",
          },
        })
      })
    })
    it("returns solo when only one artist", () => {
      showData.artists = [{ id: "foo" }]
      showData.artists_without_artworks = null
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "solo",
          },
        })
      })
    })
    it("returns group when more than one artist in a regular show", () => {
      showData.artists = [{ id: "foo" }, { id: "bar" }]
      showData.artists_without_artworks = null
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "group",
          },
        })
      })
    })
    it("returns group when only one artist but the show is flagged as group", () => {
      showData.artists = [{ id: "foo" }]
      showData.artists_without_artworks = null
      showData.group = true
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            kind: "group",
          },
        })
      })
    })
  })

  describe("href", () => {
    it("returns the href for a regular show", () => {
      showData.is_reference = false
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            href: "/show/new-museum-1-2015-triennial-surround-audience",
          },
        })
      })
    })
    it("returns null for a reference show", () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          show: {
            href: null,
          },
        })
      })
    })
  })

  it("includes the galaxy partner information when galaxy_partner_id is present", () => {
    showData.galaxy_partner_id = "galaxy-partner"
    showData.partner = null
    const query = `
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
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          partner: {
            name: "Galaxy Partner",
          },
        },
      })
    })
  })

  it("doesnt crash when no partner info is present", () => {
    showData.galaxy_partner_id = null
    showData.partner = null
    const query = `
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
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          partner: null,
        },
      })
    })
  })

  it("includes a formattable start and end date", () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          id
          start_at(format: "dddd, MMMM Do YYYY, h:mm:ss a")
          end_at(format: "YYYY")
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          id: "new-museum-1-2015-triennial-surround-audience",
          start_at: "Wednesday, February 25th 2015, 12:00:00 pm",
          end_at: "2015",
        },
      })
    })
  })

  it("includes a formatted exhibition period", () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibition_period
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          exhibition_period: "Feb 25 – May 24, 2015",
        },
      })
    })
  })
  it("includes an update on upcoming status changes", () => {
    showData.end_at = moment().add(1, "d")
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          status_update
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          status_update: "Closing tomorrow",
        },
      })
    })
  })
  it("includes the html version of markdown", () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          press_release(format: markdown)
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          press_release: "<p><strong>foo</strong> <em>bar</em></p>\n",
        },
      })
    })
  })
  it("includes the total number of artworks", () => {
    rootValue.partnerShowArtworksLoader = sinon
      .stub()
      .returns(Promise.resolve({ headers: { "x-total-count": 42 } }))
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks
          }
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          counts: {
            artworks: 42,
          },
        },
      })
    })
  })
  it("includes the total number of eligible artworks", () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            eligible_artworks
          }
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          counts: {
            eligible_artworks: 8,
          },
        },
      })
    })
  })
  it("includes the number of artworks by a specific artist", () => {
    rootValue.partnerShowArtworksLoader = sinon
      .stub()
      .returns(Promise.resolve({ headers: { "x-total-count": 2 } }))
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks(artist_id: "juliana-huxtable")
          }
        }
      }
    `
    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        show: {
          counts: {
            artworks: 2,
          },
        },
      })
    })
  })
  it("does not return errors when there is no cover image", () => {
    rootValue.partnerShowArtworksLoader = sinon
      .stub()
      .returns(Promise.resolve([]))
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          cover_image {
            id
          }
        }
      }
    `
    return runQuery(query, rootValue).then(({ show }) => {
      expect(show).toEqual({
        cover_image: null,
      })
    })
  })
})
