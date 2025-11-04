# Contributing to DotNET Build Buddy

Thank you for your interest in contributing to **DotNET Build Buddy**! Your help makes this project better and ensures the extension remains high quality for everyone.

This document provides guidelines to help you contribute safely, efficiently, and harmoniously with the existing workflow.

---

## Table of Contents

1. [How to Contribute](#how-to-contribute)
2. [Reporting Issues](#reporting-issues)
3. [Pull Requests and Fork Workflow](#pull-requests-and-fork-workflow)
4. [Coding Standards](#coding-standards)
5. [Linting and Build Checks](#linting-and-build-checks)
6. [Labels and Moderation](#labels-and-moderation)
7. [Security and Sensitive Files](#security-and-sensitive-files)
8. [Code of Conduct](#code-of-conduct)
9. [Contact](#contact)

---

## How to Contribute

We welcome contributions from everyone! Before submitting your PR:

1. Fork the repository to your personal account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/DotNET-Build-Buddy.git
3. Create a feature branch for your work:
   ```Bash
   git checkout -b feature/awesome-feature
4. Make your changes, run lint and build checks locally.
5. Push your branch to your fork and submit a pull request to the main repository.

## Reporting Issues

If you find bugs or have feature requests:

1. Check existing issues first — your problem might already be reported.
2. Open a new issue with clear steps to reproduce the bug or a detailed description of the feature request.
3. Use meaningful titles and include screenshots or code snippets if possible.

## Pull Requests and Fork Workflow

- Ensure your PR is based on the latest main branch.
- Use descriptive titles for PRs.
- Reference any related issues using ``#issue_number``.
- A PR must pass policy checks:
  - AI Moderator and Policy-Bot labels
  - Linting and build success
  - Human review if necessary
 
**Note**:All PRs should be checked by the bots first, and a human reviewer is required for any PR flagged as ``needs-human-review`` or touching sensitive files.

## Coding Standards

To keep the codebase clean and consistent:

- Use **TypeScript** for all source code.
- Follow general TypeScript best practices:
  - Use strict typing wherever possible
  - Prefer ``const`` over ``let`` when variables don’t change
  - Keep functions small and focused
- Keep files organized under the ``src/`` directory
- Document your code with comments and JSDoc-style annotations
- Run lint checks before pushing changes:
  ```Bash
  npm run lint

## Linting and Build Checks

All PRs must pass automated checks:

- ``npm run lint`` — checks code style and formatting
- ``npm run build`` — ensures code compiles without errors
- GitHub Actions will run these checks automatically

PRs that fail checks will be labeled and cannot be merged until resolved.

## Labels and Moderation

The following labels are used by bots and contributors:

- **needs-review** — PR needs human or automated review
- **ready-to-merge** — PR passed all checks and is approved
- **spam** — flagged by AI Moderator as spam
- **ai-generated** — flagged by AI Moderator for AI content
- **security-review** — PR touches sensitive files; human review required

The bots automatically comment and enforce policy checks based on these labels.

## Code of Conduct

All contributors are expected to follow the [Contributor Covenant Code of Conduct](/CODE_OF_CONDUCT.md). Be respectful, constructive, and helpful in all discussions.

## Contact

For questions, assistance, or guidance, you can contact:

- **Project Owner**: [@MilesONerd](https://milesonerd.netlify.app/contact)

---

With these guidelines, every contributor will know exactly how to work with the repository, interact with the bots, and maintain a safe and high-quality codebase.
