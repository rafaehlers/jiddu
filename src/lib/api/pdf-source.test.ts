import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicPdf } from "./pdf-source";
import { PaperReviewInputError } from "@/lib/paper-review-job";

test("rejects localhost PDF URLs before fetching", async () => {
  await assert.rejects(
    () => fetchPublicPdf("http://localhost/paper.pdf"),
    (err) =>
      err instanceof PaperReviewInputError &&
      err.code === "private_pdf_url" &&
      err.status === 400,
  );
});

test("rejects non-HTTP PDF URLs", async () => {
  await assert.rejects(
    () => fetchPublicPdf("file:///tmp/paper.pdf"),
    (err) =>
      err instanceof PaperReviewInputError &&
      err.code === "invalid_pdf_url" &&
      err.status === 400,
  );
});

test("rejects nonstandard ports", async () => {
  await assert.rejects(
    () => fetchPublicPdf("https://example.com:8443/paper.pdf"),
    (err) =>
      err instanceof PaperReviewInputError &&
      err.code === "invalid_pdf_url" &&
      err.status === 400,
  );
});
