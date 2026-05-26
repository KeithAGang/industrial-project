-- LifecycleIQ initial schema
-- Note: EF Core migrations handle schema creation automatically on startup.
-- This file is provided for reference and manual inspection.

CREATE TABLE IF NOT EXISTS "Users" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Email"        VARCHAR(255) NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "FullName"     VARCHAR(100) NOT NULL,
    "Role"         VARCHAR(20)  NOT NULL DEFAULT 'Manager',
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email")
);

CREATE TABLE IF NOT EXISTS "Clients" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"          VARCHAR(100) NOT NULL,
    "ContactPerson" VARCHAR(100) NOT NULL,
    "Email"         VARCHAR(255) NOT NULL,
    "Phone"         VARCHAR(30),
    "CreatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Solutions" (
    "Id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ClientId"            UUID         NOT NULL REFERENCES "Clients"("Id") ON DELETE RESTRICT,
    "Name"                VARCHAR(100) NOT NULL,
    "Description"         TEXT,
    "CurrentVersion"      VARCHAR(30)  NOT NULL,
    "LatestVersion"       VARCHAR(30)  NOT NULL,
    "LicenceKey"          TEXT,
    "LicenceExpiryDate"   TIMESTAMPTZ  NOT NULL,
    "SlaTier"             VARCHAR(20)  NOT NULL DEFAULT 'Standard',
    "SlaComplianceStatus" VARCHAR(20)  NOT NULL DEFAULT 'Compliant',
    "LastMaintenanceDate" TIMESTAMPTZ  NOT NULL,
    "IsActive"            BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_Solutions_ClientId" ON "Solutions"("ClientId");
CREATE INDEX IF NOT EXISTS "IX_Solutions_IsActive"  ON "Solutions"("IsActive");

CREATE TABLE IF NOT EXISTS "ShiRecords" (
    "Id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SolutionId"               UUID          NOT NULL REFERENCES "Solutions"("Id") ON DELETE CASCADE,
    "ShiScore"                 DOUBLE PRECISION NOT NULL,
    "RiskTier"                 VARCHAR(20)   NOT NULL,
    "LicenceUrgencyScore"      DOUBLE PRECISION NOT NULL,
    "VersionGapScore"          DOUBLE PRECISION NOT NULL,
    "SlaComplianceScore"       DOUBLE PRECISION NOT NULL,
    "MaintenanceRecencyScore"  DOUBLE PRECISION NOT NULL,
    "LicenceUrgencyWeight"     DOUBLE PRECISION NOT NULL,
    "VersionGapWeight"         DOUBLE PRECISION NOT NULL,
    "SlaComplianceWeight"      DOUBLE PRECISION NOT NULL,
    "MaintenanceRecencyWeight" DOUBLE PRECISION NOT NULL,
    "AiBriefing"               TEXT,
    "ComputedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_ShiRecords_SolutionId_ComputedAt" ON "ShiRecords"("SolutionId", "ComputedAt" DESC);

CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SolutionId" UUID        NOT NULL REFERENCES "Solutions"("Id") ON DELETE CASCADE,
    "UserId"     UUID        REFERENCES "Users"("Id") ON DELETE SET NULL,
    "Type"       VARCHAR(20) NOT NULL,
    "Title"      VARCHAR(200) NOT NULL,
    "Message"    TEXT         NOT NULL,
    "IsRead"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId_IsRead" ON "Notifications"("UserId", "IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_SolutionId"    ON "Notifications"("SolutionId");

CREATE TABLE IF NOT EXISTS "ChangeRequests" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SolutionId"      UUID        NOT NULL REFERENCES "Solutions"("Id") ON DELETE CASCADE,
    "RequestedById"   UUID        NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "Title"           VARCHAR(150) NOT NULL,
    "Description"     TEXT         NOT NULL,
    "Status"          VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    "Priority"        VARCHAR(20)  NOT NULL,
    "CreatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "ResolvedAt"      TIMESTAMPTZ,
    "ResolvedById"    UUID         REFERENCES "Users"("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_ChangeRequests_SolutionId" ON "ChangeRequests"("SolutionId");
CREATE INDEX IF NOT EXISTS "IX_ChangeRequests_Status"     ON "ChangeRequests"("Status");
