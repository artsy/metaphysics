import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("location", () => {
  it("looks a partner location up by id", async () => {
    const locationLoader = jest.fn().mockResolvedValue({
      id: "location-id",
      _id: "location-id",
      name: "Bermondsey",
      city: "London",
    })

    const { location } = await runQuery(
      gql`
        {
          location(id: "location-id") {
            internalID
            name
            city
          }
        }
      `,
      { locationLoader }
    )

    expect(locationLoader).toHaveBeenCalledWith("location-id")
    expect(location).toEqual({
      internalID: "location-id",
      name: "Bermondsey",
      city: "London",
    })
  })
})
