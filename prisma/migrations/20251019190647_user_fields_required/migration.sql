/*
  Warnings:

  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "otpCode" TEXT,
    "otpExpiresAt" DATETIME,
    "emailVerifiedAt" DATETIME,
    "emailVerifyToken" TEXT,
    "emailVerifyTokenExpires" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED'
);
INSERT INTO "new_User" ("email", "emailVerifiedAt", "emailVerifyToken", "emailVerifyTokenExpires", "firstName", "id", "lastName", "nickname", "otpCode", "otpExpiresAt", "passwordHash", "phone", "status", "username") SELECT "email", "emailVerifiedAt", "emailVerifyToken", "emailVerifyTokenExpires", "firstName", "id", "lastName", "nickname", "otpCode", "otpExpiresAt", "passwordHash", "phone", "status", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
