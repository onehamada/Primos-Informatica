# Copilot instructions for this repository

This repository contains a static ecommerce storefront for Primos Informatica. The site is primarily authored in vanilla HTML, CSS, and JavaScript, with product data stored in JSON and CSV files and Firebase integration handled by Node.js scripts.

## Project goals

- Preserve the existing static site structure and user experience.
- Prefer small, targeted changes over broad rewrites.
- Keep catalog content, product pages, and UI behavior consistent with the current implementation.

## Key files and locations

- Root HTML pages such as [index.html](../index.html), [produtos.html](../produtos.html), [admin.html](../admin.html), and [auth.html](../auth.html)
- Shared styling in [css/styles.css](../css/styles.css)
- Storefront logic in [js/script.js](../js/script.js) and supporting scripts in [js/](../js/)
- Product catalog data in [data/products.json](../data/products.json) and related CSV files in [data/](../data/)
- Firebase sync scripts in [sync-products-to-firestore.js](../sync-products-to-firestore.js) and [sync-products-rest.js](../sync-products-rest.js)

## Working conventions

- Favor edits that match the existing structure and naming conventions.
- Keep Portuguese copy consistent with the current tone and terminology used on the site.
- For content changes, prefer updating the relevant HTML file or the product data file rather than introducing new abstractions.
- For styling changes, prefer the shared stylesheet and avoid scattering inline CSS.
- For behavior changes, update the appropriate JavaScript file rather than duplicating logic.
- Preserve accessibility, mobile responsiveness, and static deployment compatibility.

## Validation

- The site can be served locally with `python -m http.server 8000` from the repository root.
- Verify the affected page or workflow in a browser after making changes.
- If product data changes are involved, confirm that the affected catalog view renders correctly.
