/*
 * Authenticated Turkish-to-English translation for the Decap admin panel.
 *
 * Set DEEPL_AUTH_KEY in Netlify environment variables. The key stays on the
 * server and is never exposed to the browser. DeepL Free keys automatically
 * use api-free.deepl.com; paid keys use api.deepl.com.
 */

const MAX_TEXTS = 50;
const MAX_TEXT_LENGTH = 5000;
const MAX_TOTAL_LENGTH = 30000;
const PROVIDER_TIMEOUT_MS = 12000;

function json(statusCode, payload, extraHeaders) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    },
    body: JSON.stringify(payload)
  };
}

function parseBody(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch (error) {
    return null;
  }
}

function normalizeTexts(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_TEXTS) return null;
  if (value.some((item) => typeof item !== "string")) return null;

  const texts = value.map((item) => item.trim());
  if (texts.some((item) => !item || item.length > MAX_TEXT_LENGTH)) return null;
  if (texts.reduce((total, item) => total + item.length, 0) > MAX_TOTAL_LENGTH) return null;
  return texts;
}

function isAuthenticated(context) {
  if (context && context.clientContext && context.clientContext.user && context.clientContext.user.sub) return true;
  return process.env.NETLIFY_DEV === "true" && process.env.ALLOW_LOCAL_TRANSLATION === "true";
}

function deepLUrl(authKey) {
  const host = authKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  return `https://${host}/v2/translate`;
}

exports.handler = async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" }, { Allow: "POST" });
  }

  if (!isAuthenticated(context)) {
    return json(401, { ok: false, error: "Admin authentication required" });
  }

  const authKey = String(process.env.DEEPL_AUTH_KEY || "").trim();
  if (!authKey) {
    return json(503, {
      ok: false,
      code: "translation_not_configured",
      error: "DEEPL_AUTH_KEY is not configured"
    });
  }

  const body = parseBody(event);
  const texts = body && normalizeTexts(body.texts);
  if (!texts) {
    return json(422, { ok: false, error: "Provide 1-50 non-empty texts within size limits" });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(deepLUrl(authKey), {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${authKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: texts,
          source_lang: "TR",
          target_lang: "EN-US",
          preserve_formatting: true
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const result = await response.json().catch(() => ({}));
    const validTranslations = Array.isArray(result.translations) &&
      result.translations.length === texts.length &&
      result.translations.every((item) => item && typeof item.text === "string");
    if (!response.ok || !validTranslations) {
      return json(502, {
        ok: false,
        error: "Translation provider request failed",
        providerStatus: response.status
      });
    }

    return json(200, {
      ok: true,
      translations: result.translations.map((item) => item.text)
    });
  } catch (error) {
    return json(502, { ok: false, error: "Translation provider is temporarily unavailable" });
  }
};
