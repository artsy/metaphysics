import express from "express"
import graphqlHTTP from "express-graphql"
import request from "supertest"
import bodyParser from "body-parser"
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools"
import { crunch } from "graphql-crunch"

import crunchInterceptor from "../crunchInterceptor"

describe("crunchInterceptor", () => {
  let app

  beforeEach(() => {
    const schema = makeExecutableSchema({
      typeDefs: `
        type Query {
          greeting: String
        }
      `,
    })
    addMockFunctionsToSchema({ schema })
    app = express()
    app.use(
      "/",
      bodyParser.json(),
      crunchInterceptor,
      graphqlHTTP({
        schema,
        graphiql: false,
      })
    )
  })

  it("should pass the result through unchanged when no param is present", () => {
    return request(app)
      .get("/?query={greeting}")
      .set("Accept", "application/json")
      .expect(res => {
        expect(res.body.data).toMatchObject({ greeting: "Hello World" })
      })
  })

  it("should crunch the result when param is present", () => {
    return request(app)
      .get("/?query={greeting}&crunch")
      .set("Accept", "application/json")
      .expect(res => {
        expect(res.body.data).toMatchObject(crunch({ greeting: "Hello World" }))
      })
  })
})
