-- CreateEnum
CREATE TYPE "CertificationLevel" AS ENUM ('UNVERIFIED', 'PROVISIONAL', 'CERTIFIED', 'DEGRADED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CapabilityStatus" AS ENUM ('DECLARED', 'TESTING', 'VERIFIED', 'FAILED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('CANARY', 'REGRESSION', 'CHALLENGE', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('PASS', 'FAIL', 'ERROR', 'PENDING');

-- CreateEnum
CREATE TYPE "TelemetryEventType" AS ENUM ('TOOL_CALL', 'TOOL_RESULT', 'DECISION', 'ERROR', 'SESSION_START', 'SESSION_END');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "avatarEmoji" TEXT NOT NULL DEFAULT '🤖',
    "ownerHandle" TEXT,
    "certificationLevel" "CertificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCertifiedAt" TIMESTAMP(3),
    "certificationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'DECLARED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "testCount" INTEGER NOT NULL DEFAULT 0,
    "passCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "status" "TestStatus" NOT NULL,
    "score" DOUBLE PRECISION,
    "executionTime" INTEGER,
    "costCents" INTEGER,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "outputSample" TEXT,
    "errorMessage" TEXT,
    "runtimeInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "eventType" "TelemetryEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_username_key" ON "Agent"("username");

-- CreateIndex
CREATE INDEX "Agent_certificationLevel_idx" ON "Agent"("certificationLevel");

-- CreateIndex
CREATE INDEX "Agent_trustScore_idx" ON "Agent"("trustScore");

-- CreateIndex
CREATE INDEX "Agent_username_idx" ON "Agent"("username");

-- CreateIndex
CREATE INDEX "Capability_agentId_idx" ON "Capability"("agentId");

-- CreateIndex
CREATE INDEX "Capability_status_idx" ON "Capability"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_agentId_slug_key" ON "Capability"("agentId", "slug");

-- CreateIndex
CREATE INDEX "TestResult_agentId_idx" ON "TestResult"("agentId");

-- CreateIndex
CREATE INDEX "TestResult_capabilityId_idx" ON "TestResult"("capabilityId");

-- CreateIndex
CREATE INDEX "TestResult_createdAt_idx" ON "TestResult"("createdAt");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");

-- CreateIndex
CREATE INDEX "Telemetry_agentId_idx" ON "Telemetry"("agentId");

-- CreateIndex
CREATE INDEX "Telemetry_eventType_idx" ON "Telemetry"("eventType");

-- CreateIndex
CREATE INDEX "Telemetry_timestamp_idx" ON "Telemetry"("timestamp");

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
