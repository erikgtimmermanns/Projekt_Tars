const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

const upstreamUrl = "https://seekampf.de/api/v1/stats/overview";
const nasaApodUrl = "https://science.nasa.gov/wp-json/wp/v2/apod-basic/";
const nativeFetch = global.fetch;
let upstreamCalls = 0;
let nasaCalls = 0;

const overviewFixture = {
    spieler_anzahl: 57,
    inseln_anzahl: 602,
    allianzen_anzahl: 5,
    flotten_unterwegs: 423,
    top_allianzen: [
        {
            rang: 1,
            allianz_id: 1,
            name: "MTG",
            tag: "MTG",
            mitglieder: 5,
            punkte: 280708,
            differenz: 9092,
            rang_aenderung: 0,
            flagge: { icon: "Star", farbe: "rot" }
        },
        {
            rang: 2,
            allianz_id: 9,
            name: "CC-AZuBis",
            tag: "AZB",
            mitglieder: 15,
            punkte: 44943,
            differenz: 6010,
            rang_aenderung: -1,
            flagge: { icon: "Swords", farbe: "blau" }
        }
    ],
    top_spieler: [{ name: "must-not-be-forwarded" }]
};

global.fetch = async (url, options) => {
    if (String(url).startsWith(nasaApodUrl)) {
        nasaCalls++;
        return Response.json({
            date: "2026-10-26",
            title: "A test nebula",
            explanation: "A test explanation",
            media_type: "image",
            hdurl: "https://images.example.test/nebula.jpg",
            credit: "NASA",
            alt: "A nebula"
        });
    }
    if (String(url) !== upstreamUrl) return nativeFetch(url, options);
    upstreamCalls++;
    return Response.json(overviewFixture);
};

const { app, normalizeOverview, normalizeApod } = require("../server.js");

test("normalizes featured alliance stats without forwarding unrelated rankings", () => {
    const result = normalizeOverview(overviewFixture);

    assert.deepEqual(result.featured.map((alliance) => alliance.tag), ["MTG", "AZB"]);
    assert.equal(result.featured[0].points, 280708);
    assert.equal(result.featured[1].dailyDelta, 6010);
    assert.equal(result.featured[1].rankChange, -1);
    assert.equal(result.global.fleets, 423);
    assert.equal(Object.hasOwn(result, "top_spieler"), false);
});

test("normalizes only HTTPS NASA image entries", () => {
    const result = normalizeApod({
        date: "2026-10-26",
        title: "A test nebula",
        explanation: "A test explanation",
        media_type: "image",
        hdurl: "https://images.example.test/nebula.jpg",
        credit: "NASA",
        alt: "A nebula"
    });

    assert.equal(result.imageUrl, "https://images.example.test/nebula.jpg");
    assert.equal(result.title, "A test nebula");
    assert.equal(normalizeApod({ media_type: "video", url: "https://example.test/video" }), null);
    assert.equal(normalizeApod({ media_type: "image", hdurl: "http://example.test/image.jpg" }), null);
});

test("featured endpoint returns normalized data and does not expose server files", async (context) => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const response = await nativeFetch(`${baseUrl}/api/alliances/featured`);
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.featured[0].name, "MTG");
    assert.equal(result.featured[1].name, "CC-AZuBis");
    assert.equal(upstreamCalls, 1);

    const cachedResponse = await nativeFetch(`${baseUrl}/api/alliances/featured`);
    const cachedResult = await cachedResponse.json();
    assert.equal(cachedResponse.status, 200);
    assert.equal(cachedResult.updatedAt, result.updatedAt);
    assert.equal(upstreamCalls, 1);

    const packageResponse = await nativeFetch(`${baseUrl}/package.json`);
    assert.equal(packageResponse.status, 404);
    const serverResponse = await nativeFetch(`${baseUrl}/server.js`);
    assert.equal(serverResponse.status, 404);
});

test("NASA endpoint returns a normalized, cached image", async (context) => {
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const response = await nativeFetch(`${baseUrl}/api/nasa/apod`);
    const result = await response.json();
    const cachedResponse = await nativeFetch(`${baseUrl}/api/nasa/apod`);

    assert.equal(response.status, 200);
    assert.equal(result.title, "A test nebula");
    assert.equal(result.imageUrl, "https://images.example.test/nebula.jpg");
    assert.equal(cachedResponse.status, 200);
    assert.equal(nasaCalls, 1);
});

test.after(() => {
    global.fetch = nativeFetch;
});
