/**
 *
 * @param demandRank
 * @returns the demand rank in a textual form
 * @example getDemandRankDisplayText(0.2) => "Less Active Demand"
 * @example getDemandRankDisplayText(0.6) => "Active Demand"
 */
export function getDemandRankDisplayText(demandRank: number): string {
  const rank = Number(demandRank * 10)

  if (rank >= 9) {
    return "High Demand"
  } else if (rank >= 7) {
    return "Active Demand"
  } else if (rank >= 4) {
    return "Moderate Demand"
  }

  return "Less Active Demand"
}
