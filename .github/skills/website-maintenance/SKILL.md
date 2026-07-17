---
name: website-maintenance
description: Use this skill when updating the Primos Informatica storefront, product pages, styles, content, or Firebase sync workflows. It provides repo-specific guidance for editing the static HTML/CSS/JS site and validating changes safely.
argument-hint: "[task] [scope]"
---

# Website maintenance skill

Use this skill when working on the Primos Informatica ecommerce site. It is tailored for this repository's structure: a mostly static storefront with vanilla HTML, CSS, and JavaScript, plus product data files and Firebase-related scripts.

## When to use this skill

Use it for tasks such as:

- updating homepage or category pages
- editing product content, prices, or descriptions
- changing visual styles in the shared stylesheet
- adjusting JavaScript behavior in the storefront
- syncing product data with Firebase or Firestore
- reviewing whether a change should be made in HTML, data files, or scripts

## Repository context

The main entry points are:

- [index.html](../../index.html) for the home page
- [produtos.html](../../produtos.html) for the products listing
- [admin.html](../../admin.html) and [auth.html](../../auth.html) for admin-related pages
- [css/styles.css](../../css/styles.css) for shared styling
- [js/script.js](../../js/script.js) for storefront behavior
- [data/products.json](../../data/products.json) as the main product dataset
- [sync-products-to-firestore.js](../../sync-products-to-firestore.js) and [sync-products-rest.js](../../sync-products-rest.js) for product synchronization

## Working approach

1. Identify the affected surface first.
   - Content changes often belong in HTML files or in the product data files.
   - Visual changes usually belong in [css/styles.css](../../css/styles.css).
   - Behavior changes usually belong in [js/script.js](../../js/script.js) or other scripts in [js/](../../js/).

2. Prefer the smallest change that solves the problem.
   - Keep the site static and vanilla unless a change clearly requires a new dependency.
   - Preserve existing page structure and naming conventions.
   - Avoid introducing build tooling or a framework unless the task explicitly requires it.

3. Keep product data consistent.
   - Prefer updating [data/products.json](../../data/products.json) for product catalog changes.
   - If you edit CSV sources, keep the backup file intact and avoid overwriting the original data unless requested.
   - If a change affects Firebase, use the existing sync scripts rather than creating a parallel workflow.

4. Validate changes locally before finishing.
   - Serve the project locally with `python -m http.server 8000` from the repository root.
   - Open the site in the browser and verify the affected page or feature.
   - For data changes, confirm that the relevant page renders the updated content correctly.

## Important conventions

- Preserve accessibility and responsive behavior.
- Keep Portuguese content consistent with the existing site tone.
- Do not remove or rename files casually; many pages and scripts rely on the current structure.
- When editing product data, keep field names and expected values consistent with the current JSON schema.
- Avoid hardcoding values that should come from data or shared configuration.

## Example tasks

- Add or edit a product entry in [data/products.json](../../data/products.json).
- Update a static page copy in [index.html](../../index.html) or [produtos.html](../../produtos.html).
- Refine styling in [css/styles.css](../../css/styles.css).
- Adjust storefront behavior in [js/script.js](../../js/script.js).
- Sync product data with Firebase by running the appropriate script from the repository root.
