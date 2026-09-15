// Force the full schema to resolve first: importing the mutation response
// file directly hits a circular require (show.ts -> artist -> article ->
// artwork/collectorSignals -> show.ts) that only resolves cleanly once the
// whole schema has loaded once, as query tests do via `schema/v2/test/utils`.
import "schema/v2"
import { createLoadersWithAuthentication } from "lib/loaders/loaders_with_authentication"
import {
  CityGuideEventMutationFailureType,
  CityGuideEventMutationResponseOrErrorType,
  CityGuideEventMutationSuccessType,
} from "../mutations/cityGuideEventMutationResponseOrError"

describe("CityGuideEventMutationResponseOrError", () => {
  it("is a union of the success and failure members", () => {
    expect(
      CityGuideEventMutationResponseOrErrorType.getTypes().map((t) => t.name)
    ).toEqual([
      "CityGuideEventMutationSuccess",
      "CityGuideEventMutationFailure",
    ])
  })

  it("exposes the event on success and the Gravity error on failure", () => {
    expect(
      CityGuideEventMutationSuccessType.getFields().cityGuideEvent.type.toString()
    ).toEqual("CityGuideEvent")
    expect(
      CityGuideEventMutationFailureType.getFields().mutationError.type.toString()
    ).toEqual("GravityMutationError")
  })
})

describe("city guide event write loaders", () => {
  it("are all present on the authenticated loader set", () => {
    const loaders = createLoadersWithAuthentication("secret", "user-42", {})

    expect(loaders).toEqual(
      expect.objectContaining({
        createCityGuideEventLoader: expect.any(Function),
        updateCityGuideEventLoader: expect.any(Function),
        deleteCityGuideEventLoader: expect.any(Function),
        publishCityGuideEventLoader: expect.any(Function),
        unpublishCityGuideEventLoader: expect.any(Function),
        createCityGuideEventItineraryLoader: expect.any(Function),
        updateCityGuideEventItineraryLoader: expect.any(Function),
        deleteCityGuideEventItineraryLoader: expect.any(Function),
      })
    )
  })
})
