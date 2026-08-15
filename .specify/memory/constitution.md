<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections: Core Principles (I-VI), Technology Stack, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: none
-->

# SkillForge Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)
Every major feature MUST go through the full Spec Kit cycle in order — `spec.md`
(what/why, no implementation detail) → `plan.md` (technical approach) →
`tasks.md` (actionable breakdown) → implementation. No feature's code is written
before its `spec.md` and `plan.md` exist and have been presented for review.
Work MUST NOT proceed to the next feature until the user has explicitly
validated the current one (spec, plan, and implementation). Rationale: the
project's stated goal is traceable visibility into what exists, why, and at
what stage — skipping steps defeats that purpose.

### II. Scope Discipline (YAGNI)
Build only what the current feature's spec requires. Do not add
speculative abstractions, extra roles, extra tables, or "nice to have"
endpoints beyond what was explicitly validated for the MVP. Deferred ideas
are recorded as open questions or future feature candidates, not built
early. Rationale: this is a small, friends-scale project — premature
generality is pure cost with no near-term payoff.

### III. Explicit Over Assumed
When a requirement is ambiguous, underspecified, or not mentioned in an
approved spec, STOP and ask the user rather than inventing a default,
even a reasonable-sounding one. Silent assumptions are only acceptable for
implementation-level details that carry no product or data-model
consequence (e.g. internal variable naming). Rationale: the user has
explicitly required this working mode; wrong silent assumptions are more
expensive to unwind than a clarifying question.

### IV. Security & Data Ownership by Default
Authentication uses hashed passwords (never plaintext), short-lived JWT
access tokens plus rotating refresh tokens, and role checks enforced
server-side (never trusted from the client). Private teams' content MUST
NOT be visible or downloadable to non-members regardless of role, except
Admin (full visibility is an explicit, intentional exception for
moderation). Secrets (DB credentials, MinIO keys, JWT signing keys) MUST
NOT be committed to the repository — they live in `.env` files that are
git-ignored, with a checked-in `.env.example`.

### V. Consistent, Boring Stack
The stack is fixed for this project: React + Vite (SPA) frontend,
ASP.NET Core Web API backend, PostgreSQL for relational data, MinIO
(S3-compatible) for file/object storage, Docker Compose for local
development, Kubernetes as the eventual orchestration target. New
components MUST justify why an already-adopted tool cannot serve the
purpose before introducing a new one.

### VI. Reproducible Local Environment
Every backend/storage dependency (PostgreSQL, MinIO, API) MUST be runnable
locally via `docker compose up` with no manual out-of-band setup beyond
copying `.env.example` to `.env`. A contributor MUST be able to go from
clone to running stack with a documented, minimal set of commands.

## Technology Stack

- Frontend: React + Vite, single-page application.
- API: ASP.NET Core (C#), REST endpoints, versioned under `/api`.
- Database: PostgreSQL, schema changes via EF Core migrations (or
  equivalent tracked migration tool) — no manual, undocumented schema
  drift.
- Object storage: MinIO (S3-compatible API) for uploaded package files and
  avatars.
- Auth: email + password, JWT access token + refresh token, roles
  `Admin` / `Utilisateur` enforced server-side.
- Local orchestration: Docker Compose (dev). Kubernetes manifests/target
  (local k3s/minikube vs. managed cloud) are decided later, once the
  containerized app is stable — not before.
- CLI (sync tool): ships as its own component, decided and specified in
  its own feature (spec/plan/tasks) rather than assumed upfront.

## Development Workflow

- Features are delivered in dependency order, smallest coherent slice
  first: (1) socle auth/BDD/Docker, (2) gestion des équipes, (3)
  publication/store de ressources, (4) CLI de synchronisation, (5)
  modération admin — later features may be reordered only with explicit
  user agreement.
- Each feature lives under `specs/<NNN>-<slug>/` per Spec Kit convention
  with its own `spec.md`, `plan.md`, `tasks.md`.
- One feature = one reviewable unit of work = one commit (or tightly
  scoped set of commits) to the GitHub repository, only after the
  feature's implementation is validated by the user.
- Open/ambiguous points listed in a spec's "Clarifications needed" section
  MUST be resolved (by the user) before that spec's `plan.md` is written.

## Governance

This constitution supersedes ad-hoc practices for this project. Amendments
require: (1) a stated rationale, (2) a version bump following semantic
versioning (MAJOR = incompatible principle removal/redefinition, MINOR =
new principle or materially expanded guidance, PATCH = clarification/
wording), (3) the `Last Amended` date updated below. All specs and plans
MUST be checked against these principles before implementation begins;
any deviation must be called out explicitly and justified in the spec's
plan, not silently absorbed.

**Version**: 1.0.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
