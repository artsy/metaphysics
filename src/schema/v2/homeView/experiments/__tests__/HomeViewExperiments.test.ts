import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"
import { getFeatureFlag, getExperimentVariant } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  getFeatureFlag: jest.fn(),
  getExperimentVariant: jest.fn(),
}))

jest.mock("schema/v2/homeView/experiments/experiments.ts", () => ({
  CURRENTLY_RUNNING_EXPERIMENTS: ["onyx_auctions_hub", "other_experiment"],
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

  describe("conditional inclusion for onyx_auctions_hub", () => {
    it("includes onyx_auctions_hub when user agent meets minimum version (8.88.0)", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/8.88.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeDefined()
      expect(onyxExperiment.name).toBe("onyx_auctions_hub")
      expect(onyxExperiment.enabled).toBe("true")
    })

    it("includes onyx_auctions_hub when user agent version is above minimum", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeDefined()
      expect(onyxExperiment.name).toBe("onyx_auctions_hub")
    })

    it("excludes onyx_auctions_hub when user agent is below minimum version (8.87.0)", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/8.87.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()
    })

    it("excludes onyx_auctions_hub when user agent is not provided", async () => {
      const context: Partial<ResolverContext> = {
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()
    })

    it("excludes onyx_auctions_hub when user agent is undefined", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: undefined,
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()
    })

    it("excludes onyx_auctions_hub when user agent has invalid format", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Mozilla/5.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()
    })

    it("includes other experiments regardless of onyx_auctions_hub eligibility", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/8.87.0", // Below minimum for onyx_auctions_hub
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      // onyx_auctions_hub should be excluded
      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()

      // other_experiment should be included
      const otherExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "other_experiment"
      )
      expect(otherExperiment).toBeDefined()
      expect(otherExperiment.name).toBe("other_experiment")
    })

    it("returns all experiments when user agent meets all eligibility requirements", async () => {
      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/8.88.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.experiments).toHaveLength(2)
      expect(homeView.experiments.map((exp: any) => exp.name)).toEqual(
        expect.arrayContaining(["onyx_auctions_hub", "other_experiment"])
      )
    })
  })

  describe("filters experiments", () => {
    it("excludes experiments that are not enabled", async () => {
      mockGetFeatureFlag.mockImplementation((flagName: string) => ({
        name: flagName,
        description: `${flagName} experiment`,
        enabled: flagName !== "onyx_auctions_hub", // Only onyx_auctions_hub is disabled
      }))

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment).toBeUndefined()

      // other_experiment should still be included
      const otherExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "other_experiment"
      )
      expect(otherExperiment).toBeDefined()
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
      mockGetExperimentVariant.mockImplementation((flagName: string) => ({
        name: flagName === "onyx_auctions_hub" ? "experiment" : "control",
      }))

      const context: Partial<ResolverContext> = {
        userAgent: "Artsy-Mobile/9.0.0",
        userID: "user123",
      }

      const { homeView } = await runQuery(query, context)

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment.variant).toBe("experiment")

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

      const onyxExperiment = homeView.experiments.find(
        (exp: any) => exp.name === "onyx_auctions_hub"
      )
      expect(onyxExperiment.variant).toBeNull()
    })
  })
})
