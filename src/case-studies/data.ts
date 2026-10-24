import type { ProjectCaseStudy } from '@/case-studies/types'

export const caseStudies: ProjectCaseStudy[] = [
  {
    slug: 'jaheeratech',
    title: 'JaheeraTech',
    status: 'in-development',
    statusNote:
      'Frontend reported live. Backend functionality and additional ad-platform integrations are in development.',
    verification: {
      level: 'owner-reported',
      note: 'Product status was provided by the project owner. The frontend and any source repository were not independently inspectable during this audit, so backend behaviour is not verified here.',
    },
    atAGlance: [
      { label: 'Product', value: 'AI advertising intelligence workspace' },
      { label: 'Frontend', value: 'Reported live at jaheeratech.com' },
      { label: 'Backend', value: 'In development' },
      { label: 'Connectors', value: 'Meta Ads reported available; Google Ads, GA4, LinkedIn Ads, TikTok in development' },
      { label: 'Workflow', value: 'Signal → Evidence → Explanation → Proposed Action → Approval' },
      { label: 'Principle', value: 'Separate observed facts from hypotheses; gate consequential actions behind approval' },
    ],
    overview: [
      'JaheeraTech is an advertising intelligence workspace intended to help advertising teams move from a change in campaign metrics to a decision they can justify. Rather than presenting a single automated answer, the product is designed around an evidence trail.',
      'The frontend is reported live. The backend and the connectors beyond Meta Ads are still being built. Everything on this page is therefore limited to owner-reported product status; it is not an evaluation of running backend behaviour.',
    ],
    problem: [
      'Advertising dashboards show that a metric moved, but they rarely make clear why it moved, which explanation is supported, or how confident anyone should be. Teams then either act on a guess or stall.',
      'A second risk is automation without accountability: a model proposes an action, and the action is executed as if the proposal were a fact.',
    ],
    intendedOutcome: [
      'A workspace where a campaign signal becomes inspectable evidence, a ranked explanation, and a proposed action that a human reviews before anything consequential happens.',
    ],
    constraints: [
      'The backend is unfinished, so no end-to-end processing can be verified.',
      'No source repository was supplied for this audit.',
      'Ad-platform APIs impose permissions, rate limits, and data-model differences across providers.',
      'Synthetic and partial data must not be presented as live client outcomes.',
    ],
    assumptions: [
      'Product status and connector availability are taken as reported by the owner.',
      'The approval-gated workflow is a design principle, not a verified runtime guarantee.',
    ],
    architecture: [
      { step: 'Signal', detail: 'Campaign metrics such as spend, conversions, CPA, and ROAS arrive from ad-platform connectors.' },
      { step: 'Evidence', detail: 'Relevant observations are assembled and separated from interpretation.' },
      { step: 'Explanation', detail: 'Candidate explanations are compared against the evidence.' },
      { step: 'Proposed action', detail: 'A suggested next step is produced with its supporting and missing evidence.' },
      { step: 'Approval', detail: 'A human reviews and approves before any consequential change is made.' },
    ],
    implementation: {
      implemented: ['Marketing frontend reported live at jaheeratech.com', 'Meta Ads connector reported available'],
      inDevelopment: [
        'Backend services',
        'Google Ads, GA4, LinkedIn Ads, and TikTok integrations',
        'The evidence-to-explanation-to-approval pipeline as an end-to-end system',
      ],
      planned: [],
    },
    demonstration: {
      description: 'Live marketing frontend (owner-reported). This is not a verified product demo.',
      href: 'https://jaheeratech.com/',
      isHosted: true,
    },
    evaluation: {
      methodology: [
        'No public evaluation methodology was available for audit. Because the backend is in development and no evaluation design could be inspected, no performance metrics are published.',
      ],
      metricGroups: [],
      caveats: [
        'No independently verified metrics. Any future figures should state the dataset, the period, and the metric definitions before publication.',
      ],
    },
    results: [
      'No results are published. The product is in development and its status is owner-reported, so there are no verified outcomes to report.',
    ],
    limitations: [
      'Backend behaviour could not be verified.',
      'No source repository was available to inspect.',
      'Connectors other than Meta Ads are reported as in development.',
      'The described workflow is an intended design, not a demonstrated runtime guarantee.',
    ],
    failureModes: [
      'Presenting a hypothesis as an observed fact.',
      'Executing a recommendation without the intended approval step.',
      'Acting on stale or partial connector data.',
      'Overstating connector coverage before integrations are finished.',
    ],
    nextImprovements: [
      'Publish the backend architecture and a source repository when available.',
      'Document exactly which connectors are live and their known limitations.',
      'Add evaluation for the analysis pipeline once the backend can be exercised end to end.',
    ],
    links: [{ label: 'Live frontend', href: 'https://jaheeratech.com/', kind: 'demo' }],
  },
  {
    slug: 'attention-os',
    title: 'Attention-OS',
    status: 'live-demo',
    statusNote:
      'Independent project on synthetic behavioural data. Metrics are verified from the repository evaluation log; synthetic data and a small held-out test set limit interpretation.',
    verification: {
      level: 'verified-from-source',
      note: 'Method and metrics were checked against the repository README, the detailed evaluation log, and the split and training code. The repository contains one stale sentence that conflicts with the code-backed method; the code and evaluation log are treated as authoritative.',
    },
    atAGlance: [
      { label: 'Type', value: 'Independent project, not a client engagement' },
      { label: 'Data', value: 'Synthetic (seed 42): ~500 users, ~235,481 events, 90 days' },
      { label: 'Design', value: 'Shared prediction time T0; features before T0, labels from the following 7 days' },
      { label: 'Selection', value: 'Model chosen on validation ROC-AUC; held-out test reserved for reporting' },
      { label: 'Held-out test', value: '15% of users (75 users); 13 monetization positives' },
      { label: 'Stack', value: 'scikit-learn, XGBoost, rules-based decision engine, FastAPI' },
    ],
    overview: [
      'Attention-OS is an independent predictive decision system built on synthetic behavioural data. It covers retention and monetization prediction, a rules-based decision engine with guardrails, an experiment-analysis framework, and a FastAPI service.',
      'The evaluation is designed so that model selection and final reporting use different data: models are chosen on a validation split, and the held-out test set is used only to report the selected models.',
    ],
    problem: [
      'A prediction is not a decision. Knowing which users are likely to churn does not say what to do, how much confidence to place in the score, or which action is worth taking.',
      'There is also a methodological trap: if models are selected on the same data used to report results, the reported numbers are optimistic.',
    ],
    intendedOutcome: [
      'A pipeline that separates model selection from reporting and converts predictions into governed next actions that a business can review.',
    ],
    constraints: [
      'All data are synthetic; there is no real user population behind the numbers.',
      'The held-out test set is small, so metric estimates carry substantial uncertainty.',
      'Behaviour is learned from generated events, not from production telemetry.',
    ],
    assumptions: [
      'A single shared prediction time T0 is used, with features from before T0 and labels from the following 7-day window.',
      'Feature engineering is leakage-aware so that post-T0 information does not enter the features.',
      'Reproducibility relies on a fixed random seed (42).',
    ],
    architecture: [
      { step: 'Events', detail: 'Synthetic user events are generated across a 90-day period.' },
      { step: 'Features', detail: 'Leakage-aware features are computed from data strictly before T0.' },
      { step: 'Split', detail: 'A user-level stratified outer split of 85% training pool and 15% held-out test, with an inner fit/validation split.' },
      { step: 'Models', detail: 'Logistic Regression, Random Forest, and XGBoost are trained for retention and monetization targets.' },
      { step: 'Selection', detail: 'Models are selected on validation ROC-AUC; test metrics are computed only after selection.' },
      { step: 'Decision engine', detail: 'A deterministic rules-based engine with guardrails turns scores and business context into next actions.' },
      { step: 'Service', detail: 'A FastAPI service exposes scoring and decisioning.' },
    ],
    implementation: {
      implemented: [
        'Leakage-aware feature engineering pipeline',
        'User-level stratified train/validation/test splitting',
        'Logistic Regression, Random Forest, and XGBoost models',
        'Rules-based decision engine with guardrails',
        'FastAPI service',
        'Experiment-analysis framework',
      ],
      inDevelopment: [],
      planned: [],
    },
    demonstration: {
      description: 'Hosted demo of the predictive decision system.',
      href: 'https://tejas-parjane.github.io/attention-os/',
      isHosted: true,
    },
    evaluation: {
      methodology: [
        'Users are split with a stratified 85/15 outer split; an inner split supports model fitting and validation.',
        'Models are selected on validation ROC-AUC. The held-out test set is used only to report the selected models, not to choose them.',
        'ROC-AUC measures ranking discrimination. It does not, on its own, establish calibration or business value, so Brier score, precision, recall, and PR-AUC are reported alongside it.',
      ],
      metricGroups: [
        {
          name: 'Retention — Logistic Regression (held-out test)',
          note: 'Reported after selection on validation ROC-AUC.',
          metrics: [
            { label: 'ROC-AUC', value: '0.88', definition: 'Probability that a random positive is ranked above a random negative.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
            { label: 'PR-AUC', value: '0.86', definition: 'Area under the precision-recall curve; sensitive to class balance.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
            { label: 'Precision', value: '0.82', definition: 'Share of predicted positives that are true positives.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
            { label: 'Recall', value: '0.79', definition: 'Share of actual positives that are found.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
            { label: 'F1', value: '0.81', definition: 'Harmonic mean of precision and recall.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
            { label: 'Brier score', value: '0.14', definition: 'Mean squared error of predicted probabilities; lower is better.', provenance: 'synthetic', role: 'held-out-test', scope: '75 users' },
          ],
        },
        {
          name: 'Monetization — XGBoost (held-out test)',
          note: 'Only 13 positives in this test set; estimates are highly uncertain.',
          metrics: [
            { label: 'ROC-AUC', value: '0.80', definition: 'Probability that a random positive is ranked above a random negative.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
            { label: 'PR-AUC', value: '0.67', definition: 'Area under the precision-recall curve; sensitive to class balance.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
            { label: 'Precision', value: '0.75', definition: 'Share of predicted positives that are true positives.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
            { label: 'Recall', value: '0.46', definition: 'Share of actual positives that are found.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
            { label: 'F1', value: '0.57', definition: 'Harmonic mean of precision and recall at the default 0.5 threshold.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
            { label: 'Brier score', value: '0.09', definition: 'Mean squared error of predicted probabilities; lower is better.', provenance: 'synthetic', role: 'held-out-test', scope: '13 positives' },
          ],
        },
        {
          name: 'Monetization — XGBoost threshold sweep',
          note: 'A threshold-analysis result, not the default-threshold score.',
          metrics: [
            { label: 'F1 at threshold 0.35', value: '0.70', definition: 'F1 obtained by moving the decision threshold to 0.35.', provenance: 'synthetic', role: 'threshold-sweep', caveat: 'This is not the F1 at the default 0.5 threshold (0.57). Choosing a threshold should follow business costs, not the sweep alone.' },
          ],
        },
        {
          name: 'Simulated experiment',
          note: 'Outcomes and effects are generated, not observed in real users.',
          metrics: [
            { label: 'Reward-variant lift', value: '+0.143', definition: 'Difference in the simulated reward metric between variants.', provenance: 'simulated', role: 'simulated-experiment', caveat: 'Simulated effect, not a real-world treatment effect.' },
            { label: 'p-value', value: '< 0.0001', definition: 'Probability of the simulated result under the null hypothesis.', provenance: 'simulated', role: 'simulated-experiment', caveat: 'A p-value from a simulation is not evidence from a real experiment.' },
          ],
        },
      ],
      caveats: [
        'All figures come from synthetic data. They are not results from real users or a deployed commercial product.',
        'The held-out test set has 75 users and the monetization test set has 13 positives, so estimates have wide uncertainty.',
        'The repository README contains one sentence stating the model is chosen on test ROC-AUC. This conflicts with the split documentation, the evaluation log, and the code; those sources say selection is on validation ROC-AUC, which is the method described here.',
      ],
    },
    results: [
      'On the held-out test set, the retention model reaches ROC-AUC 0.88 and the monetization model 0.80. Both indicate ranking discrimination on synthetic data, not predictive performance on real customers.',
      'The gap between monetization precision (0.75) and recall (0.46) at the default threshold shows the trade-off that any deployment would have to choose deliberately, ideally using expected business cost.',
      'ROC-AUC and PR-AUC describe ranking. Calibration (Brier score) and business value must be assessed separately; a strong ROC-AUC does not by itself justify acting on the model.',
    ],
    limitations: [
      'Synthetic data only; no real-world validation.',
      'Small held-out test set (75 users; 13 monetization positives).',
      'Experiment effects are simulated and do not represent a real experiment.',
      'Ranking metrics alone do not establish calibration or business value.',
    ],
    failureModes: [
      'Over-reading metrics computed on a small test set.',
      'Selecting an operating threshold for statistical convenience rather than business cost.',
      'Treating simulated experiment results as real-world evidence.',
      'Relying on documentation that is out of step with the code.',
    ],
    nextImprovements: [
      'Correct the stale README sentence in the source repository so documentation matches the code-backed method.',
      'Add probability-calibration analysis and report calibration curves.',
      'Repeat evaluation across multiple seeds to quantify metric uncertainty.',
      'Choose the operating threshold from expected business costs.',
    ],
    links: [
      { label: 'Repository', href: 'https://github.com/tejas-parjane/attention-os', kind: 'repository' },
      { label: 'Live demo', href: 'https://tejas-parjane.github.io/attention-os/', kind: 'demo' },
      { label: 'README', href: 'https://github.com/tejas-parjane/attention-os/blob/main/README.md', kind: 'source' },
      { label: 'Detailed evaluation log', href: 'https://github.com/tejas-parjane/attention-os/blob/main/docs/model_evaluation.md', kind: 'documentation' },
      { label: 'Split implementation', href: 'https://github.com/tejas-parjane/attention-os/blob/main/src/models/splits.py', kind: 'source' },
      { label: 'Training code', href: 'https://github.com/tejas-parjane/attention-os/blob/main/scripts/train_models.py', kind: 'source' },
    ],
  },
  {
    slug: 'forecasting-engine',
    title: 'Forecasting & Decision Intelligence Engine',
    status: 'live-demo',
    statusNote:
      'Independent project on a synthetic single series. Metrics are verified from the recorded backtest artifact; validation windows are roughly 109–110 observations, not a 30-step horizon.',
    verification: {
      level: 'verified-from-source',
      note: 'Metrics and method were checked against the repository evaluation report, the backtesting and pipeline code, and the recorded backtest artifact. The configured 30-step horizon is not forwarded into the backtester, so the published scores come from longer validation windows.',
    },
    atAGlance: [
      { label: 'Type', value: 'Independent project, not a client engagement' },
      { label: 'Data', value: 'Synthetic single series: 1,095 daily rows, 2021-01-01 to 2023-12-31, seed 42' },
      { label: 'Backtest', value: '4 expanding-window folds; validation windows 109/109/110/110 observations' },
      { label: 'Models', value: 'Naive, Seasonal Naive, ETS, ARIMA/SARIMA, XGBoost' },
      { label: 'Final forecast', value: '30-step horizon, produced separately from the backtest' },
      { label: 'Stack', value: 'Python, FastAPI; optional LLM interprets results but does not compute forecasts' },
    ],
    overview: [
      'The Forecasting and Decision Intelligence Engine is an independent project that validates a time series, compares forecasting models, quantifies uncertainty, and turns the result into a decision brief.',
      'The published evaluation uses one synthetic daily series. The backtest expands over four folds; the final forecast output is a separate 30-step horizon.',
    ],
    problem: [
      'Forecasts are easy to produce and hard to trust. Without baselines, backtesting, and explicit uncertainty, a model can look accurate while providing no practical advantage over a naive forecast.',
    ],
    intendedOutcome: [
      'A reproducible pipeline where model choice is justified against baselines, uncertainty is reported, and the output is expressed as a decision brief rather than a bare number.',
    ],
    constraints: [
      'The evaluation uses a single synthetic series, so results do not generalise to arbitrary real-world series.',
      'Residual diagnostics show remaining structure, so uncertainty intervals may be optimistic around anomalies.',
    ],
    assumptions: [
      'The sample series is generated with a fixed seed (42), making the run reproducible.',
      'Model comparison is meaningful only relative to the included baselines.',
    ],
    architecture: [
      { step: 'Validation', detail: 'Incoming series are validated before modelling.' },
      { step: 'Preprocessing', detail: 'The series is cleaned and prepared for feature generation.' },
      { step: 'Features', detail: 'Lag, calendar, and rolling features are constructed.' },
      { step: 'Backtest', detail: 'Expanding-window validation compares Naive, Seasonal Naive, ETS, ARIMA/SARIMA, and XGBoost.' },
      { step: 'Aggregation', detail: 'Error metrics are aggregated across folds for comparison.' },
      { step: 'Uncertainty', detail: 'Prediction intervals and residual diagnostics are produced.' },
      { step: 'Decision brief', detail: 'A structured report explains the result; an optional LLM only interprets the structured output.' },
    ],
    implementation: {
      implemented: [
        'Data validation and preprocessing',
        'Lag, calendar, and rolling feature generation',
        'Expanding-window backtesting framework',
        'Baseline and model comparison (Naive, Seasonal Naive, ETS, ARIMA/SARIMA, XGBoost)',
        'Uncertainty intervals and residual diagnostics',
        'Structured decision brief with deterministic fallback',
      ],
      inDevelopment: [
        'Horizon configuration: the pipeline does not currently forward the configured 30-step horizon into the backtester, so backtest folds use the backtester size heuristic.',
      ],
      planned: [],
    },
    demonstration: {
      description: 'Hosted demo of the forecasting workflow.',
      href: 'https://tejas-parjane.github.io/forecasting-engine/',
      isHosted: true,
    },
    evaluation: {
      methodology: [
        'Models are compared using an expanding-window backtest and aggregated error metrics, including sMAPE, MAE, RMSE, and WAPE.',
        'Baselines (Naive and Seasonal Naive) are included so that a model has to beat a trivial forecast to be justified.',
        'The final forecast output uses a 30-step horizon, which is separate from the validation windows used in the backtest.',
      ],
      metricGroups: [
        {
          name: 'Model comparison — aggregated sMAPE',
          note: 'Lower is better. Aggregated across 4 expanding-window folds with validation windows of 109/109/110/110 observations.',
          metrics: [
            { label: 'ARIMA — sMAPE', value: '11.35', definition: 'Symmetric mean absolute percentage error, aggregated across folds.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs', caveat: 'Not a 30-step backtest score.' },
            { label: 'Seasonal Naive — sMAPE', value: '12.29', definition: 'Baseline that repeats the value from one seasonal cycle earlier.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs', caveat: 'Not a 30-step backtest score.' },
            { label: 'XGBoost — sMAPE', value: '12.55', definition: 'Gradient-boosted regression on engineered features.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs', caveat: 'Not a 30-step backtest score.' },
            { label: 'ETS — sMAPE', value: '12.80', definition: 'Exponential smoothing with error, trend, and seasonality.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs', caveat: 'Not a 30-step backtest score.' },
            { label: 'Naive — sMAPE', value: '15.96', definition: 'Baseline that repeats the most recent observed value.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs', caveat: 'Not a 30-step backtest score.' },
          ],
        },
        {
          name: 'ARIMA — additional error metrics',
          note: 'Aggregated across the same four folds.',
          metrics: [
            { label: 'MAE', value: '126.5', definition: 'Mean absolute error in the series units.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
            { label: 'RMSE', value: '152.0', definition: 'Root mean squared error, penalising large errors more.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
            { label: 'WAPE', value: '11.08', definition: 'Weighted absolute percentage error.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
          ],
        },
        {
          name: 'Seasonal Naive — additional error metrics',
          note: 'Baseline comparison on the same folds.',
          metrics: [
            { label: 'MAE', value: '136.0', definition: 'Mean absolute error in the series units.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
            { label: 'RMSE', value: '163.2', definition: 'Root mean squared error, penalising large errors more.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
            { label: 'WAPE', value: '11.89', definition: 'Weighted absolute percentage error.', provenance: 'synthetic', role: 'backtest-fold', scope: '4 folds · 109/109/110/110 obs' },
          ],
        },
      ],
      caveats: [
        'The 11.35 sMAPE for ARIMA is an aggregated backtest score over roughly 109–110 observation windows. It must not be described as a 30-day-horizon score.',
        'The final forecast output horizon is 30 steps. The configured horizon is not currently passed into the backtester, so backtest and final-forecast settings differ.',
        'Residual diagnostics (Ljung–Box) reject residual whiteness, and heavy tails arise from injected anomalies, so uncertainty intervals may be optimistic in anomaly-heavy periods.',
        'This is a single synthetic series; the results do not generalise to arbitrary real-world time series.',
      ],
    },
    results: [
      'On the synthetic series, ARIMA produced the lowest aggregated sMAPE (11.35), edging out the Seasonal Naive baseline (12.29).',
      'The margin over Seasonal Naive is meaningful only within this single series. On many real series seasonal persistence is hard to beat, so the comparison should be repeated on real data before drawing general conclusions.',
      'Remaining residual structure means the intervals should be treated as approximate, especially where anomalies are present.',
    ],
    limitations: [
      'Single synthetic series; no real-world evaluation.',
      'Backtest validation windows (~109–110 observations) differ from the 30-step final forecast horizon.',
      'Residual diagnostics show remaining structure and heavy tails.',
      'Uncertainty intervals may be optimistic around anomalies.',
    ],
    failureModes: [
      'Reporting a backtest score as if it came from the final forecast horizon.',
      'Choosing a model without a baseline comparison.',
      'Treating wide or mis-specified intervals as reliable.',
      'Assuming one series generalises to all series.',
    ],
    nextImprovements: [
      'Decide the intended evaluation semantics: fixed 30-step horizon or the current ~109–110-step folds.',
      'If the horizon config is wired into the backtester, rerun the backtest and regenerate the artifact and report before publishing new numbers.',
      'Evaluate on real time series and report per-series results.',
      'Model the anomaly process explicitly to improve interval coverage.',
    ],
    links: [
      { label: 'Repository', href: 'https://github.com/tejas-parjane/forecasting-engine', kind: 'repository' },
      { label: 'Live demo', href: 'https://tejas-parjane.github.io/forecasting-engine/', kind: 'demo' },
      { label: 'README', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/README.md', kind: 'source' },
      { label: 'Evaluation report', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/docs/evaluation_results.md', kind: 'documentation' },
      { label: 'Backtesting code', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/app/evaluation/backtesting.py', kind: 'source' },
      { label: 'Pipeline', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/app/forecasting/pipeline.py', kind: 'source' },
      { label: 'Reproduction script', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/scripts/run_backtest.py', kind: 'source' },
      { label: 'Recorded backtest artifact', href: 'https://github.com/tejas-parjane/forecasting-engine/blob/main/results/backtest_sample.json', kind: 'source' },
    ],
  },
  {
    slug: 'agentci',
    title: 'AgentCI',
    status: 'open-source-alpha',
    statusNote: 'Early public alpha (v0.1.1). Not production-ready; no hosted demo.',
    verification: {
      level: 'verified-from-source',
      note: 'Capabilities were checked against the repository README, the package metadata, and the version module. This describes the documented feature set of an alpha release, not a production readiness claim.',
    },
    atAGlance: [
      { label: 'Type', value: 'Open-source CI and release-gate toolkit' },
      { label: 'Release', value: 'Early public alpha (v0.1.1)' },
      { label: 'Commands', value: 'run, record, replay, diff, gate' },
      { label: 'Assertions', value: 'Outputs, tool calls and order, cost, latency, step and retry budgets, policy, side effects, secret redaction' },
      { label: 'Side effects', value: 'Denied by default unless safely mocked or explicitly permitted' },
      { label: 'Demo', value: 'None hosted; source and a scripted example instead' },
    ],
    overview: [
      'AgentCI is an open-source toolkit for testing AI agent behaviour and acting as a release gate. It runs behaviour assertions, records and replays traces, diffs behaviours between runs, and produces a pass or fail verdict.',
      'The project is an early public alpha. There is no hosted demo; the source, the assertion model, and a deterministic scripted example are the evidence available today.',
    ],
    problem: [
      'Agents fail in ways ordinary unit tests miss: the wrong tool is called, a step is retried excessively, a policy is violated, or a side effect is triggered unexpectedly. These failures can pass silently between releases.',
    ],
    intendedOutcome: [
      'A CI step that captures agent traces and blocks a release when behaviour regresses against assertions, without requiring a live model provider for deterministic tests.',
    ],
    constraints: [
      'Alpha software; interfaces may change.',
      'Assertions are only as strong as the ones authors define.',
      'Non-deterministic agents make replay and diff harder.',
    ],
    assumptions: [
      'Deterministic tests can run offline with a scripted model fixture and no real model API key.',
      'External side effects are unsafe by default and must be mocked or explicitly allowed.',
    ],
    architecture: [
      { step: 'Run', detail: 'The agent is executed under assertion checks.' },
      { step: 'Capture', detail: 'A trace of outputs and tool calls is recorded.' },
      { step: 'Assert', detail: 'Assertions cover outputs, tools and order, budgets, cost, latency, policy, side effects, and secret redaction.' },
      { step: 'Record / replay', detail: 'Traces can be replayed to reproduce behaviour deterministically.' },
      { step: 'Diff', detail: 'Behaviour is compared between runs to surface changes.' },
      { step: 'Gate', detail: 'A release verdict passes or blocks based on the assertions.' },
    ],
    implementation: {
      implemented: [
        'Behaviour assertion engine covering tools, cost, latency, budgets, policy, side effects, and secret redaction',
        'Trace recording and replay',
        'Behaviour diffing between runs',
        'Release gate with a pass or fail verdict',
        'Side effects denied by default unless mocked or permitted by policy',
        'Deterministic offline example using a scripted model fixture',
      ],
      inDevelopment: [],
      planned: [],
    },
    evaluation: {
      methodology: [
        'AgentCI is evaluated through its own test suite and a deterministic scripted example rather than a published benchmark. Correctness is demonstrated by asserting behaviour and by catching a deliberate regression.',
      ],
      metricGroups: [],
      caveats: [
        'No published performance benchmarks. Capability is demonstrated through deterministic examples and tests, not by model-accuracy figures.',
      ],
    },
    results: [
      'A scripted support-agent refund example detects a deliberate duplicate-refund regression and blocks the release gate, without needing a real model API key.',
    ],
    limitations: [
      'Early public alpha (v0.1.1); not production-ready.',
      'No hosted demo; inspection requires the repository.',
      'Assertion coverage depends on the assertions an author writes.',
      'Behaviour of non-deterministic agents can be hard to replay exactly.',
    ],
    failureModes: [
      'Assertions that are too weak to catch a novel regression.',
      'Non-determinism causing flaky replay or diffs.',
      'Misconfigured redaction allowing a secret to appear in a trace.',
      'Unmocked side effects escaping the default deny policy by mistake.',
    ],
    nextImprovements: [
      'Broaden the assertion library and document patterns for common agent failure modes.',
      'Add guidance for handling non-deterministic agents in replay and diff.',
      'Publish a reproducible walkthrough of the refund regression example.',
    ],
    links: [
      { label: 'Repository', href: 'https://github.com/tejas-parjane/agentci', kind: 'repository' },
      { label: 'README', href: 'https://github.com/tejas-parjane/agentci/blob/main/README.md', kind: 'source' },
      { label: 'Package metadata', href: 'https://github.com/tejas-parjane/agentci/blob/main/pyproject.toml', kind: 'source' },
      { label: 'Version module', href: 'https://github.com/tejas-parjane/agentci/blob/main/src/agentci/__about__.py', kind: 'source' },
    ],
  },
]

export function getCaseStudyBySlug(slug: string): ProjectCaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug)
}
