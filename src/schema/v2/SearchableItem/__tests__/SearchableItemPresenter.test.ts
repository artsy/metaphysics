/* eslint-disable promise/always-return */
import { SearchableItemPresenter } from "../SearchableItemPresenter"
import * as moment from "moment"
import { SearchItemRawResponse } from "../SearchItemRawResponse"

describe("SearchableItemPresenter", () => {
  const BASE_ITEM: SearchItemRawResponse = {
    artist_names: [""],
    description: "",
    display: "",
    end_at: "",
    fair_id: "",
    href: "",
    id: "",
    image_url: "",
    label: "",
    live_start_at: "",
    location: "",
    model: "",
    owner_type: "",
    owner_slug: "",
    profile_id: "",
    published_at: "",
    start_at: "",
    venue: "",
  }

  describe("#formattedDescription", () => {
    describe("for an Article type", () => {
      it("prepends the published at date before the provided description, joined by a separator", () => {
        const searchableItem = {
          ...BASE_ITEM,
          published_at: "2018-04-17T16:04:52.573Z",
          label: "Article",
          description:
            "Saltz had been a finalist twice before, in 2001 and 2006. The Pulitzer board commended him for “a robust body of work that conveyed a canny and often ...",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "Apr 17th, 2018 ... Saltz had been a finalist twice before, in 2001 and 2006. The Pulitzer board commended him for “a robust body of work that conveyed a canny and often ..."
        )
      })

      it("uses the description if the published at date is unavailable", () => {
        const searchableItem = {
          ...BASE_ITEM,
          published_at: "",
          label: "Article",
          description:
            "Saltz had been a finalist twice before, in 2001 and 2006. The Pulitzer board commended him for “a robust body of work that conveyed a canny and often ...",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "Saltz had been a finalist twice before, in 2001 and 2006. The Pulitzer board commended him for “a robust body of work that conveyed a canny and often ..."
        )
      })

      it("uses the published at date only if the description is unavailable", () => {
        const searchableItem = {
          ...BASE_ITEM,
          published_at: "2018-04-17T16:04:52.573Z",
          label: "Article",
          description: "",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Apr 17th, 2018")
      })

      it("returns empty string if both attributes are unavailable", () => {
        const searchableItem = {
          ...BASE_ITEM,
          published_at: "",
          label: "Article",
          description: "",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("")
      })
    })

    describe("for a City type", () => {
      it("formats a definition", () => {
        const searchableItem = {
          ...BASE_ITEM,
          display: "New York, NY",
          label: "City",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Browse current exhibitions in New York, NY")
      })
    })

    describe("for a Fair or Auction types", () => {
      const buildSearchableItem = (label) => {
        return {
          ...BASE_ITEM,
          start_at: "2018-05-16T10:00:00.000Z",
          end_at: "2018-05-30T18:30:00.000Z",
          label: label,
        }
      }

      it("formats the event period", () => {
        let presenter = new SearchableItemPresenter(buildSearchableItem("Fair"))
        let description = presenter.formattedDescription()

        expect(description).toBe(
          "Art fair running from May 16th, 2018 to May 30th, 2018"
        )

        presenter = new SearchableItemPresenter(buildSearchableItem("Auction"))
        description = presenter.formattedDescription()

        expect(description).toBe(
          "Sale running from May 16th, 2018 (at 6:00am EDT) to May 30th, 2018 (at 2:30pm EDT)"
        )
      })

      it("formats the event period if only start time is available", () => {
        let presenter = new SearchableItemPresenter({
          ...buildSearchableItem("Fair"),
          end_at: "",
        })
        let description = presenter.formattedDescription()

        expect(description).toBe("Art fair opening May 16th, 2018")

        presenter = new SearchableItemPresenter({
          ...buildSearchableItem("Auction"),
          end_at: "",
        })
        description = presenter.formattedDescription()

        expect(description).toBe("Sale opening May 16th, 2018 (at 6:00am EDT)")

        presenter = new SearchableItemPresenter({
          ...buildSearchableItem("Auction"),
          end_at: "",
          location: "New York, NY",
        })
        description = presenter.formattedDescription()

        expect(description).toBe(
          "Sale opening May 16th, 2018 (at 6:00am EDT) in New York, NY"
        )
      })

      it("prefers live_start_at to start_at date", () => {
        const presenter = new SearchableItemPresenter({
          ...buildSearchableItem("Auction"),
          live_start_at: "2018-05-30T12:00:00.000Z",
          end_at: "",
        })
        const description = presenter.formattedDescription()

        expect(description).toBe("Sale opening May 30th, 2018 (at 8:00am EDT)")
      })

      it("supports a location if provided", () => {
        const searchableItem = Object.assign(buildSearchableItem("Fair"), {
          location: "New York, NY",
        })

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()

        expect(description).toBe(
          "Art fair running from May 16th, 2018 to May 30th, 2018 in New York, NY"
        )
      })

      it("returns description if date attributes are unavailable", () => {
        ;["Fair", "Sale"].forEach((label) => {
          const presenter = new SearchableItemPresenter({
            ...BASE_ITEM,
            label: label,
            description: "Fallback description",
          })
          const description = presenter.formattedDescription()

          expect(description).toBe("Fallback description")
        })
      })
    })

    describe("for a MarketingCollection type", () => {
      it("strips html tags from the description", () => {
        const searchableItem = {
          ...BASE_ITEM,
          description:
            "<p>Brian Donnelly, better known as KAWS, spent the first year of his career as an animator for Disney.</p>",
          label: "MarketingCollection",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "Brian Donnelly, better known as KAWS, spent the first year of his career as an animator for Disney."
        )
      })
    })

    describe("for a PartnerShow type", () => {
      it("returns a formatted description for a past show", () => {
        const searchableItem = {
          ...BASE_ITEM,
          start_at: "2018-03-26T12:00:00.000Z",
          end_at: "2018-05-19T12:00:00.000Z",
          label: "PartnerShow",
          artist_names: ["KAWS"],
          venue: "Yorkshire Sculpture Park",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "Past show featuring works by KAWS at Yorkshire Sculpture Park Mar 26th – May 19th 2018"
        )
      })

      it("returns a formatted description for a current show", () => {
        const now = moment.utc()

        const searchableItem = {
          ...BASE_ITEM,
          start_at: now.toISOString(),
          end_at: now.add(1, "week").toISOString(),
          label: "PartnerShow",
          artist_names: ["KAWS"],
          venue: "Yorkshire Sculpture Park",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toMatch(
          "Current show featuring works by KAWS at Yorkshire Sculpture Park"
        )
      })

      it("returns a formatted description for a current fair booth", () => {
        const now = moment.utc()

        const searchableItem = {
          ...BASE_ITEM,
          start_at: now.toISOString(),
          end_at: now.add(1, "week").toISOString(),
          label: "PartnerShow",
          artist_names: ["KAWS"],
          venue: "Yorkshire Sculpture Park",
          fair_id: "abc123",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toMatch(
          "Current fair booth featuring works by KAWS at Yorkshire Sculpture Park"
        )
      })

      it("returns a formatted description for an upcoming show", () => {
        const now = moment.utc()

        const searchableItem = {
          ...BASE_ITEM,
          start_at: now.add(1, "day").toISOString(),
          end_at: now.add(1, "week").toISOString(),
          label: "PartnerShow",
          artist_names: ["KAWS"],
          venue: "Yorkshire Sculpture Park",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toMatch(
          "Upcoming show featuring works by KAWS at Yorkshire Sculpture Park"
        )
      })

      it("returns a formatted description with multiple artists", () => {
        let searchableItem = {
          ...BASE_ITEM,
          label: "PartnerShow",
          artist_names: ["KAWS", "Andy Warhol"],
          venue: "Yorkshire Sculpture Park",
        }

        let presenter = new SearchableItemPresenter(searchableItem)
        let description = presenter.formattedDescription()
        expect(description).toBe(
          "Show featuring works by KAWS and Andy Warhol at Yorkshire Sculpture Park"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "PartnerShow",
          artist_names: ["KAWS", "Andy Warhol", "Ridley Howard"],
          venue: "Yorkshire Sculpture Park",
        }

        presenter = new SearchableItemPresenter(searchableItem)
        description = presenter.formattedDescription()
        expect(description).toBe(
          "Show featuring works by KAWS, Andy Warhol and Ridley Howard at Yorkshire Sculpture Park"
        )
      })

      it("returns a formatted description with a location", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "PartnerShow",
          artist_names: ["KAWS"],
          location: "New York, NY",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Show featuring works by KAWS New York, NY")
      })

      it("returns a formatted description for a fair booth", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "PartnerShow",
          artist_names: ["KAWS"],
          location: "New York, NY",
          fair_id: "abc123",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "Fair booth featuring works by KAWS New York, NY"
        )
      })
    })

    describe("for a ViewingRoom type", () => {
      it("returns a formatted description for a past show", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "ViewingRoom",
          description: "A pretty neat viewing room with some sweet artworks",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(
          "A pretty neat viewing room with some sweet artworks"
        )
      })
    })
  })

  describe("#imageUrl", () => {
    it("returns an empty string if image_url references 404ing missing_url.png asset", () => {
      const searchableItem = {
        ...BASE_ITEM,
        image_url: "/assets/shared/missing_image.png",
      }

      const presenter = new SearchableItemPresenter(searchableItem)
      const imageUrl = presenter.imageUrl()
      expect(imageUrl).toBe("")
    })
  })

  describe("#href", () => {
    describe("for a Fair or FairOrganizer type", () => {
      it("returns correct href", () => {
        let searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "Fair",
          owner_slug: "fair-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/fair/fair-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "FairOrganizer",
          owner_slug: "default-fair-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/fair/default-fair-slug"
        )
      })
    })

    describe("for Partner's types", () => {
      it("returns correct href", () => {
        let searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerAuction",
          owner_slug: "partner-auction-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-auction-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerBrand",
          owner_slug: "partner-brand-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-brand-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerDemo",
          owner_slug: "partner-demo-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-demo-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerGallery",
          owner_slug: "partner-gallery-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-gallery-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerInstitution",
          owner_slug: "partner-institution-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-institution-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerInstitutionalSeller",
          owner_slug: "partner-institutional-seller-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-institutional-seller-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerPrivateCollector",
          owner_slug: "partner-private-collector-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-private-collector-slug"
        )

        searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "PartnerPrivateDealer",
          owner_slug: "partner-private-dealer-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner/partner-private-dealer-slug"
        )
      })
    })

    describe("for other Profile types", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "Profile",
          owner_type: "UnkonwnProfileType",
          id: "partner-slug",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/partner-slug"
        )
      })
    })

    describe("for a Fair", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "Fair",
          profile_id: "fair-profile-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/fair-profile-id"
        )
      })
    })

    describe("for a Sale", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "Sale",
          id: "sale-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/auction/sale-id"
        )
      })
    })

    describe("for a City", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "City",
          id: "city-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/shows/city-id"
        )
      })
    })

    describe("for a MarketingCollection", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "MarketingCollection",
          id: "collection-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/collection/collection-id"
        )
      })
    })

    describe("for a Booth", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "Booth",
          id: "show-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/show/show-id"
        )
      })
    })

    describe("for a PartnerShow", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "PartnerShow",
          id: "show-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/show/show-id"
        )
      })
    })

    describe("for an ArtistSeries", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "ArtistSeries",
          id: "artist-series-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/artist-series/artist-series-id"
        )
      })
    })

    describe("for a ViewingRoom", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "ViewingRoom",
          id: "viewing-room-id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/viewing-room/viewing-room-id"
        )
      })
    })

    describe("for other entities", () => {
      it("returns correct href", () => {
        const searchableItem = {
          ...BASE_ITEM,
          label: "SomeOtherEntityType",
          model: "model",
          id: "id",
        }

        expect(new SearchableItemPresenter(searchableItem).href()).toBe(
          "/model/id"
        )
      })
    })
  })
})
