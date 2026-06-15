const assert = require("node:assert/strict");
const test = require("node:test");
const { chromium } = require("playwright");
const { launchBrowser, startStaticServer } = require("./helpers/static-server");

test("homepage has basic accessible structure", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    await page.addInitScript(() => {
      localStorage.setItem("cookieConsentDismissed", "true");
      localStorage.setItem("siteTheme", "light");
    });

    await page.goto(`${server.baseUrl}/`, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cms-status") === "loaded");

    const result = await page.evaluate(() => {
      const problems = [];

      const title = document.title.trim();
      if (!title) problems.push("Document title is missing.");

      const lang = document.documentElement.getAttribute("lang");
      if (!lang) problems.push("HTML lang attribute is missing.");

      const h1Count = document.querySelectorAll("h1").length;
      if (h1Count !== 1) problems.push(`Expected exactly one h1, found ${h1Count}.`);

      for (const image of document.querySelectorAll("img")) {
        const isDecorative = image.getAttribute("aria-hidden") === "true" || image.getAttribute("role") === "presentation";
        const alt = image.getAttribute("alt");
        if (!isDecorative && alt === null) {
          problems.push(`Image without alt: ${image.getAttribute("src") || "unknown src"}`);
        }
      }

      for (const control of document.querySelectorAll("button, a[href]")) {
        const label = (control.getAttribute("aria-label") || control.textContent || "").trim();
        if (!label) {
          problems.push(`Interactive element has no accessible name: ${control.outerHTML.slice(0, 120)}`);
        }
      }

      for (const input of document.querySelectorAll("input:not([type='hidden']), textarea, select")) {
        const id = input.getAttribute("id");
        const hasLabel = Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
        const hasAria = Boolean(input.getAttribute("aria-label") || input.getAttribute("aria-labelledby"));
        if (!hasLabel && !hasAria) {
          problems.push(`Form field has no label: ${input.getAttribute("name") || input.tagName}`);
        }
      }

      const overflowX = Math.max(
        0,
        document.documentElement.scrollWidth - window.innerWidth,
        document.body.scrollWidth - window.innerWidth
      );
      if (overflowX > 1) problems.push(`Horizontal overflow detected: ${overflowX}px.`);

      return problems;
    });

    assert.deepEqual(result, []);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("mobile hero and footer stay compact without country hotspot controls", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    await page.addInitScript(() => {
      localStorage.setItem("cookieConsentDismissed", "true");
      localStorage.setItem("siteTheme", "light");
    });

    await page.goto(`${server.baseUrl}/`, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cms-status") === "loaded");

    const result = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      const heroRect = document.querySelector(".hero-section").getBoundingClientRect();
      const footerRect = document.querySelector(".site-footer").getBoundingClientRect();
      const partnerLogos = Array.from(document.querySelectorAll(".footer-partners-section .partner-logo"));
      const officialLogos = Array.from(document.querySelectorAll(".footer-logos-section .official-logo"));
      const heroBackdrop = document.querySelector(".hero-backdrop");
      const footerLegalPanel = document.getElementById("footerLegalPanel");
      const footerLegalToggle = document.getElementById("footerLegalToggle");

      const loader = document.getElementById("pageLoader");

      return {
        journeySectionCount: document.querySelectorAll(".journey-section").length,
        aboutCardCount: document.querySelectorAll(".about-grid .info-card").length,
        footerContactCount: document.querySelectorAll(".site-footer .footer-contact").length,
        footerTransitionCount: document.querySelectorAll(".footer-transition-card").length,
        footerLegalInitiallyHidden: footerLegalPanel ? footerLegalPanel.hidden : false,
        footerLegalExpanded: footerLegalToggle ? footerLegalToggle.getAttribute("aria-expanded") : "",
        explorePanelCounts: Array.from(document.querySelectorAll("#explore .tab-panel")).map((panel) => panel.querySelectorAll(".highlight-item, .timeline-card, .project-card").length),
        hotspotCount: document.querySelectorAll(".country-hotspot").length,
        loaderVisible: loader ? getComputedStyle(loader).display !== "none" : false,
        documentHeight: document.documentElement.scrollHeight,
        heroHeight: heroRect.height,
        heroObjectPosition: heroBackdrop ? getComputedStyle(heroBackdrop).objectPosition : "",
        footerHeight: footerRect.height,
        partnerGrid: getComputedStyle(document.querySelector(".footer-partners-section .partner-logos")).gridTemplateColumns,
        officialGrid: getComputedStyle(document.querySelector(".footer-logos-section .official-logos")).gridTemplateColumns,
        partnerLogoHeights: partnerLogos.map((logo) => Math.round(logo.getBoundingClientRect().height)),
        officialLogoHeights: officialLogos.map((logo) => Math.round(logo.getBoundingClientRect().height)),
        footerOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
      };
    });

    const darkResult = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      const footerRect = document.querySelector(".site-footer").getBoundingClientRect();
      const partnerLogos = Array.from(document.querySelectorAll(".footer-partners-section .partner-logo"));
      const officialLogos = Array.from(document.querySelectorAll(".footer-logos-section .official-logo"));
      const firstLogo = document.querySelector(".site-footer .footer-logo");

      return {
        footerHeight: footerRect.height,
        documentHeight: document.documentElement.scrollHeight,
        firstLogoBackground: firstLogo ? getComputedStyle(firstLogo).backgroundColor : "",
        partnerGrid: getComputedStyle(document.querySelector(".footer-partners-section .partner-logos")).gridTemplateColumns,
        officialGrid: getComputedStyle(document.querySelector(".footer-logos-section .official-logos")).gridTemplateColumns,
        partnerLogoHeights: partnerLogos.map((logo) => Math.round(logo.getBoundingClientRect().height)),
        officialLogoHeights: officialLogos.map((logo) => Math.round(logo.getBoundingClientRect().height)),
        footerOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
      };
    });

    const legalOpenResult = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      const toggle = document.getElementById("footerLegalToggle");
      const panel = document.getElementById("footerLegalPanel");
      if (toggle) toggle.click();
      const list = document.querySelector(".footer-legal-list");
      return {
        hidden: panel ? panel.hidden : true,
        expanded: toggle ? toggle.getAttribute("aria-expanded") : "",
        linkCount: document.querySelectorAll(".footer-legal-list a").length,
        gridColumns: list ? getComputedStyle(list).gridTemplateColumns : ""
      };
    });

    await page.click("#menuToggle");
    const mobileMenuResult = await page.evaluate(() => ({
      expanded: document.getElementById("menuToggle").getAttribute("aria-expanded"),
      open: document.getElementById("navMenu").classList.contains("open"),
      bodyOverflow: document.body.style.overflow
    }));
    await page.click("#menuToggle");

    assert.equal(result.journeySectionCount, 0, "Learning Journey section should be removed from the homepage.");
    assert.equal(result.aboutCardCount, 0, "Removed About cards should not be rendered again from CMS data.");
    assert.equal(result.footerContactCount, 0, "Footer coordinator/country/email block should be removed.");
    assert.equal(result.footerTransitionCount, 1, "Project identity transition should sit between EU disclaimer and footer.");
    assert.equal(result.footerLegalInitiallyHidden, true, "Footer legal links should start closed.");
    assert.equal(result.footerLegalExpanded, "false", "Footer legal toggle should start collapsed.");
    assert.ok(
      result.explorePanelCounts.every((count) => count <= 4),
      `Explore panels should render at most four cards, got ${result.explorePanelCounts.join(", ")}.`
    );
    assert.equal(result.hotspotCount, 0, "Hero country hotspot buttons should not be rendered.");
    assert.equal(result.loaderVisible, false, "Opening hero should be visible without a blocking loader.");
    assert.ok(result.heroHeight >= 800, `Mobile hero should fill the first viewport, got ${result.heroHeight}px.`);
    assert.equal(result.heroObjectPosition, "88% 50%", `Mobile hero map should focus the partner flags, got ${result.heroObjectPosition}.`);
    assert.ok(result.documentHeight < 9800, `Mobile page is too long: ${result.documentHeight}px.`);
    assert.ok(result.footerHeight < 430, `Mobile footer is too tall: ${result.footerHeight}px.`);
    assert.ok(
      result.partnerGrid.split(" ").length >= 4,
      `Partner logos should stay in a compact four-column mobile grid, got ${result.partnerGrid}.`
    );
    assert.ok(
      result.officialGrid.split(" ").length >= 4,
      `Official logos should stay in a compact four-column mobile grid, got ${result.officialGrid}.`
    );
    assert.ok(
      result.partnerLogoHeights.every((height) => height >= 29 && height <= 31),
      `Partner logos should use one compact mobile size, got ${result.partnerLogoHeights.join(", ")}.`
    );
    assert.equal(
      new Set(result.partnerLogoHeights).size,
      1,
      `Partner logo heights should match, got ${result.partnerLogoHeights.join(", ")}.`
    );
    assert.ok(
      result.officialLogoHeights.every((height) => height >= 29 && height <= 31),
      `Official logos should use one compact mobile size, got ${result.officialLogoHeights.join(", ")}.`
    );
    assert.ok(
      new Set(result.officialLogoHeights).size <= 2,
      `Official logo heights should be visually consistent, got ${result.officialLogoHeights.join(", ")}.`
    );
    assert.equal(result.footerOverflow, 0, "Footer should not create horizontal overflow.");
    assert.equal(legalOpenResult.hidden, false, "Footer legal drawer should open when the Legal button is clicked.");
    assert.equal(legalOpenResult.expanded, "true", "Footer legal toggle should update aria-expanded when opened.");
    assert.equal(legalOpenResult.linkCount, 6, "Footer legal drawer should contain six links.");
    assert.ok(
      legalOpenResult.gridColumns.split(" ").length >= 3,
      `Footer legal drawer should use a compact grid on mobile, got ${legalOpenResult.gridColumns}.`
    );
    assert.deepEqual(
      mobileMenuResult,
      { expanded: "true", open: true, bodyOverflow: "hidden" },
      "The mobile navigation should open accessibly and lock page scrolling."
    );

    assert.ok(darkResult.documentHeight < 9800, `Dark-mode mobile page is too long: ${darkResult.documentHeight}px.`);
    assert.ok(darkResult.footerHeight < 430, `Dark-mode mobile footer is too tall: ${darkResult.footerHeight}px.`);
    assert.equal(darkResult.firstLogoBackground, "rgb(2, 6, 4)", `Dark-mode footer logo background should be black, got ${darkResult.firstLogoBackground}.`);
    assert.ok(
      darkResult.partnerGrid.split(" ").length >= 4,
      `Dark-mode partner logos should stay in a compact four-column grid, got ${darkResult.partnerGrid}.`
    );
    assert.ok(
      darkResult.officialGrid.split(" ").length >= 4,
      `Dark-mode official logos should stay in a compact four-column grid, got ${darkResult.officialGrid}.`
    );
    assert.ok(
      darkResult.partnerLogoHeights.every((height) => height >= 29 && height <= 31),
      `Dark-mode partner logos should stay compact, got ${darkResult.partnerLogoHeights.join(", ")}.`
    );
    assert.equal(
      new Set(darkResult.partnerLogoHeights).size,
      1,
      `Dark-mode partner logo heights should match, got ${darkResult.partnerLogoHeights.join(", ")}.`
    );
    assert.ok(
      darkResult.officialLogoHeights.every((height) => height >= 29 && height <= 31),
      `Dark-mode official logos should stay compact, got ${darkResult.officialLogoHeights.join(", ")}.`
    );
    assert.equal(darkResult.footerOverflow, 0, "Dark-mode footer should not create horizontal overflow.");
  } finally {
    await browser.close();
    await server.close();
  }
});

test("desktop explore panels stay ordered in balanced two-column grids", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    await page.addInitScript(() => {
      localStorage.setItem("cookieConsentDismissed", "true");
      localStorage.setItem("siteTheme", "light");
    });

    await page.goto(`${server.baseUrl}/`, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cms-status") === "loaded");

    const fixedLayerState = await page.evaluate(() => ({
      cookieZIndex: Number.parseInt(getComputedStyle(document.getElementById("cookieBanner")).zIndex, 10),
      backToTopZIndex: Number.parseInt(getComputedStyle(document.getElementById("backToTop")).zIndex, 10),
      honeypotHidden: document.getElementById("websiteField").hidden
    }));
    assert.ok(
      fixedLayerState.cookieZIndex > fixedLayerState.backToTopZIndex,
      "The back-to-top control must not cover cookie-banner actions."
    );
    assert.equal(fixedLayerState.honeypotHidden, true, "The spam honeypot must stay out of the accessibility tree.");

    const tabs = [
      { tab: "goals", selector: "#panel-goals .highlights-grid", shouldUseNumbers: true },
      { tab: "timeline", selector: "#panel-timeline .timeline-grid", shouldUseNumbers: true },
      { tab: "activities", selector: "#panel-activities .project-layout", shouldUseNumbers: false },
      { tab: "results", selector: "#panel-results .highlights-grid", shouldUseNumbers: true },
      { tab: "details", selector: "#panel-details .project-layout", shouldUseNumbers: false }
    ];

    const result = [];
    for (const item of tabs) {
      await page.click(`#tab-${item.tab}`);
      await page.waitForTimeout(50);
      result.push(await page.evaluate((config) => {
        const grid = document.querySelector(config.selector);
        const items = Array.from(grid.querySelectorAll(".highlight-item, .timeline-card, .project-card"));
        const numbers = items.map((card) => {
          const number = card.querySelector(".card-num, .timeline-step, .activity-icon, .detail-icon");
          return number ? number.textContent.trim() : "";
        });
        return {
          selector: config.selector,
          shouldUseNumbers: config.shouldUseNumbers,
          count: items.length,
          numbers,
          columns: getComputedStyle(grid).gridTemplateColumns
        };
      }, item));
    }

    for (const panel of result) {
      assert.equal(panel.count, 4, `${panel.selector} should render four cards.`);
      if (panel.shouldUseNumbers) {
        assert.deepEqual(panel.numbers, ["01", "02", "03", "04"], `${panel.selector} should keep 01-04 ordering.`);
      }
      assert.equal(panel.columns.split(" ").length, 2, `${panel.selector} should use a desktop 2x2 grid.`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
});
