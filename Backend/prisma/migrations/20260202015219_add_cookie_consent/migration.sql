-- CreateTable
CREATE TABLE "cookie_consents" (
    "id" TEXT NOT NULL,
    "consent_id" TEXT NOT NULL,
    "necessary" BOOLEAN NOT NULL DEFAULT true,
    "functional" BOOLEAN NOT NULL DEFAULT false,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cookie_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cookie_consents_consent_id_key" ON "cookie_consents"("consent_id");

-- CreateIndex
CREATE INDEX "cookie_consents_consent_id_idx" ON "cookie_consents"("consent_id");

-- CreateIndex
CREATE INDEX "cookie_consents_created_at_idx" ON "cookie_consents"("created_at");
