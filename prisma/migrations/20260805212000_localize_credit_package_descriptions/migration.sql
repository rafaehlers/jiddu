ALTER TABLE "JidduCreditPackage"
RENAME COLUMN "description" TO "descriptionEn";

ALTER TABLE "JidduCreditPackage"
ADD COLUMN "descriptionPt" TEXT,
ADD COLUMN "descriptionEs" TEXT;

UPDATE "JidduCreditPackage"
SET
    "descriptionEn" = 'Perfect for trying critical analysis, fact-checking, and explanations. One-time purchase, no subscription.',
    "descriptionPt" = 'Perfeito para experimentar análises críticas, checagem de fatos e explicações. Compra única, sem assinatura.',
    "descriptionEs" = 'Perfecto para probar análisis críticos, verificación de hechos y explicaciones. Compra única, sin suscripción.'
WHERE LOWER("name") IN ('jiddu lite', 'lite');

UPDATE "JidduCreditPackage"
SET
    "descriptionEn" = 'For occasional fact-checks, document analysis and paper reviews.',
    "descriptionPt" = 'Para checagens ocasionais, análise de documentos e revisões de artigos científicos.',
    "descriptionEs" = 'Para verificaciones ocasionales, análisis de documentos y revisiones de artículos científicos.'
WHERE LOWER("name") = 'starter';

UPDATE "JidduCreditPackage"
SET
    "descriptionEn" = 'More room for regular research and multi-step fact-checking.',
    "descriptionPt" = 'Mais espaço para pesquisas frequentes e checagens de fatos em várias etapas.',
    "descriptionEs" = 'Más espacio para investigaciones frecuentes y verificaciones de hechos en varias etapas.'
WHERE LOWER("name") = 'plus';

UPDATE "JidduCreditPackage"
SET
    "descriptionEn" = 'For frequent research, larger documents and adversarial reviews.',
    "descriptionPt" = 'Para pesquisas frequentes, documentos maiores e revisões adversariais.',
    "descriptionEs" = 'Para investigaciones frecuentes, documentos más extensos y revisiones adversariales.'
WHERE LOWER("name") = 'pro';

UPDATE "JidduCreditPackage"
SET
    "descriptionEn" = 'High-volume credits for professional and team workflows.',
    "descriptionPt" = 'Créditos em grande volume para fluxos de trabalho profissionais e em equipe.',
    "descriptionEs" = 'Créditos en gran volumen para flujos de trabajo profesionales y en equipo.'
WHERE LOWER("name") = 'studio';
