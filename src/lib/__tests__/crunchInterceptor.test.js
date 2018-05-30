import request from "supertest"
import { crunch } from "graphql-crunch"
import { app, invokeError } from "../../test/gql-server"
import { mockInterceptor } from "../../test/interceptor"

import crunchInterceptor, { interceptorCallback } from "../crunchInterceptor"

const fakeCrunch = intercept =>
  {return mockInterceptor(interceptorCallback, {
    intercept,
  })}

describe("crunchInterceptor", () => {
  it("should pass the result through unchanged when no param is present", () => {
    const intercept = jest.fn()
    return request(app(fakeCrunch(intercept)))
      .get("/?query={greeting}")
      .set("Accept", "application/json")
      .expect(200)
      .then(() => {
        expect(intercept).not.toHaveBeenCalled()
      })
  })

  it("should crunch the result when param is present", () => {
    return request(app(crunchInterceptor))
      .get("/?query={greeting}&crunch")
      .set("Accept", "application/json")
      .expect(200)
      .then(res => {
        expect(res.body.data).toMatchObject(crunch({ greeting: "Hello World" }))
      })
  })

  it("should not try to crunch on an error", () => {
    const intercept = jest.fn()
    return request(app(invokeError(404), fakeCrunch(intercept)))
      .get("/?query={greeting}&crunch")
      .set("Accept", "application/json")
      .expect(404)
      .then(() => {
        expect(intercept).not.toHaveBeenCalled()
      })
  })
})
