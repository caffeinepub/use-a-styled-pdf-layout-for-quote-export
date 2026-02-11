# Specification

## Summary
**Goal:** Update the Quote Summary “Export PDF” feature to generate a styled PDF that matches the on-screen Quote Summary layout and emphasizes the grand total.

**Planned changes:**
- Implement a styled client-side PDF export layout with clearly separated sections (title, project information, items table, and a highlighted/boxed grand total block) using consistent fonts, spacing, borders, and table styling.
- Ensure the PDF’s items table column order and headers match the on-screen Quote Summary table (Item Ref No, Category, Subcategory, Description, Standard Cost, Quantity, Duration, Total).
- Include the same quote header fields as the UI (Client Name, Project Name, Account Manager, Project Duration) plus a generated export date.
- Update the existing “Export PDF” action to use the styled export path and show a user-facing English error/toast if the PDF library (jsPDF/jspdf-autotable) is not available at runtime.

**User-visible outcome:** Users can click “Export PDF” on the Quote Summary screen to download a professionally styled PDF that mirrors the on-screen summary (including a clearly emphasized grand total), and they receive a clear error message if the PDF export library is not loaded.
