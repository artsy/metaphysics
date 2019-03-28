/* eslint-disable promise/always-return */
import { SearchableItemPresenter } from "../SearchableItemPresenter"
import * as moment from "moment"

describe("SearchableItemPresenter", () => {
  describe("#formattedDescription", () => {
    describe("for an Article type", () => {
      it("prepends the published at date before the provided description, joined by a separator", () => {
        const searchableItem = {
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
          published_at: null,
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
          published_at: "2018-04-17T16:04:52.573Z",
          label: "Article",
          description: null,
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Apr 17th, 2018")
      })

      it("returns null if both attributes are unavailable", () => {
        const searchableItem = {
          published_at: null,
          label: "Article",
          description: null,
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe(null)
      })
    })

    describe("for a City type", () => {
      it("formats a definition", () => {
        const searchableItem = {
          display: "New York, NY",
          label: "City",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Browse current exhibitions in New York, NY")
      })
    })

    describe("for a Fair or Auction types", () => {
      const buildSearchableItem = label => {
        return {
          start_at: "2018-05-16T11:28:00.000Z",
          end_at: "2018-05-30T18:40:09.000Z",
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
          "Sale running from May 16th, 2018 to May 30th, 2018"
        )
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
        ;["Fair", "Sale"].forEach(label => {
          const presenter = new SearchableItemPresenter({
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
          start_at: now.valueOf(),
          end_at: now.add(1, "week").valueOf(),
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

      it("returns a formatted description for an upcoming show", () => {
        const now = moment.utc()

        const searchableItem = {
          start_at: now.add(1, "day").valueOf(),
          end_at: now.add(1, "week").valueOf(),
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
          label: "PartnerShow",
          artist_names: ["KAWS"],
          location: "New York, NY",
        }

        const presenter = new SearchableItemPresenter(searchableItem)
        const description = presenter.formattedDescription()
        expect(description).toBe("Show featuring works by KAWS New York, NY")
      })
    })
  })
})
