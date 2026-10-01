# Workflow migration inventory

The site is moving from `robotics-ai-suite-staging` to this repository. The
staging repository has one website deployment workflow; it does not replace the
source-code checks below. Retire an existing check only when its replacement is
running here. Do not deploy from both repositories after cutover.

| Existing workflow | Current purpose | Migration |
| --- | --- | --- |
| `documentation-check.yaml`, `docs-reusable-workflow.yaml` | Monorepo documentation filter and reusable Sphinx build; paths do not match this repository | Removed; `deploy-website.yaml` now builds Sphinx + Docusaurus on PRs and publishes the site. |
| `robotics-workflow.yaml`, `robotics-components.yaml` | PR/push dispatcher and nine component path filters | Paths now match `src/components/`; manual dispatch can rebuild all nine. `ros-kpi`, pipelines, and robot-vision-control still need their own checks. |
| `robotics-components-{adbscan,collaborative-slam,fast-mapping,groundfloor,its-planner,multicam-demo,object-detection,simulations,wandering}.yaml` | Component-specific reusable build and license checks | Working directories and sparse checkouts now match `src/components/`; validate the jobs in GitHub Actions. |
| `skill-scan.yaml` | PR/push/scheduled skill security scanning | Keep running until a public-repo replacement is verified. |
| `zizmor-scan.yaml` | PR/push/scheduled workflow security scanning | Keep running until a public-repo replacement is verified. |
| `siv-weekly-tag.yaml` | Scheduled submodule updates and tagging with write permissions | Review separately before replacing or disabling; it is not a site workflow. |

The site workflow builds on PRs, publishes trusted PR previews and removes them
on close, and publishes production only from main. Validate a deployed nested
`/pr/<number>/` preview before switching production publishing. Once published,
crawl internal routes/assets and review external links on the live domain.