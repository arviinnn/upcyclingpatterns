<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
        version="1.0"
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
    <xsl:output method="html" encoding="UTF-8" indent="yes" />

    <xsl:template match="/">
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="robots" content="noindex, follow" />
                <title>XML Sitemap — Upcycling Patterns</title>
                <style>
                    :root {
                    --primary: #2f7a43;
                    --primary-light: #57b26c;
                    --accent: #b8ff7a;
                    --text: #0f1b14;
                    --soft: #5a6b60;
                    --bg-1: #f8fcf8;
                    --bg-2: #eef6ef;
                    --border: rgba(47, 122, 67, 0.14);
                    }

                    @media (prefers-color-scheme: dark) {
                    :root {
                    --text: #f0f7f1;
                    --soft: #b8c5bb;
                    --bg-1: #0a120d;
                    --bg-2: #0f1912;
                    --border: rgba(184, 255, 122, 0.14);
                    }
                    }

                    * { box-sizing: border-box; }

                    body {
                    margin: 0;
                    padding: 40px 20px 60px;
                    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    color: var(--text);
                    background:
                    radial-gradient(circle at 20% 20%, rgba(87, 178, 108, 0.14), transparent 30%),
                    linear-gradient(180deg, var(--bg-1), var(--bg-2));
                    line-height: 1.6;
                    }

                    .wrap {
                    width: min(100%, 1100px);
                    margin: 0 auto;
                    }

                    header {
                    margin-bottom: 28px;
                    }

                    h1 {
                    margin: 0 0 6px;
                    font-size: clamp(1.8rem, 4vw, 2.6rem);
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    }

                    .subtitle {
                    color: var(--soft);
                    font-size: 0.98rem;
                    }

                    .meta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                    padding: 6px 14px;
                    border-radius: 999px;
                    background: rgba(87, 178, 108, 0.10);
                    border: 1px solid var(--border);
                    font-size: 0.85rem;
                    color: var(--primary);
                    font-weight: 700;
                    }

                    .table-card {
                    border: 1px solid var(--border);
                    border-radius: 22px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    }

                    @media (prefers-color-scheme: dark) {
                    .table-card { background: rgba(20, 32, 24, 0.5); }
                    }

                    table {
                    width: 100%;
                    border-collapse: collapse;
                    }

                    th, td {
                    padding: 14px 18px;
                    text-align: left;
                    border-bottom: 1px solid var(--border);
                    font-size: 0.92rem;
                    }

                    th {
                    background: rgba(87, 178, 108, 0.10);
                    color: var(--primary);
                    font-weight: 800;
                    font-size: 0.78rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    }

                    tr:last-child td {
                    border-bottom: none;
                    }

                    td a {
                    color: var(--primary);
                    font-weight: 700;
                    text-decoration: none;
                    word-break: break-word;
                    }

                    td a:hover { text-decoration: underline; }

                    .priority {
                    font-variant-numeric: tabular-nums;
                    color: var(--soft);
                    }

                    .freq {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 999px;
                    background: rgba(87, 178, 108, 0.10);
                    color: var(--primary);
                    font-size: 0.78rem;
                    font-weight: 700;
                    text-transform: lowercase;
                    }

                    footer {
                    margin-top: 26px;
                    color: var(--soft);
                    font-size: 0.85rem;
                    }

                    footer a {
                    color: var(--primary);
                    font-weight: 700;
                    }

                    @media (max-width: 600px) {
                    th:nth-child(3),
                    td:nth-child(3) { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="wrap">
                    <header>
                        <h1>XML Sitemap</h1>
                        <p class="subtitle">Upcycling Patterns · Erasmus+ KA210-SCH Project</p>
                        <div class="meta">
                            <xsl:value-of select="count(sitemap:urlset/sitemap:url)" />
                            <span>URLs indexed</span>
                        </div>
                    </header>

                    <div class="table-card">
                        <table>
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th>Last Modified</th>
                                    <th>Change Frequency</th>
                                    <th>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="sitemap:urlset/sitemap:url">
                                    <tr>
                                        <td>
                                            <a href="{sitemap:loc}">
                                                <xsl:value-of select="sitemap:loc" />
                                            </a>
                                        </td>
                                        <td><xsl:value-of select="sitemap:lastmod" /></td>
                                        <td><span class="freq"><xsl:value-of select="sitemap:changefreq" /></span></td>
                                        <td class="priority"><xsl:value-of select="sitemap:priority" /></td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </div>

                    <footer>
                        <p>This is an XML sitemap meant for search engines. Visit the <a href="/">homepage</a> for the website itself.</p>
                    </footer>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>