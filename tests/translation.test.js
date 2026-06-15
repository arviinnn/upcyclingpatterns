const assert = require("node:assert/strict");
const test = require("node:test");

const translateFunctionPath = require.resolve("../netlify/functions/translate.js");

function loadHandler() {
  delete require.cache[translateFunctionPath];
  return require(translateFunctionPath).handler;
}

test("translation function requires an authenticated admin", async () => {
  const handler = loadHandler();
  const response = await handler({ httpMethod: "POST", body: JSON.stringify({ texts: ["Merhaba"] }) }, {});

  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).ok, false);
});

test("translation function rejects non-string text entries", async () => {
  const previousKey = process.env.DEEPL_AUTH_KEY;
  process.env.DEEPL_AUTH_KEY = "test-key:fx";

  try {
    const handler = loadHandler();
    const response = await handler(
      { httpMethod: "POST", body: JSON.stringify({ texts: [{ text: "Merhaba" }] }) },
      { clientContext: { user: { sub: "editor" } } }
    );

    assert.equal(response.statusCode, 422);
  } finally {
    if (previousKey === undefined) delete process.env.DEEPL_AUTH_KEY;
    else process.env.DEEPL_AUTH_KEY = previousKey;
  }
});

test("translation function keeps the DeepL key server-side and returns English text", async () => {
  const previousKey = process.env.DEEPL_AUTH_KEY;
  const previousFetch = global.fetch;
  process.env.DEEPL_AUTH_KEY = "test-key:fx";

  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ translations: [{ text: "Hello" }, { text: "Project photo" }] })
    };
  };

  try {
    const handler = loadHandler();
    const response = await handler(
      { httpMethod: "POST", body: JSON.stringify({ texts: ["Merhaba", "Proje fotoğrafı"] }) },
      { clientContext: { user: { sub: "editor" } } }
    );
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(body.translations, ["Hello", "Project photo"]);
    assert.equal(request.url, "https://api-free.deepl.com/v2/translate");
    assert.equal(request.options.headers.Authorization, "DeepL-Auth-Key test-key:fx");
    assert.ok(request.options.signal instanceof AbortSignal);
    assert.doesNotMatch(response.body, /test-key/);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.DEEPL_AUTH_KEY;
    else process.env.DEEPL_AUTH_KEY = previousKey;
  }
});

test("translation function rejects incomplete provider responses", async () => {
  const previousKey = process.env.DEEPL_AUTH_KEY;
  const previousFetch = global.fetch;
  process.env.DEEPL_AUTH_KEY = "test-key:fx";
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ translations: [{ text: "Hello" }] })
  });

  try {
    const handler = loadHandler();
    const response = await handler(
      { httpMethod: "POST", body: JSON.stringify({ texts: ["Merhaba", "Proje"] }) },
      { clientContext: { user: { sub: "editor" } } }
    );

    assert.equal(response.statusCode, 502);
    assert.equal(JSON.parse(response.body).ok, false);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.DEEPL_AUTH_KEY;
    else process.env.DEEPL_AUTH_KEY = previousKey;
  }
});
