import {
  completeness,
  compareFunnels,
  decomposeMix,
  funnelOrderIssues,
  groupByDevice,
  groupByLandingPage,
  groupBySource,
  noiseBand,
  sourceDeviceMatrix,
  standardizeToBaselineMix,
  type AnalysisFilter,
} from '@/cognitive-os/analysis/businessDiagnosisAnalysis'

/** Everything the Business Diagnosis evidence panels need, scoped to one filter. */
export function buildBusinessDiagnosisView(filter: AnalysisFilter) {
  return {
    filter,
    funnel: compareFunnels(filter),
    sources: groupBySource(filter),
    devices: groupByDevice(filter),
    landingPages: groupByLandingPage(filter),
    standardizedSource: standardizeToBaselineMix('source', filter),
    decomposition: decomposeMix('source', filter),
    matrix: sourceDeviceMatrix(filter),
    landingStandardized: standardizeToBaselineMix('landingPage', filter),
    noise: noiseBand(filter),
    completeness: completeness(),
    funnelOrderIssues: funnelOrderIssues(),
  }
}

export type BusinessDiagnosisView = ReturnType<typeof buildBusinessDiagnosisView>
