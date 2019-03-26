import { executableVortexSchema } from "lib/stitching/vortex/schema"

export const PricingContextType = executableVortexSchema().getType(
  "AnalyticsPricingContext"
)
