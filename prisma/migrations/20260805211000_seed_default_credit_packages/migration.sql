-- Keep fresh development and production databases aligned with the Stripe
-- catalog. Existing administrator-managed rows are preserved.
INSERT INTO "JidduCreditPackage" (
    "id", "name", "description", "credits", "priceUsdCents",
    "priceBrlCents", "active", "sortOrder", "createdAt", "updatedAt"
)
SELECT
    'jiddu-starter', 'Starter',
    'For occasional fact-checks, document analysis and paper reviews.',
    1000, 1000, 5000, TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "JidduCreditPackage" WHERE LOWER("name") = 'starter'
);

INSERT INTO "JidduCreditPackage" (
    "id", "name", "description", "credits", "priceUsdCents",
    "priceBrlCents", "active", "sortOrder", "createdAt", "updatedAt"
)
SELECT
    'jiddu-plus', 'Plus',
    'More room for regular research and multi-step fact-checking.',
    2600, 2500, 10000, TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "JidduCreditPackage" WHERE LOWER("name") = 'plus'
);

INSERT INTO "JidduCreditPackage" (
    "id", "name", "description", "credits", "priceUsdCents",
    "priceBrlCents", "active", "sortOrder", "createdAt", "updatedAt"
)
SELECT
    'jiddu-pro', 'Pro',
    'For frequent research, larger documents and adversarial reviews.',
    5500, 5000, 25000, TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "JidduCreditPackage" WHERE LOWER("name") = 'pro'
);

INSERT INTO "JidduCreditPackage" (
    "id", "name", "description", "credits", "priceUsdCents",
    "priceBrlCents", "active", "sortOrder", "createdAt", "updatedAt"
)
SELECT
    'jiddu-studio', 'Studio',
    'High-volume credits for professional and team workflows.',
    11500, 10000, 50000, TRUE, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "JidduCreditPackage" WHERE LOWER("name") = 'studio'
);
