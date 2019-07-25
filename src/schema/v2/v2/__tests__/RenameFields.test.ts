import { RenameFields } from "../RenameFields"
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInterfaceType,
} from "graphql"
import { runQueryOrThrow } from "schema/v2/test/utils"
import gql from "lib/gql"
import { transformSchema } from "graphql-tools"

const originalSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      someRootField: {
        type: new GraphQLObjectType({
          name: "SomeType",
          fields: {
            id: {
              type: GraphQLID,
            },
          },
          interfaces: [
            new GraphQLInterfaceType({
              name: "SomeInterface",
              fields: {
                id: {
                  type: GraphQLID,
                },
              },
            }),
          ],
        }),
      },
      someOtherRootField: {
        type: new GraphQLObjectType({
          name: "SomeOtherType",
          fields: {
            id: {
              type: GraphQLID,
            },
          },
        }),
      },
    },
  }),
})

const schema = transformSchema(originalSchema, [
  new RenameFields((type, field) => {
    if (field.name === "id") {
      if (type.name === "SomeType" || type.name === "SomeInterface") {
        return "someID"
      } else if (type.name === "SomeOtherType") {
        return "someOtherID"
      }
    }
    return undefined
  }),
])

describe(RenameFields, () => {
  it("renames fields on object types", async () => {
    const data = await runQueryOrThrow({
      schema,
      source: gql`
        query {
          someRootField {
            someID
          }
          someOtherRootField {
            someOtherID
          }
        }
      `,
      rootValue: {
        someRootField: {
          id: "some-id",
        },
        someOtherRootField: {
          id: "some-other-id",
        },
      },
    })
    expect(data).toEqual({
      someRootField: {
        someID: "some-id",
      },
      someOtherRootField: {
        someOtherID: "some-other-id",
      },
    })
  })

  it("renames fields on interface types", async () => {
    const data = await runQueryOrThrow({
      schema,
      source: gql`
        query {
          someRootField {
            ... on SomeInterface {
              someID
            }
          }
        }
      `,
      rootValue: {
        someRootField: {
          id: "some-id",
        },
      },
    })
    expect(data.someRootField.someID).toEqual("some-id")
  })

  // TODO: https://artsyproduct.atlassian.net/browse/PLATFORM-1442
  xit("handles aliasing", async () => {
    const data = await runQueryOrThrow({
      schema,
      source: gql`
        query {
          someRootField {
            id: someID
          }
          someOtherRootField {
            entirelyDifferentID: someOtherID
          }
        }
      `,
      rootValue: {
        someRootField: {
          id: "some-id",
        },
        someOtherRootField: {
          id: "some-other-id",
        },
      },
    })
    expect(data).toEqual({
      someRootField: {
        id: "some-id",
      },
      someOtherRootField: {
        entirelyDifferentID: "some-other-id",
      },
    })
  })
})
