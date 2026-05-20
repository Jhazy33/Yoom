# Yoom Application - Revised Comprehensive Issue Analysis & Fix Plan

## Review Status

- **Quality score**: 62/100
- **Review outcome**: REQUEST CHANGES
- **Goal of this revision**: Replace unvalidated assumptions with implementation-ready phases, explicit dependencies, and hard verification gates.

## Verified Current State

These points were rechecked against the repository before revising the plan.

1. **The prior production auth diagnosis is not validated.**
   - `.env.verified` contains `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `NEXTAUTH_SECRET`.
   - `vercel.json` only declaring `NEXT_PUBLIC_APP_URL` does **not** prove the admin auth variables are missing from the deployed runtime.
   - `src/lib/auth.ts` still contains hardcoded fallback credentials, which makes runtime diagnosis less trustworthy and is itself a security issue.

2. **`/watch/[key]` is currently protected, but product docs define it as public.**
   - `src/middleware.ts` matches `/watch/:path*`.
   - `README.md` and `docs/superpowers/specs/2026-04-09-yoom-design.md` both state that anyone with the link should be able to watch.

3. **The login loading state already exists.**
   - `src/app/login/page.tsx` already uses `loading`, disables submit, and renders `Signing in...`.
   - Any plan item to add that behavior should be removed.

4. **The home-page CTA issue is misdiagnosed in the old plan.**
   - `src/app/page.tsx` renders separate labels for `Manage Recordings` and `Settings`.
   - The actual bug is that both links point to `/settings`, so the problem is duplicate destination/semantics, not duplicate button text.

5. **Current quality gate baseline**
   - `npm run lint` fails with **11 errors and 19 warnings**.
   - `npm run build` currently passes.

## Source-of-Truth Contract For This Plan

- **Public**: `/watch/[key]`
- **Protected**: owner/admin-only surfaces such as login, recorder, and settings
- **Security rule**: no hardcoded credential fallback paths in server auth code
- **Execution rule**: do not implement auth changes until the real production failure is reproduced or disproved with evidence

## Removed Or Corrected From The Prior Plan

- Removed: "missing ADMIN_* variables in production" as the assumed root cause
- Removed: "add login loading state"
- Corrected: "duplicate Settings buttons" to "duplicate destination / unclear CTA separation"
- Removed: speculative UI work that was not tied to review findings or validated product requirements

## Revised Fix Plan

### Phase 1 - Revalidate The True Production Auth Failure

- **Priority**: P0
- **Dependency**: none
- **Why first**: Every auth change after this point is guesswork unless the real failure mode is proven.

#### Actions

1. Confirm the auth contract in use for production.
   - Verify whether the intended operator login uses the current NextAuth admin flow or whether the product should revert to the original `UPLOAD_PASSWORD`-style owner gate described in the docs.
   - For this plan, assume the current admin login remains in place unless product explicitly says otherwise.

2. Reproduce the failure against current runtime inputs.
   - Pull or confirm the deployed environment values without exposing secrets in logs or docs.
   - Validate that the operator is using the actual configured username, not an assumed default such as `admin`.
   - Test the known-good credential pair locally against the pulled production env values.

3. Instrument the auth path only if reproduction is still ambiguous.
   - Add temporary server-side diagnostics that log booleans only:
     - env presence
     - username match result
     - bcrypt compare result
     - session/secret presence
   - Do **not** log raw usernames, passwords, hashes, or secrets.

4. Determine the real root cause and record it before code changes.
   - Possible validated outcomes:
     - operator is using the wrong username
     - hash does not match the intended password
     - deployment is stale relative to env updates
     - NextAuth/session configuration is misbehaving
     - auth code fallback behavior is masking misconfiguration

#### Validation Gate

- The team can state the auth failure cause in one sentence backed by a reproducible test.
- If this gate is not met, do not proceed to auth remediation.

#### Alternative Path

- If product decides the admin-login architecture itself is wrong, stop here and replace the remaining phases with a simplification plan that removes NextAuth and restores the documented `UPLOAD_PASSWORD` flow.

### Phase 2 - Harden Auth Configuration And Remove Unsafe Fallbacks

- **Priority**: P0
- **Dependency**: Phase 1 complete

#### Actions

1. Remove hardcoded fallback credentials from `src/lib/auth.ts`.
   - Eliminate default username and default bcrypt hash.
   - Fail closed when required auth env vars are missing.

2. Make misconfiguration explicit.
   - Return a controlled server-side configuration error for missing auth env, rather than silently accepting defaults.
   - Keep the login UI behavior generic; do not leak whether username or password mismatched.

3. Align local/dev setup with the chosen auth contract.
   - If NextAuth remains: update `.env.example` and related setup docs so admin auth env requirements are documented.
   - If the product returns to `UPLOAD_PASSWORD` only: remove the now-obsolete admin auth requirements instead of documenting them.

#### Validation Gate

- No fallback credentials remain in committed source.
- Starting the app without required auth configuration fails safely and predictably.

#### Risk

- Removing fallbacks may break ad hoc local usage for anyone relying on defaults.

#### Mitigation

- Document the required env variables in the same change set.

### Phase 3 - Correct Route Access Policy For `/watch/[key]`

- **Priority**: P0
- **Dependency**: can run in parallel with Phase 2 after Phase 1 confirms no broader auth redesign is needed

#### Actions

1. Remove `/watch/:path*` from protected route matching.
2. Keep recorder/admin surfaces protected.
3. Re-test the share flow end to end:
   - authenticated owner can generate a watch link
   - an unauthenticated/incognito user can open the watch link
   - direct access to protected owner routes still redirects or blocks correctly

#### Validation Gate

- `/watch/[key]` works anonymously in a clean browser session.
- `/recorder` and other owner-only routes remain protected.

#### Alternative

- If future product requirements need revocable share access, introduce signed share tokens later rather than reusing owner auth middleware.

#### Follow-up Note

- `next build` warns that the `middleware` convention is deprecated in Next 16. If editing this file becomes noisy, consider migrating the file to the current `proxy` convention in the same change or a tightly scoped follow-up.

### Phase 4 - Fix The Home-Page CTA / Settings Navigation Issue

- **Priority**: P1
- **Dependency**: none

#### Actions

1. Correct the issue description in implementation notes:
   - The labels are not duplicated.
   - The destinations are duplicated.

2. Give `Manage Recordings` and `Settings` distinct navigation outcomes.
   - Recommended implementation:
     - keep `Settings` pointing to `/settings`
     - point `Manage Recordings` to the recordings section of the settings page, e.g. `/settings#recordings`
     - add the corresponding anchor/id to the recordings section if needed

3. Verify that the resulting CTA structure is consistent with the actual information architecture.

#### Validation Gate

- From the authenticated home page, each CTA leads to a unique and expected destination.

#### Risk

- If the settings page does not yet expose a stable recordings anchor, the CTA fix may require a small markup change in the settings page.

#### Mitigation

- Prefer an anchor-based fix over creating a new page or route.

### Phase 5 - Clear Lint Debt And Add Non-Negotiable Quality Gates

- **Priority**: P0 gate for merge readiness
- **Dependency**: all code changes complete

#### Actions

1. Fix the current lint failures before calling the work complete.
   - Current baseline: **11 errors, 19 warnings**
   - Highest-signal lint cleanup areas currently include:
     - `src/app/settings/page.tsx`
     - `src/components/providers.tsx`
     - `src/lib/r2.ts`
     - `src/app/api/recordings/[videoId]/route.ts`
     - `src/app/api/test-r2/route.ts`

2. Run the required verification commands:
   - `npm run lint`
   - `npm run build`

3. Treat these as release gates, not optional checks.

#### Required Gate Criteria

- `npm run lint` exits `0`
- `npm run build` exits `0`
- auth regression checks pass
- `/watch/[key]` public-access check passes
- CTA/navigation regression check passes

#### Recommended Manual Smoke Tests

- Invalid login shows a generic failure message
- Valid login succeeds with the configured operator account
- Logout returns the user to the intended entry point
- Share link works in incognito
- Recorder/settings remain protected

## Execution Order And Dependencies

1. **Phase 1** must complete before any auth remediation.
2. **Phase 2** depends on the Phase 1 diagnosis.
3. **Phase 3** can proceed once Phase 1 confirms the app is not being re-scoped away from the current admin-auth model.
4. **Phase 4** is independent and can be batched with Phase 3.
5. **Phase 5** is the final merge gate for all prior phases.

## Risks And Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Auth root cause is misidentified again | Critical | Require reproduced failure plus evidence before code changes |
| Removal of fallback creds causes local breakage | High | Update env/setup docs in the same change |
| Public watch route accidentally exposes owner-only features | High | Keep middleware tests focused on route boundaries |
| CTA fix introduces another duplicate path or dead anchor | Medium | Verify both destination URLs manually after change |
| Lint debt delays release | Medium | Treat lint cleanup as part of the fix, not follow-up work |

## Definition Of Done

This issue set is complete only when all of the following are true:

- the real auth failure is validated and documented
- hardcoded auth fallback credentials are removed
- `/watch/[key]` is publicly accessible as required
- home CTAs have distinct, correct destinations
- already-implemented items are removed from the plan and not reworked
- `npm run lint` passes
- `npm run build` passes

## Immediate Next Actions

1. Reproduce the current production auth failure using the actual configured operator credentials and pulled runtime env values.
2. Record the validated failure cause in the implementation notes.
3. Remove auth fallbacks and correct route policy once the diagnosis is proven.
4. Fix the home CTA destination issue.
5. End on green `lint` and green `build`.
