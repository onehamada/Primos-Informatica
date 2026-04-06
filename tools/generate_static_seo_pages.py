from __future__ import annotations

import html
import json
import re
import shutil
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import quote


STORE_ORIGIN = "https://primos-informatica-ecommerce.web.app"
DEFAULT_TITLE = "Primos Informatica | Loja de Hardware, PCs e Acessorios em Brasilia"
DEFAULT_DESCRIPTION = (
    "Primos Informatica: Loja de hardware, PCs, notebooks e acessorios em Brasilia. "
    "Processadores, placas mae, SSDs e mais com entrega rapida. Confira nossas ofertas!"
)
INSTITUTIONAL_PAGES = [
    "faq.html",
    "garantia.html",
    "politica-devolucao.html",
    "termos-de-uso.html",
    "politica-privacidade.html",
]
CATEGORY_LABELS = {
    "acessorios": "Acessorios",
    "acessorios-com-acento": "Acessorios",
    "adaptadores": "Adaptadores",
    "audio": "Audio",
    "cabos": "Cabos",
    "cooler": "Coolers",
    "energia": "Energia",
    "fonte": "Fontes",
    "gabinetes": "Gabinetes",
    "hd externo": "HD Externo",
    "hd interno": "HD Interno",
    "kit-teclado-mouse": "Kits",
    "memoria": "Memorias",
    "monitor": "Monitores",
    "mouse": "Mouses",
    "notebook": "Notebooks",
    "placa de video": "Placas de Video",
    "placa mae": "Placas Mae",
    "processador": "Processadores",
    "redes": "Redes",
    "ssd": "SSDs",
    "switch": "Switches",
    "teclado": "Teclados",
    "webcam": "Webcams",
}
PRERENDER_STYLE = """
<style data-route-prerender>
  body.route-prerendered #inicio,
  body.route-prerendered #promo,
  body.route-prerendered .category,
  body.route-prerendered .products-section,
  body.route-prerendered #catalogResultsSection {
    display: none !important;
  }

  .route-prerender {
    max-width: 1200px;
    margin: 0 auto;
    padding: 48px 16px 24px;
  }

  .route-prerender-shell {
    background: linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 24px;
    box-shadow: 0 22px 48px rgba(15, 23, 42, 0.08);
    padding: 32px 28px;
  }

  .route-prerender-kicker {
    margin: 0 0 12px;
    color: #0f5b86;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .route-prerender h1 {
    margin: 0 0 12px;
    color: #0f172a;
    font-size: clamp(28px, 5vw, 42px);
    line-height: 1.1;
  }

  .route-prerender p {
    margin: 0;
    color: #475569;
    line-height: 1.7;
    max-width: 760px;
  }
</style>
""".strip()


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def normalize_category_name(category: str) -> str:
    normalized = str(category or "").strip()
    if not normalized:
        return ""

    search_key = re.sub(r"[^a-z0-9]+", " ", ascii_normalize(normalized).lower()).strip()
    if search_key == "bateria":
        return "energia"

    normalized_map = {
        "acessorios": "acessorios",
        "acess rios": "acessorios",
        "audio": "audio",
        "gabinete": "gabinetes",
        "hd externo": "hd externo",
        "hd interno": "hd interno",
        "kit teclado mouse": "kit-teclado-mouse",
        "memoria": "memoria",
        "mem ria": "memoria",
        "monitor": "monitor",
        "mouse": "mouse",
        "notebook": "notebook",
        "placa de video": "placa de video",
        "placa de v deo": "placa de video",
        "placa mae": "placa mae",
        "placa m e": "placa mae",
        "placa ma e": "placa mae",
        "processador": "processador",
        "redes": "redes",
        "ssd": "ssd",
        "switch": "switch",
        "teclado": "teclado",
        "webcam": "webcam",
    }

    return normalized_map.get(search_key, normalized.lower())


def ascii_normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def generate_slug(value: str) -> str:
    slug = ascii_normalize(value).lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-")


def category_route_segment(category: str) -> str:
    return quote(normalize_category_name(category), safe="")


def build_store_url(pathname: str) -> str:
    return f"{STORE_ORIGIN}{pathname if pathname.startswith('/') else f'/{pathname}'}"


def format_currency(value: float | int | str) -> str:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        numeric = 0.0
    inteiro, decimal = f"{numeric:.2f}".split(".")
    groups = []
    while inteiro:
        groups.append(inteiro[-3:])
        inteiro = inteiro[:-3]
    return f"R$ {'.'.join(reversed(groups))},{decimal}"


def format_category_label(category: str) -> str:
    normalized = normalize_category_name(category)
    ascii_category = ascii_normalize(normalized).lower()
    if ascii_category in CATEGORY_LABELS:
        return CATEGORY_LABELS[ascii_category]
    return " ".join(word.capitalize() for word in normalized.split())


def truncate_text(value: str, limit: int = 160) -> str:
    clean = re.sub(r"\s+", " ", str(value or "").strip())
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "..."


def get_product_image_url(product: dict) -> str:
    image_name = str(product.get("imagem") or "placeholder.webp").strip()
    return build_store_url(f"/images/products/thumbnail/{image_name}")


def update_tag_content(html_text: str, pattern: str, replacement: str) -> str:
    updated, count = re.subn(pattern, replacement, html_text, count=1, flags=re.IGNORECASE)
    if count == 0:
        raise RuntimeError(f"Tag not found for pattern: {pattern}")
    return updated


def apply_seo_state(html_text: str, state: dict) -> str:
    html_text = update_tag_content(
        html_text,
        r"<title>.*?</title>",
        f"<title>{html.escape(state['title'])}</title>",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta name="description" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['description'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta property="og:title" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['og_title'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta property="og:description" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['og_description'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta property="og:url" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['canonical'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta property="og:image" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['og_image'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<link rel="canonical" href=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['canonical'], quote=True)}\2",
    )
    html_text = update_tag_content(
        html_text,
        r'(<meta property="og:type" content=")[^"]*(".*?>)',
        rf"\g<1>{html.escape(state['og_type'], quote=True)}\2",
    )
    return html_text


def inject_prerender_shell(html_text: str, heading: str, description: str) -> str:
    html_text = html_text.replace(
        '<body class="needs-firebase">',
        '<body class="needs-firebase route-prerendered">',
        1,
    )
    html_text = html_text.replace("</head>", f"{PRERENDER_STYLE}\n</head>", 1)
    shell = f"""
<section class="route-prerender" data-route-prerender>
  <div class="route-prerender-shell">
    <p class="route-prerender-kicker">Catalogo Primos Informatica</p>
    <h1>{html.escape(heading)}</h1>
    <p>{html.escape(description)}</p>
  </div>
</section>
""".strip()
    return html_text.replace("<main>", f"{shell}\n\n<main>", 1)


def downgrade_home_hero_heading(html_text: str) -> str:
    return html_text.replace(
        "<h1>Seu setup pronto para comprar com mais seguranca e menos atrito</h1>",
        "<h2>Seu setup pronto para comprar com mais seguranca e menos atrito</h2>",
        1,
    )


def inject_product_schema(html_text: str, product: dict, canonical: str) -> str:
    availability = "https://schema.org/InStock" if float(product.get("qt") or 0) > 0 else "https://schema.org/OutOfStock"
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.get("nome", "Produto"),
        "description": product.get("descricao", product.get("nome", "Produto")),
        "sku": str(product.get("codigo", "")),
        "brand": {
            "@type": "Brand",
            "name": product.get("marca", "Primos Informatica"),
        },
        "image": [get_product_image_url(product)],
        "url": canonical,
        "offers": {
            "@type": "Offer",
            "priceCurrency": "BRL",
            "price": float(product.get("preco") or 0),
            "availability": availability,
            "url": canonical,
        },
    }
    script = (
        '<script type="application/ld+json" data-route-prerender>'
        + json.dumps(schema, ensure_ascii=False)
        + "</script>"
    )
    return html_text.replace("</head>", f"{script}\n</head>", 1)


def build_category_state(category: str) -> dict:
    if category in {"promo", "promocoes"}:
        canonical = build_store_url("/produtos")
        return {
            "title": "Promocoes em hardware e perifericos | Primos Informatica",
            "description": truncate_text(
                "Veja as promocoes em hardware, monitores, fontes, notebooks e acessorios da "
                "Primos Informatica com retirada em Brasilia e atendimento comercial rapido."
            ),
            "canonical": canonical,
            "og_title": "Promocoes em hardware | Primos Informatica",
            "og_description": truncate_text(
                "Promocoes em hardware, upgrades, monitores, fontes e perifericos com retirada em Brasilia."
            ),
            "og_image": build_store_url("/images/logo.png"),
            "og_type": "website",
            "heading": "Promocoes em hardware e perifericos",
            "shell_description": "Confira as ofertas atuais da loja com estoque local, retirada rapida e atendimento comercial pelo WhatsApp.",
        }

    label = format_category_label(category)
    path = f"/categoria/{category_route_segment(category)}"
    canonical = build_store_url(path)
    return {
        "title": f"{label} | Catalogo Primos Informatica em Brasilia",
        "description": truncate_text(
            f"Compre {label.lower()} com retirada na loja em Brasilia, envio para todo o Brasil e atendimento consultivo da Primos Informatica."
        ),
        "canonical": canonical,
        "og_title": f"{label} | Primos Informatica",
        "og_description": truncate_text(
            f"Explore a categoria {label.lower()} da Primos Informatica com estoque local e atendimento especializado."
        ),
        "og_image": build_store_url("/images/logo.png"),
        "og_type": "website",
        "heading": f"{label} em Brasilia",
        "shell_description": f"Veja os produtos da categoria {label.lower()} com estoque local, retirada na loja e suporte da equipe Primos Informatica.",
    }


def build_product_state(product: dict) -> dict:
    slug = generate_slug(product.get("nome", "produto"))
    canonical = build_store_url(f"/produto/{slug}")
    price_label = format_currency(product.get("preco") or 0)
    name = str(product.get("nome") or "Produto").strip()
    description = str(product.get("descricao") or "").strip()
    meta_description = (
        f"{description} | Comprar {name} por {price_label} na Primos Informatica em Brasilia. Entrega rapida."
        if description
        else f"Comprar {name} por {price_label} na Primos Informatica em Brasilia."
    )
    return {
        "title": f"{name} | Comprar por {price_label} | Primos Informatica",
        "description": truncate_text(meta_description),
        "canonical": canonical,
        "og_title": f"{name} | Primos Informatica",
        "og_description": truncate_text(description or f"{name} na Primos Informatica"),
        "og_image": get_product_image_url(product),
        "og_type": "product",
        "heading": name,
        "shell_description": truncate_text(
            description or f"Confira detalhes, disponibilidade e condicoes comerciais para {name} na Primos Informatica."
        ),
    }


def build_page(template: str, seo_state: dict, *, add_product_schema_data: dict | None = None) -> str:
    page = apply_seo_state(template, seo_state)
    page = downgrade_home_hero_heading(page)
    page = inject_prerender_shell(page, seo_state["heading"], seo_state["shell_description"])
    if add_product_schema_data is not None:
        page = inject_product_schema(page, add_product_schema_data, seo_state["canonical"])
    return page


def ensure_clean_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    for child in path.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()


def write_sitemap(root: Path, categories: list[str], products: list[dict]) -> None:
    lastmod = date.today().isoformat()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    def add_url(pathname: str, priority: str, changefreq: str) -> None:
        lines.extend(
            [
                "  <url>",
                f"    <loc>{html.escape(build_store_url(pathname))}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                f"    <changefreq>{changefreq}</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
            ]
        )

    add_url("/", "1.0", "weekly")
    add_url("/produtos", "0.9", "weekly")

    for category in categories:
        add_url(f"/categoria/{category_route_segment(category)}", "0.8", "weekly")

    for product in products:
        slug = generate_slug(product.get("nome", "produto"))
        if slug:
            add_url(f"/produto/{slug}", "0.7", "monthly")

    for page in INSTITUTIONAL_PAGES:
        if (root / page).exists():
            add_url(f"/{page}", "0.5", "monthly")

    lines.append("</urlset>")
    (root / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    root = repo_root()
    template = (root / "index.html").read_text(encoding="utf-8")
    products = json.loads((root / "data" / "products.json").read_text(encoding="utf-8"))

    category_dir = root / "categoria"
    product_dir = root / "produto"
    ensure_clean_directory(category_dir)
    ensure_clean_directory(product_dir)

    raw_category_map: dict[str, set[str]] = {}
    for product in products:
        raw_category = str(product.get("categoria") or "").strip()
        normalized_category = normalize_category_name(raw_category)
        if not normalized_category or normalized_category == "fora de estoque":
            continue
        raw_category_map.setdefault(normalized_category, set()).add(raw_category)

    categories = sorted(raw_category_map.keys())

    promo_page = build_page(template, build_category_state("promo"))
    promo_dir = root / "produtos"
    ensure_clean_directory(promo_dir)
    (promo_dir / "index.html").write_text(promo_page, encoding="utf-8")
    (root / "produtos.html").write_text(promo_page, encoding="utf-8")

    for category in categories:
        state = build_category_state(category)
        category_page = build_page(template, state)
        canonical_dir = category_dir / category_route_segment(category)
        canonical_dir.mkdir(parents=True, exist_ok=True)
        (canonical_dir / "index.html").write_text(category_page, encoding="utf-8")

        for raw_category in sorted(raw_category_map.get(category, set())):
            raw_segment = quote(raw_category, safe="")
            canonical_segment = category_route_segment(category)
            if raw_segment and raw_segment != canonical_segment:
                alias_dir = category_dir / raw_segment
                alias_dir.mkdir(parents=True, exist_ok=True)
                (alias_dir / "index.html").write_text(category_page, encoding="utf-8")

    for product in products:
        slug = generate_slug(product.get("nome", "produto"))
        if not slug:
            continue
        state = build_product_state(product)
        product_page = build_page(template, state, add_product_schema_data=product)
        current_product_dir = product_dir / slug
        current_product_dir.mkdir(parents=True, exist_ok=True)
        (current_product_dir / "index.html").write_text(product_page, encoding="utf-8")

    write_sitemap(root, categories, products)

    print(f"Geradas {len(categories)} paginas de categoria.")
    print(f"Geradas {len(products)} paginas de produto.")
    print("Sitemap atualizado.")


if __name__ == "__main__":
    main()
