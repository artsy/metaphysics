import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import specialistBiosData from "data/specialistBios.json"

describe("SpecialistBios", () => {
  it("returns a list of specialist bios", async () => {
    const query = gql`
      query {
        staticContent {
          specialistBios {
            name
            firstName
            jobTitle
            bio
            email
            image {
              imageURL
            }
          }
        }
      }
    `

    const result = (await runQuery(query, {})).staticContent

    specialistBiosData.forEach((specialist, index) => {
      expect(result.specialistBios[index].name).toEqual(specialist.name)
      expect(result.specialistBios[index].email).toEqual(specialist.email)
      expect(result.specialistBios[index].jobTitle).toEqual(specialist.jobTitle)
      expect(result.specialistBios[index].bio).toEqual(specialist.bio)
      expect(result.specialistBios[index].image.imageURL).toEqual(
        specialist.imageUrl
      )
    })

    // separately test the resolver for firstName
    expect(result.specialistBios[0].firstName).toEqual("Jessica")
    expect(result.specialistBios[1].firstName).toEqual("Christine")
  })
})
