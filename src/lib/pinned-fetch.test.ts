import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { fetchPinned } from "./pinned-fetch";

test("fetchPinned connects to the approved IP while preserving the URL host", async () => {
  let receivedHost = "";
  const server = createServer((request, response) => {
    receivedHost = request.headers.host ?? "";
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("pinned");
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const port = (server.address() as AddressInfo).port;
    const result = await fetchPinned(
      new URL(`http://does-not-resolve.invalid:${port}/proof`),
      { address: "127.0.0.1", family: 4 },
    );
    try {
      assert.equal(await result.response.text(), "pinned");
      assert.equal(receivedHost, `does-not-resolve.invalid:${port}`);
    } finally {
      await result.close();
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
