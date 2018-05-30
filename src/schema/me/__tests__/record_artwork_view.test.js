import { graphql } from "graphql"
import gql from "test/gql"

import { makeExecutableSchema } from "graphql-tools"
import fs from "fs"
import path from "path"

describe("Recording artwork views", () => {
  const mutation = gql`
    mutation {
      recordArtworkView(
        input: { artwork_id: "artwork-id", clientMutationId: "2" }
      ) {
        clientMutationId
        artwork_id
      }
    }
  `

  const typeDefs = fs.readFileSync(
    path.resolve(__dirname, "../../../data/gravity.graphql"),
    "utf8"
  )

  const resolvers = {
    Mutation: {
      recordArtworkView: () => ({
        artwork_id: "artwork-id",
        clientMutationId: "2",
      }),
    },
  }

  const gravitySchema = makeExecutableSchema({ typeDefs, resolvers })

  it("records an artwork view", () =>
    graphql(gravitySchema, mutation, null, null).then(({ data }) => {
      expect(data).toEqual({
        recordArtworkView: { artwork_id: "artwork-id", clientMutationId: "2" },
      })
    }))
})
