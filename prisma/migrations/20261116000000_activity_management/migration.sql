CREATE TABLE "RaffleActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RaffleActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RewardActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RaffleActivity_isActive_startsAt_endsAt_idx"
    ON "RaffleActivity"("isActive", "startsAt", "endsAt");
CREATE INDEX "RewardActivity_isActive_startsAt_endsAt_idx"
    ON "RewardActivity"("isActive", "startsAt", "endsAt");

INSERT INTO "RaffleActivity" ("id", "name", "points", "isActive", "updatedAt")
VALUES
    ('weekend', '週末超商好禮', 100, true, CURRENT_TIMESTAMP),
    ('new-item', '新品嚐鮮抽獎', 150, true, CURRENT_TIMESTAMP),
    ('grand-prize', '超商人氣大獎', 300, true, CURRENT_TIMESTAMP);

INSERT INTO "RewardActivity" ("id", "name", "points", "description", "isActive", "updatedAt")
VALUES
    ('drink-reward', '飲品兌換申請', 50, '兌換一份指定超商飲品', true, CURRENT_TIMESTAMP),
    ('snack-reward', '點心兌換申請', 100, '兌換一份指定超商點心', true, CURRENT_TIMESTAMP),
    ('meal-reward', '餐食兌換申請', 250, '兌換一份指定超商餐食', true, CURRENT_TIMESTAMP);
