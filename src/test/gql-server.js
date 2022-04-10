import { ApolloServer } from "apollo-server-express"
import express from "express"
import bodyParser from "body-parser"
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools"

export const invokeError = (status) => (req, res, next) => {
  const err = new Error()
  err.status = status
  next(err)
}

const exampleSchema = `
  type Query {
    greeting: String
  }`

export const gqlServer = ({
  schema = exampleSchema,
  mocks = {},
  middleware = [],
}) => {
  const app = express()
  const execSchema = makeExecutableSchema({
    typeDefs: schema,
  })
  addMockFunctionsToSchema({ schema: execSchema, mocks })
  app.use("/", bodyParser.json(), ...middleware)

  const server = new ApolloServer({
    schema: execSchema,
    playground: false,
  })
  server.applyMiddleware({ app, path: "/" })
  return app
}

export const app = (...middleware) => gqlServer({ middleware })
