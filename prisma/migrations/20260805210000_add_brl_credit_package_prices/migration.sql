-- Preserve the existing international prices while allowing a package to be
-- sold in either currency (or, in the case of Jiddu Lite, BRL only).
ALTER TABLE "JidduCreditPackage"
RENAME COLUMN "priceCents" TO "priceUsdCents";

ALTER TABLE "JidduCreditPackage"
ALTER COLUMN "priceUsdCents" DROP NOT NULL;

ALTER TABLE "JidduCreditPackage"
ADD COLUMN "priceBrlCents" INTEGER;

UPDATE "JidduCreditPackage"
SET "priceBrlCents" = CASE LOWER("name")
    WHEN 'starter' THEN 5000
    WHEN 'plus' THEN 10000
    WHEN 'pro' THEN 25000
    WHEN 'studio' THEN 50000
    ELSE "priceBrlCents"
END
WHERE LOWER("name") IN ('starter', 'plus', 'pro', 'studio');

INSERT INTO "JidduCreditPackage" (
    "id",
    "name",
    "description",
    "credits",
    "priceUsdCents",
    "priceBrlCents",
    "active",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    'jiddu-lite-brl',
    'Jiddu Lite',
    '150 Créditos Jiddu para experimentar análises críticas, checagem de fatos e explicações. Compra única, sem assinatura.',
    150,
    NULL,
    1000,
    TRUE,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM "JidduCreditPackage"
    WHERE LOWER("name") IN ('jiddu lite', 'lite')
);
