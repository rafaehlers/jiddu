import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import {
  agentMarkdownForPath,
  agentNotFoundMarkdown,
  isDefinitelyUnknownRootPath,
} from "@/lib/agent-markdown";
import {
  mergeVaryHeader,
  negotiateAgentRepresentation,
} from "@/lib/markdown-negotiation";

const configured = Boolean(
  process.env.WORKOS_API_KEY &&
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
);
const workosProxy = configured ? authkitProxy() : null;

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const pathname = request.nextUrl.pathname;
  const document = agentMarkdownForPath(pathname);
  const representation = negotiateAgentRepresentation(
    request.headers.get("accept"),
  );

  if (representation === "markdown" && document) {
    return markdownResponse(document.body, 200);
  }
  if (
    representation === "markdown" &&
    isDefinitelyUnknownRootPath(pathname)
  ) {
    return markdownResponse(agentNotFoundMarkdown(pathname), 404);
  }
  if (representation === null && document) {
    return new NextResponse("No acceptable representation is available.", {
      status: 406,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        vary: "Accept, Accept-Encoding",
      },
    });
  }

  const handled = workosProxy
    ? await workosProxy(request, event)
    : NextResponse.next();
  const response = handled instanceof Response ? handled : NextResponse.next();
  if (document) {
    response.headers.set(
      "vary",
      mergeVaryHeader(
        response.headers.get("vary"),
        "Accept",
        "Accept-Encoding",
      ),
    );
  }
  return response;
}

function markdownResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: {
      "content-language": "en",
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept, Accept-Encoding",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
