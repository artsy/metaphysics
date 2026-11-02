import { SemanticVersionNumber } from "lib/semanticVersioning"

// First Eigen release that can render HomeViewSectionGroup; older clients drop it.
export const HOME_VIEW_SECTION_GROUP_MINIMUM_EIGEN_VERSION: SemanticVersionNumber = {
  major: 9,
  minor: 23,
  patch: 0,
}
