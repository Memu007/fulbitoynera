CREATE TABLE "SharedPlay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" DATETIME NOT NULL,
  CONSTRAINT "SharedPlay_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SharedPlay_usuarioId_idx" ON "SharedPlay"("usuarioId");
CREATE INDEX "SharedPlay_expiresAt_idx" ON "SharedPlay"("expiresAt");
