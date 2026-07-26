# Open Operational Risk Register

This register lists risks that remain after Program 6 implementation. A risk is not closed by code completion alone; the required production evidence or operating control must be recorded.

| ID | Risk | Current control | Required closure evidence | Status |
| --- | --- | --- | --- | --- |
| OPS-001 | Program 5 bandwidth improvements have not yet been measured under representative production traffic. | Admin-only process-local bandwidth report; optimized accounts and stock-history handlers; bounded telemetry. | Deploy the exact reviewed commit, exercise daily workflows, capture `/api/admin/bandwidth-report?limit=50`, and compare request rate, bytes, latency, and errors for the optimized routes. | Open — production evidence required |
| OPS-002 | Export memory behavior has not yet been demonstrated on the production instance size. | Workbook worksheet/row/cell limits, bounded server concurrency, bounded queue, timeout, and non-empty output checks. | Run small, normal, large-valid, and concurrent exports; record memory recovery, file validity, and controlled capacity errors. | Open — production evidence required |
| OPS-003 | Bandwidth telemetry is process-local and resets on restart or scale-out. | Route cardinality limit, rolling window, privacy-preserving aggregates. | Establish centralized platform metrics or a periodic operator capture procedure if historical or multi-instance analysis is required. | Accepted limitation until centralized monitoring is approved |
| OPS-004 | Active-user presence is stored in memory. | Five-minute expiry and lightweight heartbeat. | Accept restart reset behavior or move presence to a shared store if multi-instance accuracy becomes required. | Accepted limitation |
| OPS-005 | Production backups and restore drills are not automated by this repository. | Release runbook requires a verified provider snapshot or `pg_dump` backup before risky releases. | Record a successful restore drill, owner, recovery time, and verification results in the operating environment. | Open — operational exercise required |
| OPS-006 | The repository has no universal automated down-migration command. | Forward migrations, application rollback, forward-fix, and restore procedure are documented. | Maintain verified pre-release backups and test restore/cutover procedure. | Accepted architectural limitation |
| OPS-007 | Gemini and TrackingMore depend on external provider availability, keys, and quotas. | Optional integration separation; core ERP does not require these keys. | Verify each configured integration after deployment and establish provider key rotation ownership. | Open when integration enabled |
| OPS-008 | Stacked pull requests must be merged in dependency order. | Draft PR bases encode the stack; release runbook requires oldest-to-newest merge and CI rerun after retargeting. | Record final merge order and green CI on each exact rebased head. | Open until stack is merged |
| OPS-009 | Financial repair capability can modify production data when explicitly enabled. | Separate secret, same-day scoped token, dry-run default, `ALLOW_FINANCIAL_REPAIR=true` gate, advisory lock, and audit table. | Confirm repair variables are absent from normal service configuration and document every approved repair with backup and before/after evidence. | Controlled high-risk capability |
| OPS-010 | Documentation can drift from environment-variable usage. | Static `environment-usage.json`, operator registry, `.env.example`, and CI regression coverage. | Keep CI green whenever new environment-variable references are added. | Controlled |

## Release-blocking items

The following items block final approval of the Program 5–6 stack unless the release owner explicitly accepts and records the risk:

1. OPS-001 production bandwidth evidence
2. OPS-002 production export and memory evidence
3. OPS-005 verified backup identifier for the release
4. OPS-008 correct stacked merge order and final CI on rebased heads

## Risk acceptance record

When accepting a risk, record:

- risk ID
- approving owner
- date and UTC time
- deployed build version
- reason acceptance is necessary
- temporary controls
- review or expiry date
- follow-up issue or work item

Do not mark a risk closed without the evidence described in this register.
