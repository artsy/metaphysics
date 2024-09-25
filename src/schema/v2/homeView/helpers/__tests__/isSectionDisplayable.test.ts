import { ResolverContext } from "types/graphql"
import { HomeViewSection } from "../../sections"
import { isSectionDisplayable } from "../isSectionDisplayable"
import { isFeatureFlagEnabled, FeatureFlag } from "lib/featureFlags"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("isSectionDisplayable", () => {
  describe("with a section that requires authentication", () => {
    it("returns true if the user is authenticated", () => {
      const section: Partial<HomeViewSection> = { requiresAuthentication: true }
      const context: Partial<ResolverContext> = { accessToken: "42" }

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(true)
    })

    it("returns false if the user is not authenticated", () => {
      const section: Partial<HomeViewSection> = { requiresAuthentication: true }
      const context: Partial<ResolverContext> = { accessToken: undefined }

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(false)
    })
  })

  describe("with a section that depends on a feature flag", () => {
    it("returns true if the feature flag is enabled", () => {
      const section: Partial<HomeViewSection> = {
        requiresAuthentication: false,
        featureFlag: "enable-home-view-section-foo" as FeatureFlag,
      }
      const context: Partial<ResolverContext> = { userID: "42" }

      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "enable-home-view-section-foo") return true
      })

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(true)
    })

    it("returns false if the feature flag is disabled", () => {
      const section: Partial<HomeViewSection> = {
        requiresAuthentication: false,
        featureFlag: "enable-home-view-section-foo" as FeatureFlag,
      }
      const context: Partial<ResolverContext> = { userID: "42" }

      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "enable-home-view-section-foo") return false
      })
      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(false)
    })
  })

  describe("with a section's own displayability check", () => {
    it("returns true if the section does NOT define a displayability check", () => {
      const section: Partial<HomeViewSection> = {
        requiresAuthentication: false,
        shouldBeDisplayed: undefined,
      }
      const context: Partial<ResolverContext> = { userID: "42" }

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(true)
    })

    it("returns true if the section's displayability check passes", () => {
      const section: Partial<HomeViewSection> = {
        requiresAuthentication: false,
        shouldBeDisplayed: () => true,
      }
      const context: Partial<ResolverContext> = { userID: "42" }

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(true)
    })

    it("returns false if the section's displayability check fails", () => {
      const section: Partial<HomeViewSection> = {
        requiresAuthentication: false,
        shouldBeDisplayed: () => false,
      }
      const context: Partial<ResolverContext> = { userID: "42" }

      expect(
        isSectionDisplayable(
          section as HomeViewSection,
          context as ResolverContext
        )
      ).toBe(false)
    })
  })
})
