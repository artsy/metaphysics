import {
  graphqlTimeoutMiddleware,
  fieldFromResolveInfo,
  timeoutForField,
} from "../graphqlTimeoutMiddleware"

import { makeExecutableSchema, IResolvers } from "graphql-tools"
import gql from "../../lib/gql"
import { graphql, buildSchema, GraphQLResolveInfo } from "graphql"
import { applyMiddleware } from "graphql-middleware"

/**
 * Combined with async/await, this function can be used to simply add a delay
 * between multiple expressions.
 */
function delay(by: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, by))
}

describe("graphQLTimeoutMiddleware", () => {
  const defaultTimeout = 5
  const artworkTimeout = defaultTimeout + 1

  const typeDefs = gql`
    directive @timeout(
      ms: Int!
    ) on FIELD_DEFINITION

    schema {
      query: Query
    }

    type Query {
      artwork: Artwork @timeout(ms: ${artworkTimeout})
    }

    type Artwork {
      artists: [Artist]
      title: String
    }

    type Artist {
      name: String
    }
  `

  describe("fieldFromResolveInfo", () => {
    it("returns the field definition for the field resolver", () => {
      const schema = buildSchema(typeDefs)
      const resolveInfo = {
        fieldName: "artwork",
        parentType: schema.getQueryType(),
      } as GraphQLResolveInfo

      const artworkField = schema.getQueryType()!.getFields().artwork
      expect(fieldFromResolveInfo(resolveInfo)).toBe(artworkField)
    })
  })

  describe("timeoutForField", () => {
    function timeoutField(timeout: Record<string, unknown> | null) {
      const args =
        timeout &&
        Object.keys(timeout)
          .map((key) => `${key}: ${timeout[key]}`)
          .join(", ")
      const directive = (timeout && `@timeout${args ? `(${args})` : ""}`) || ""
      const schema = buildSchema(gql`
        schema {
          query: Query
        }
        type Query {
          field: String ${directive}
        }
      `)
      return schema.getQueryType()!.getFields().field
    }

    it("returns null if there was no timeout specified", () => {
      expect(timeoutForField(timeoutField(null))).toEqual(null)
    })

    it.skip("returns the specified timeout", () => {
      expect(timeoutForField(timeoutField({ ms: 42 }))).toEqual(42)
    })

    it.skip("throws an error if the directive is specified but no ms argument is given", () => {
      expect(() => timeoutForField(timeoutField({ sec: 42 }))).toThrowError(
        /argument is required/
      )
    })

    it.skip("throws an error if the directive is specified but no integer argument is given", () => {
      expect(() => timeoutForField(timeoutField({ ms: `"42"` }))).toThrowError(
        /Expected.+IntValue.+got.+StringValue/
      )
    })
  })

  describe("execution", () => {
    let resolvers: IResolvers

    const responseData = {
      title: "An artwork",
      artists: [{ name: "An artist" }, { name: "Another artist" }],
    }

    function query() {
      const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
      })
      applyMiddleware(schema, graphqlTimeoutMiddleware(defaultTimeout))
      return graphql(
        schema,
        gql`
          query {
            artwork {
              title
              artists {
                name
              }
            }
          }
        `
      )
    }

    it("resolves if execution does not take longer than the set timeout", async () => {
      resolvers = {
        Query: {
          artwork: () => responseData,
        },
      }
      expect(await query()).toEqual({
        data: {
          artwork: responseData,
        },
      })
    })

    it("rejects if execution of the resolver failed", async () => {
      resolvers = {
        Query: {
          artwork: () => Promise.reject(new Error("oh noes")),
        },
      }
      const response = await query()
      expect(response.errors![0].message).toEqual("oh noes")
    })

    it("returns `null` if execution of resolver with specific timeout takes longer than the set timeout", async () => {
      resolvers = {
        Query: {
          // Time out by going over the artworkTimeout
          artwork: async () => {
            await delay(artworkTimeout + 2)
            return responseData
          },
        },
      }
      const response = await query()
      expect(response.data).toEqual({ artwork: null })
      expect(response.errors!.length).toEqual(1)
      expect(response.errors![0].message).toMatch(
        /Query\.artwork has timed out after waiting for \d+ms/
      )
    })

    it("returns `null` if execution of resolvers takes longer than their timeout", async () => {
      resolvers = {
        Query: {
          artwork: () => ({}),
        },
        Artwork: {
          title: () => responseData.title,
          artists: () => [{}, {}],
        },
        Artist: {
          name: async () => {
            await delay(defaultTimeout + 10)
            return "Some artist"
          },
        },
      }
      const response = await query()
      expect(response.data).toEqual({
        artwork: {
          title: responseData.title,
          artists: [{ name: null }, { name: null }],
        },
      })
      expect(response.errors!.length).toEqual(2)
      expect(response.errors![0].message).toMatch(
        /Artist\.name has timed out after waiting for \d+ms/
      )
    })

    it("will not invoke nested resolvers once a resolver timeout has passed", async () => {
      const nestedResolver = jest.fn()
      resolvers = {
        Query: {
          // Time out by going over the artworkTimeout
          artwork: async () => {
            await delay(artworkTimeout + 2)
            return responseData
          },
        },
        Artist: {
          // This resolver should not be called once the above has timed out
          name: nestedResolver,
        },
      }
      await query()
      await delay(artworkTimeout + 4)
      expect(nestedResolver).not.toBeCalled()
    })

    describe("concerning clearing timeouts", () => {
      beforeAll(() => {
        jest.useFakeTimers()
        jest.spyOn(global, "clearTimeout")
      })

      afterAll(() => {
        jest.useRealTimers()
      })

      it("clears the timeout when a resolver succeeds", async () => {
        resolvers = {
          Query: {
            artwork: () => responseData,
          },
        }
        await query()
        expect(clearTimeout).toBeCalled()
      })

      it("clears the timeout when a resolver fails", async () => {
        resolvers = {
          Query: {
            artwork: () => Promise.reject(new Error("oh noes")),
          },
        }
        await query()
        expect(clearTimeout).toBeCalled()
      })
    })
  })
})
