# SUPRA Writer — Repository protection and recovery

This document describes recommended settings for the public repository `flandersdb-oss/SUPRA-Writer`.
**Important:** These are instructions, not proof that account-level settings were enabled.

## Protect the main branch (repository owner action)

Visit: https://github.com/flandersdb-oss/SUPRA-Writer/settings/branches

1. Under **Branch protection rules**, select **Add classic branch protection rule**.
2. In **Branch name pattern**, enter `main`.
3. Leave **Allow force pushes** **unchecked**.
4. Leave **Allow deletions** **unchecked**.
5. Select **Do not allow bypassing the above settings** if you want the restrictions to apply to administrators as well.
6. Click **Create** and verify that the rule is listed.

**Do not select Lock branch** unless you intentionally want a read-only branch. You can keep ordinary editing and publishing enabled. For a solo maintainer, avoid requiring an independent approving review unless you have another reviewer available; otherwise you can block your own updates. Requiring specific status checks can be added when your pull-request workflow is established.

A protected branch is not the same as a protected repository. A repository owner can still delete the entire personal-account repository through GitHub's verified delete workflow; keep separate backups.

## Other account checks

- Account security: https://github.com/settings/security — enable two-factor authentication (2FA) and securely store recovery methods.
- Collaborator access: https://github.com/flandersdb-oss/SUPRA-Writer/settings/access — only grant access to people who must edit the repository.
- Security settings: https://github.com/flandersdb-oss/SUPRA-Writer/settings/security_analysis — check Dependabot alerts, secret scanning availability, and private vulnerability reporting.
- Automation: https://github.com/flandersdb-oss/SUPRA-Writer/actions — review failing workflows; never enable untrusted workflows without review.
- Pull requests: https://github.com/flandersdb-oss/SUPRA-Writer/pulls — review dependency updates before merging.

## Recoverability

- Public release: https://github.com/flandersdb-oss/SUPRA-Writer/releases/tag/v0.2.0
- Historical source snapshot: branch `backup/v0.2.0-2026-10-28`
- GitHub can produce a ZIP using **Code → Download ZIP**; download and store a copy outside GitHub (for example on a computer and an external drive).
- A backup branch **in the same repository** is not sufficient if the whole repository or GitHub account is lost. Keep at least one verified off-site backup.
- Before large changes, confirm the previous release still works and open a pull request where appropriate.

## Operational safeguards

- No force-push or branch deletion for `main`.
- Avoid sharing owner credentials or recovery codes.
- Use least-privilege repository integration permissions.
- Investigate workflow failures and security alerts before publishing updates.
- Update this document when the actual settings have been verified.
