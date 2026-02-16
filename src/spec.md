# Specification

## Summary
**Goal:** Make PDF export work reliably by bundling and consistently loading jsPDF and the autoTable plugin within the app, eliminating “PDF export library is not loaded” errors.

**Planned changes:**
- Replace reliance on global CDN-loaded `window.jspdf` with app-bundled imports/loading for jsPDF and autoTable in the PDF export implementation.
- Ensure there is a single, consistent source of truth for PDF library loading (avoid double-loading/mixed paths) so jsPDF and autoTable are always initialized together.
- Add a clear user-facing error message when PDF export cannot be initialized (e.g., library load/init failure), instructing the user to try again.

**User-visible outcome:** From both the Quote Summary screen and the Analysis tab, clicking “Export PDF” downloads a PDF without the “PDF export library is not loaded” error, and if initialization fails the user sees a clear English message.
