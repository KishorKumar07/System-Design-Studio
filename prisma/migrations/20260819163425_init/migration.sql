-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "category" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "functionalRequirements" TEXT[],
    "nonFunctionalRequirements" TEXT[],
    "constraints" TEXT[],
    "referenceScale" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled design',
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "capacityInputs" JSONB,
    "latestScore" INTEGER,
    "latestVerdict" TEXT,
    "latestEvaluation" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignAttempt" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "capacityInputs" JSONB,
    "evaluation" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designId" TEXT,
    "provider" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Design_userId_idx" ON "Design"("userId");

-- CreateIndex
CREATE INDEX "Design_isPublic_idx" ON "Design"("isPublic");

-- CreateIndex
CREATE INDEX "DesignAttempt_designId_idx" ON "DesignAttempt"("designId");

-- CreateIndex
CREATE INDEX "EvaluationLog_userId_createdAt_idx" ON "EvaluationLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignAttempt" ADD CONSTRAINT "DesignAttempt_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationLog" ADD CONSTRAINT "EvaluationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
