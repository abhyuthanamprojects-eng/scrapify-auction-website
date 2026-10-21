# Website End-to-End Functionality Audit

Audit scope: public Scrapify Auction website and operations console. Mobile projects are excluded.

## Verification status

| Area | Result | Evidence / next action |
| --- | --- | --- |
| Public homepage | Pass | Local production server returned 200; browser smoke load completed without console errors. |
| Terms, privacy, help | Pass | Each route rendered and exposed navigation/contact links in the browser smoke pass. |
| Authentication entry points | Pass (entry only) | Sign-in and registration pages render with role selection, OTP controls, and admin-portal link. Credentialed OTP flow still requires the supplied test accounts and a reachable staging API. |
| Account deletion information | Pass (entry only) | Public instructions and signed-in deletion path are documented; destructive deletion was not executed. |
| SSR hydration | Fixed locally | Countdown markup now starts deterministically and activates after hydration. Recheck the deployed build after release. |
| Website production build | Pass | `npm run build` completed successfully. Vite reports only advisory chunk-size warnings. |
| Operations-console production build | Pass | `npm run build` completed successfully. |
| Operations-console browser workflows | Blocked | Local console reaches the login screen, but no staging/admin test account was provided. No production credentials or mutations were attempted. |
| Seller, auction, buyer, settlement workflows | Blocked for live verification | Source routes and API methods were inventoried; live create/bid/payment/fulfilment actions require an isolated staging account and test records. |
| Lint/type gate | Fail (pre-existing debt) | Website lint reports approximately 1,883 existing formatting/type-style errors; admin lint also fails. `tsc --noEmit` reports existing implicit-`any` and contract-shape errors across portal/console routes. These should be handled as a separate typed-hardening workstream. |

## Confirmed fixes in this audit

- Removed duplicate `getOrders` and `payOrder` declarations that prevented the local website dev server from starting.
- Made the lot countdown hydration-safe to prevent the production React hydration mismatch observed in the live browser console.
- Added the optional `web_registration_fee_required` platform-config field used by registration.
- Added disabled-state support to registration secondary buttons so payment/promo verification cannot be submitted while prerequisites are missing or a request is active.
- Fixed the fulfilment console card to use mapped API fields instead of an undefined event variable.
- Preserved the reserve-not-met result state instead of narrowing every non-win to `lost`.
- Normalized root error boundaries to safely handle TanStack Router's `unknown` error type in both website and console.

## Remaining blockers before a release claim

1. Deploy the website fix and repeat the live-browser hydration check; local verification cannot prove the production deployment is updated.
2. Provide a dedicated staging/admin account and staging API base URL. Then execute isolated seller, auction, buyer, approval, payment, fulfilment, and deletion workflows.
3. Resolve or formally baseline the existing lint/type errors before making CI a release gate. Do not suppress them globally.
4. Verify backend response contracts for every inventoried API method against the deployed API/OpenAPI contract, especially approvals, auction creation, bids, payments, orders, fulfilment, and reports.

## Reproducible commands

```bash
npm run build
npm run lint
npx tsc --noEmit --pretty false
```

No production data was modified and no Git history was rewritten during this audit.
