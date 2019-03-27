/* eslint-disable promise/always-return */
import { SearchableItemPresenter } from "../SearchableItemPresenter"

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

    describe("for a Fair or Sale types", () => {
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

        presenter = new SearchableItemPresenter(buildSearchableItem("Sale"))
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
  })
})
