# Specification

## Summary
**Goal:** Ensure every orçamento PDF/printout always includes an appended A4 “CONDIÇÕES GERAIS DE VENDA E GARANTIA …” terms page, without changing the existing orçamento layout.

**Planned changes:**
- Update the orçamento print/PDF HTML generation to always append a new A4 page after the existing orçamento page containing the user-provided Portuguese terms text verbatim, preserving line breaks/bullets as much as possible.
- Ensure deterministic page ordering when an additional image page (imagemAdicional) exists: orçamento page first, then the terms page, then the imagemAdicional page.

**User-visible outcome:** Printing or generating any orçamento always produces at least 2 pages (or 3 when imagemAdicional is present): the original orçamento page unchanged, followed by the mandatory terms page (and then the additional image page if used).
