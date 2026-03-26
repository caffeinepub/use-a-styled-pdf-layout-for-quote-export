# Specification

## Summary
**Goal:** Allow any authenticated user (not just admins) to upload and maintain rate card and account manager data, and ensure the non-admin rate card upload UI works end-to-end with clear error messaging.

**Planned changes:**
- Remove admin-role authorization checks in backend rate card upload/update so any authenticated user can call updateRateCard and see results via getRateCard.
- Remove admin-role authorization checks for backend rate card maintenance methods (addRateCardItem, updateRateCardItem, deleteRateCardItem, updateStandardCost).
- Remove admin-role authorization checks for backend account manager maintenance methods (updateAccountManagers, addAccountManager, updateAccountManager, deleteAccountManager).
- Update the frontend rate card upload flow to handle remaining authorization errors with clear English messages (including backend error text) and refresh the UI/table after a successful upload.

**User-visible outcome:** Non-admin authenticated users can upload a CSV/XLSX rate card and immediately see the updated “Current Rate Card Database” table, and can also add/update/delete rate card items, update standard cost, and maintain account managers without being blocked by admin-only restrictions.
