import { runQueryOrThrow } from "schema/v2/test/utils"
import gql from "lib/gql"

const { schema } = require("schema/v2")

const runQuery = (query, context) =>
  runQueryOrThrow({
    schema,
    source: query,
    rootValue: {},
    contextValue: context,
  })

describe("FeatureFlagConstraint.partnerConnection", () => {
  let context

  const featureFlagWithConstraint = (constraint) => ({
    name: "my-flag",
    description: null,
    type: "RELEASE",
    stale: false,
    impressionData: false,
    createdAt: "2024-01-01",
    lastSeenAt: null,
    project: "default",
    variants: [],
    environments: [
      {
        name: "production",
        enabled: true,
        strategies: [
          {
            name: "flexibleRollout",
            parameters: {},
            segments: [],
            constraints: [constraint],
          },
        ],
      },
    ],
  })

  const query = gql`
    {
      admin {
        featureFlag(id: "my-flag") {
          environments {
            strategies {
              constraints {
                contextName
                partnerConnection(first: 5) {
                  totalCount
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const constraint = ({ contextName, values, ...rest }) =>
    ({
      contextName,
      values,
      operator: "IN",
      inverted: false,
      caseInsensitive: false,
      ...rest,
    } as any)

  beforeEach(() => {
    context = {
      partnersLoader: (options) =>
        Promise.resolve({
          body: options.id.map((id) => ({ id, name: `Partner ${id}` })),
          headers: {
            "x-total-count": String(options.id.length),
          },
        }),
    }
  })

  it("resolves partners referenced by a partnerId constraint", async () => {
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(
        featureFlagWithConstraint(
          constraint({
            contextName: "partnerId",
            values: ["partner-one", "partner-two"],
          })
        )
      )

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].constraints[0]
    ).toEqual({
      contextName: "partnerId",
      partnerConnection: {
        totalCount: 2,
        edges: [
          { node: { name: "Partner partner-one" } },
          { node: { name: "Partner partner-two" } },
        ],
      },
    })
  })

  it("returns null when contextName is not partnerId", async () => {
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(
        featureFlagWithConstraint(
          constraint({ contextName: "userId", values: ["user-one"] })
        )
      )

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].constraints[0]
    ).toEqual({
      contextName: "userId",
      partnerConnection: null,
    })
  })

  it("returns null when there are no values", async () => {
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(
        featureFlagWithConstraint(
          constraint({ contextName: "partnerId", values: [] })
        )
      )

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].constraints[0]
    ).toEqual({
      contextName: "partnerId",
      partnerConnection: null,
    })
  })
})

describe("FeatureFlagStrategy.segments", () => {
  let context

  const featureFlagWithSegments = (segmentIDs) => ({
    name: "my-flag",
    description: null,
    type: "RELEASE",
    stale: false,
    impressionData: false,
    createdAt: "2024-01-01",
    lastSeenAt: null,
    project: "default",
    variants: [],
    environments: [
      {
        name: "production",
        enabled: true,
        strategies: [
          {
            name: "flexibleRollout",
            parameters: {},
            segments: segmentIDs,
            constraints: [],
          },
        ],
      },
    ],
  })

  const query = gql`
    {
      admin {
        featureFlag(id: "my-flag") {
          environments {
            strategies {
              segments {
                internalID
                name
              }
            }
          }
        }
      }
    }
  `

  beforeEach(() => {
    context = {
      adminSegmentsLoader: () =>
        Promise.resolve({
          segments: [
            { id: 1, name: "Segment One", description: null, constraints: [] },
            { id: 2, name: "Segment Two", description: null, constraints: [] },
          ],
        }),
    }
  })

  it("returns only the segments referenced by the strategy's segment ids", async () => {
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(featureFlagWithSegments([2]))

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].segments
    ).toEqual([{ internalID: 2, name: "Segment Two" }])
  })

  it("returns an empty list when the strategy has no segment ids", async () => {
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(featureFlagWithSegments([]))

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].segments
    ).toEqual([])
  })

  it("returns an empty list when adminSegmentsLoader is unavailable", async () => {
    delete context.adminSegmentsLoader
    context.adminFeatureFlagLoader = () =>
      Promise.resolve(featureFlagWithSegments([1]))

    const data = await runQuery(query, context)

    expect(
      data.admin.featureFlag.environments[0].strategies[0].segments
    ).toEqual([])
  })
})
