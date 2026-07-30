import { Agent, fetch, type RequestInit } from "undici";

export type PinnedAddress = {
  address: string;
  family: 4 | 6;
};

export type PinnedResponse = Awaited<ReturnType<typeof fetch>>;

export type PinnedFetchResult = {
  response: PinnedResponse;
  close: () => Promise<void>;
};

/**
 * Fetch a hostname through the exact address that passed SSRF validation.
 *
 * The URL remains unchanged, so HTTP Host headers and TLS SNI continue to use
 * the public hostname. Only the socket lookup is pinned, closing the
 * validate-then-resolve DNS-rebinding window.
 */
export async function fetchPinned(
  url: URL,
  target: PinnedAddress,
  init: RequestInit = {},
): Promise<PinnedFetchResult> {
  const dispatcher = new Agent({
    connect: {
      lookup(_hostname, options, callback) {
        if (options.all) {
          callback(null, [
            {
              address: target.address,
              family: target.family,
            },
          ]);
          return;
        }
        callback(null, target.address, target.family);
      },
    },
    pipelining: 0,
  });

  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await dispatcher.close();
  };

  try {
    const response = await fetch(url, {
      ...init,
      dispatcher,
    });
    return { response, close };
  } catch (error) {
    await close();
    throw error;
  }
}
