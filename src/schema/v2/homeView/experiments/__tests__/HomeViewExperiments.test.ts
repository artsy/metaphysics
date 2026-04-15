import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { getFeatureFlag, getExperimentVariant } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  getFeatureFlag: jest.fn(),
  getExperimentVariant: jest.fn(),
}))

jest.mock("schema/v2/homeView/experiments/experiments.ts", () => ({
  CURRENTLY_RUNNING_EXPERIMENTS: ["other_experiment"],
}))

const mockGetFeatureFlag = getFeatureFlag as jest.Mock
const mockGetExperimentVariant = getExperimentVariant as jest.Mock

describe("HomeViewExperiments", () => {
  const query = gql`
    {
      homeView {
        experiments {
          name
          description
          enabled
          variant
        }
      }
    }
  `

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetFeatureFlag.mockImplementation((flagName: string) => ({
      name: flagName,
      description: `${flagName} experiment`,
      enabled: true,
    }))

    mockGetExperimentVariant.mockImplementation(() => ({
      name: "experiment",
    }))
  })

  describe("filters experiments", () => {
    it("excludes experiments that are not enabled", async () => {
      mockGetFeatureFlag.mockImplementation((flagName: string) => ({
        name: flagName,
        description: `${flagName} experiment`,
        enabled: false,
      }))

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const otherExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "other_experiment"
      )
      expect(otherExperiment).toBeUndefined()
    })

    it("returns null when feature flag returns undefined", async () => {
      mockGetFeatureFlag.mockImplementation(() => undefined)

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.experiments).toEqual([])
    })
  })

  describe("variant assignment", () => {
    it("includes variant information when available", async () => {
      mockGetExperimentVariant.mockImplementation(() => ({
        name: "control",
      }))

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const otherExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "other_experiment"
      )
      expect(otherExperiment.variant).toBe("control")
    })

    it("returns null variant when getExperimentVariant returns undefined", async () => {
      mockGetExperimentVariant.mockImplementation(() => undefined)

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const otherExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "other_experiment"
      )
      expect(otherExperiment.variant).toBeNull()
    })
  })
})
