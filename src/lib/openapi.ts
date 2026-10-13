const json = (schema: Record<string, unknown>) => ({
  "application/json": { schema },
});

const response = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: json(schema),
});

const errorResponses = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "402": { $ref: "#/components/responses/PaymentRequired" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "422": { $ref: "#/components/responses/UnprocessableContent" },
  "429": { $ref: "#/components/responses/RateLimited" },
  "502": { $ref: "#/components/responses/UpstreamFailure" },
  "503": { $ref: "#/components/responses/Unavailable" },
} as const;

function textAnalysisOperation(input: {
  description: string;
  operationId: string;
  requestSchema: string;
  responseDescription: string;
  responseSchema: string;
  summary: string;
}) {
  return {
    tags: ["Text analysis"],
    summary: input.summary,
    description: input.description,
    operationId: input.operationId,
    security: [{ JidduApiKey: [] }],
    requestBody: {
      required: true,
      content: json({ $ref: `#/components/schemas/${input.requestSchema}` }),
    },
    responses: {
      "200": response(input.responseDescription, {
        $ref: `#/components/schemas/${input.responseSchema}`,
      }),
      ...errorResponses,
    },
  };
}

export const JIDDU_OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "Jiddu API",
    version: "1.0.0",
    description:
      "Machine-readable contract for Jiddu's critical-reading API. Five synchronous operations analyze text; two asynchronous operations start and inspect a venue-calibrated adversarial PDF review.",
    contact: {
      name: "Jiddu Support",
      url: "https://jiddu.app/contact",
      email: "support@emails.jiddu.app",
    },
    license: {
      name: "MIT",
      url: "https://github.com/rafaehlers/jiddu/blob/main/LICENSE",
    },
  },
  servers: [{ url: "https://jiddu.app", description: "Production" }],
  externalDocs: {
    description: "Jiddu developer documentation and quickstart",
    url: "https://jiddu.app/developers",
  },
  tags: [
    {
      name: "Text analysis",
      description: "Synchronous critical-reading operations for bounded text.",
    },
    {
      name: "Adversarial review",
      description:
        "Asynchronous, persisted review jobs for one complete academic PDF.",
    },
  ],
  paths: {
    "/api/v1/detect-fallacies": {
      post: textAnalysisOperation({
        operationId: "detectFallacies",
        summary: "Detect logical fallacies",
        description:
          "Find logical fallacies in a passage and return the exact excerpt and explanation for each finding. Use for arguments and persuasive claims; do not treat a clean result as proof that the underlying facts are true.",
        requestSchema: "TextAnalysisRequest",
        responseSchema: "FallacyResponse",
        responseDescription: "Fallacy findings and a stable overall verdict.",
      }),
    },
    "/api/v1/fact-check": {
      post: textAnalysisOperation({
        operationId: "factCheckText",
        summary: "Extract and verify factual claims",
        description:
          "Extract checkable claims and verify each through live web search. This operation is slower and more expensive than the other text operations because verification is performed per claim.",
        requestSchema: "FactCheckRequest",
        responseSchema: "FactCheckResponse",
        responseDescription: "Per-claim verdicts and an overall reliability verdict.",
      }),
    },
    "/api/v1/assess-neutrality": {
      post: textAnalysisOperation({
        operationId: "assessNeutrality",
        summary: "Assess framing and neutrality",
        description:
          "Identify loaded language, one-sidedness, selective omission, and framing. Jiddu deliberately does not label political direction such as left or right.",
        requestSchema: "TextAnalysisRequest",
        responseSchema: "NeutralityResponse",
        responseDescription: "A neutrality score, label, signals, and summary.",
      }),
    },
    "/api/v1/explain": {
      post: textAnalysisOperation({
        operationId: "explainText",
        summary: "Explain dense text",
        description:
          "Explain academic or technical prose paragraph by paragraph at a chosen audience level, while preserving the role each paragraph plays in the document.",
        requestSchema: "ExplainRequest",
        responseSchema: "ExplainResponse",
        responseDescription: "An overview and paragraph-level explanations.",
      }),
    },
    "/api/v1/detect-slop": {
      post: textAnalysisOperation({
        operationId: "detectSlopPatterns",
        summary: "Detect templated writing patterns",
        description:
          "Flag stock phrases, manufactured drama, hollow claims, and other machine-assembled writing patterns. This detects textual patterns and never infers whether a human or AI wrote the text.",
        requestSchema: "TextAnalysisRequest",
        responseSchema: "SlopResponse",
        responseDescription: "Pattern findings, score, label, and summary.",
      }),
    },
    "/api/v1/adversarial-reviews": {
      post: {
        tags: ["Adversarial review"],
        summary: "Start an adversarial PDF review",
        description:
          "Start a persisted, asynchronous review of exactly one complete PDF. Send either multipart form data with a local file or JSON with a public PDF URL. The response is immediate; poll the returned status URL until the job is complete or failed.",
        operationId: "startAdversarialReview",
        security: [{ JidduApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewUrlRequest" },
            },
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/ReviewUploadRequest" },
            },
          },
        },
        responses: {
          "202": {
            description: "Review job accepted.",
            headers: {
              Location: {
                description: "Canonical status URL for the new job.",
                schema: { type: "string", format: "uri" },
              },
              "Retry-After": {
                description: "Seconds to wait before the first poll.",
                schema: { type: "integer", minimum: 1 },
              },
            },
            content: json({ $ref: "#/components/schemas/ReviewJob" }),
          },
          "415": { $ref: "#/components/responses/UnsupportedMediaType" },
          ...errorResponses,
        },
      },
    },
    "/api/v1/adversarial-reviews/{id}": {
      get: {
        tags: ["Adversarial review"],
        summary: "Get an adversarial review job",
        description:
          "Inspect a job owned by the authenticated account. While it is running, honor retry_after_seconds and poll again. Stop when status is complete or failed.",
        operationId: "getAdversarialReview",
        security: [{ JidduApiKey: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Job identifier returned by startAdversarialReview.",
            schema: {
              type: "string",
              minLength: 5,
              maxLength: 30,
              pattern: "^[A-Za-z0-9_-]+$",
            },
          },
        ],
        responses: {
          "200": response("Current or completed review job.", {
            $ref: "#/components/schemas/ReviewJob",
          }),
          "404": { $ref: "#/components/responses/NotFound" },
          ...errorResponses,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      JidduApiKey: {
        type: "apiKey",
        in: "header",
        name: "X-Jiddu-Key",
        description:
          "Account-owned API key created at https://jiddu.app/account?tab=api. The key is shown once, stored only as a SHA-256 hash, and can be revoked by its owner.",
      },
    },
    responses: {
      BadRequest: response("The JSON or parameters are invalid.", {
        $ref: "#/components/schemas/Error",
      }),
      Unauthorized: response("The API key is missing, invalid, or revoked.", {
        $ref: "#/components/schemas/Error",
      }),
      PaymentRequired: response("The account needs Jiddu Credits.", {
        $ref: "#/components/schemas/Error",
      }),
      Forbidden: response("The authenticated account cannot perform this operation.", {
        $ref: "#/components/schemas/Error",
      }),
      NotFound: response("The requested job does not exist for this account.", {
        $ref: "#/components/schemas/Error",
      }),
      UnsupportedMediaType: response("Use JSON or multipart form data as documented.", {
        $ref: "#/components/schemas/Error",
      }),
      UnprocessableContent: response("The supplied content cannot be analyzed.", {
        $ref: "#/components/schemas/Error",
      }),
      RateLimited: {
        ...response("The per-key rate limit was exceeded.", {
          $ref: "#/components/schemas/Error",
        }),
        headers: {
          "Retry-After": {
            description: "Seconds to wait before retrying.",
            schema: { type: "integer", minimum: 1 },
          },
        },
      },
      UpstreamFailure: response("An upstream analysis provider failed.", {
        $ref: "#/components/schemas/Error",
      }),
      Unavailable: response("Analysis capacity is temporarily unavailable.", {
        $ref: "#/components/schemas/Error",
      }),
    },
    schemas: {
      Language: {
        type: "string",
        enum: ["en", "pt", "es"],
        default: "en",
        description: "Language used for human-readable explanations.",
      },
      TextAnalysisRequest: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 40, maxLength: 2000 },
          lang: { $ref: "#/components/schemas/Language" },
        },
      },
      FactCheckRequest: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 40, maxLength: 10000 },
          lang: { $ref: "#/components/schemas/Language" },
        },
      },
      ExplainRequest: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: { type: "string", minLength: 40, maxLength: 2000 },
          lang: { $ref: "#/components/schemas/Language" },
          level: {
            type: "string",
            enum: ["eli5", "high_school", "undergrad", "expert"],
            default: "undergrad",
          },
        },
      },
      Finding: {
        type: "object",
        additionalProperties: false,
        required: ["name", "excerpt", "explanation"],
        properties: {
          name: { type: "string" },
          excerpt: { type: "string" },
          explanation: { type: "string" },
        },
      },
      FallacyResponse: {
        type: "object",
        additionalProperties: false,
        required: ["fallacies", "fallacy_count", "verdict"],
        properties: {
          fallacies: {
            type: "array",
            items: { $ref: "#/components/schemas/Finding" },
          },
          fallacy_count: { type: "integer", minimum: 0 },
          verdict: { type: "string", enum: ["fallacies_found", "clean"] },
        },
      },
      FactCheckResponse: {
        type: "object",
        additionalProperties: false,
        required: ["claims", "overall_verdict"],
        properties: {
          claims: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["claim", "verdict", "explanation", "confidence"],
              properties: {
                claim: { type: "string" },
                verdict: {
                  type: "string",
                  enum: ["true", "false", "misleading", "unverifiable"],
                },
                explanation: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
            },
          },
          overall_verdict: {
            type: "string",
            enum: ["reliable", "questionable", "unreliable"],
          },
          truncated: { type: "boolean" },
        },
      },
      NeutralityResponse: {
        type: "object",
        additionalProperties: false,
        required: ["score", "label", "signals", "summary"],
        properties: {
          score: { type: "number", minimum: 0, maximum: 1 },
          label: {
            type: "string",
            enum: ["neutral", "mostly_neutral", "biased", "highly_biased"],
          },
          signals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["type", "excerpt", "explanation"],
              properties: {
                type: {
                  type: "string",
                  enum: ["loaded_language", "one_sided", "omission", "framing"],
                },
                excerpt: { type: "string" },
                explanation: { type: "string" },
              },
            },
          },
          summary: { type: "string" },
        },
      },
      ExplainResponse: {
        type: "object",
        additionalProperties: false,
        required: ["overview", "level", "paragraphs"],
        properties: {
          overview: { type: "string" },
          level: {
            type: "string",
            enum: ["eli5", "high_school", "undergrad", "expert"],
          },
          paragraphs: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["role", "explanation"],
              properties: {
                role: { type: "string" },
                explanation: { type: "string" },
              },
            },
          },
        },
      },
      SlopResponse: {
        type: "object",
        additionalProperties: false,
        required: ["patterns", "pattern_count", "score", "label", "summary"],
        properties: {
          patterns: {
            type: "array",
            items: { $ref: "#/components/schemas/Finding" },
          },
          pattern_count: { type: "integer", minimum: 0 },
          score: { type: "integer", minimum: 0, maximum: 100 },
          label: {
            type: "string",
            enum: [
              "reads_human",
              "light_seasoning",
              "patterned",
              "heavily_templated",
              "assembly_line",
            ],
          },
          summary: { type: "string" },
        },
      },
      ReviewOptions: {
        type: "object",
        properties: {
          lang: { $ref: "#/components/schemas/Language" },
          venue_profile_id: { type: "string", maxLength: 100 },
          venue: { type: "string", maxLength: 300 },
          venue_year: { type: "string", pattern: "^[0-9]{4}$" },
          venue_track: { type: "string", maxLength: 200 },
          paper_type: {
            type: "string",
            enum: [
              "research",
              "position",
              "survey",
              "dataset",
              "theory",
              "use-inspired",
              "concept",
              "negative-results",
              "systematic-review",
              "meta-analysis",
            ],
          },
          review_date: { type: "string", format: "date" },
          depth: { type: "string", enum: ["standard", "deep"], default: "standard" },
        },
      },
      ReviewUrlRequest: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: "#/components/schemas/ReviewOptions" },
          {
            type: "object",
            required: ["pdf_url"],
            properties: {
              pdf_url: { type: "string", format: "uri", maxLength: 2000 },
            },
          },
        ],
      },
      ReviewUploadRequest: {
        unevaluatedProperties: false,
        allOf: [
          { $ref: "#/components/schemas/ReviewOptions" },
          {
            type: "object",
            required: ["file"],
            properties: {
              file: {
                type: "string",
                format: "binary",
                description: "One PDF, up to 25 MB.",
              },
            },
          },
        ],
      },
      ReviewJob: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "status",
          "stage",
          "progress",
          "paper",
          "result",
          "error",
          "urls",
          "created_at",
          "finished_at",
        ],
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["running", "complete", "failed"] },
          stage: { type: "string" },
          progress: {
            type: "object",
            additionalProperties: false,
            required: ["completed_stages", "total_stages"],
            properties: {
              completed_stages: { type: "integer", minimum: 0 },
              total_stages: { type: "integer", minimum: 1 },
            },
          },
          timeline: { type: "array", items: { type: "object" } },
          paper: { type: "object", additionalProperties: true },
          result: { oneOf: [{ type: "object", additionalProperties: true }, { type: "null" }] },
          error: { oneOf: [{ type: "string" }, { type: "null" }] },
          urls: {
            type: "object",
            additionalProperties: false,
            required: ["status", "viewer", "markdown", "print"],
            properties: {
              status: { type: "string", format: "uri" },
              viewer: { type: "string", format: "uri" },
              markdown: { type: "string", format: "uri" },
              print: { type: "string", format: "uri" },
            },
          },
          retry_after_seconds: { type: "integer", minimum: 1 },
          created_at: { type: "string", format: "date-time" },
          finished_at: {
            oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
          },
        },
      },
      Error: {
        type: "object",
        additionalProperties: false,
        required: ["error"],
        properties: {
          error: { type: "string" },
          code: { type: "string" },
          retry_after_seconds: { type: "integer", minimum: 1 },
        },
      },
    },
  },
} as const;
