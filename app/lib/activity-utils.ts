export function getCurrentActivityWhere(now: Date) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

export function isActivityAdmin(email: string) {
  const configuredEmails = process.env.ADMIN_EMAILS?.split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(configuredEmails?.includes(email.trim().toLowerCase()));
}

export type ActivityInput = {
  name: string;
  points: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  description: string;
};

type ParsedActivityInput =
  | { input: ActivityInput }
  | { error: string };

function parseActivityDate(value: unknown): Date | null | undefined {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseActivityInput(value: unknown, isReward: boolean): ParsedActivityInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: '活動資料格式不正確。' };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 80) {
    return { error: '活動名稱需為 1 到 80 個字。' };
  }

  const points = body.points;
  if (typeof points !== 'number' || !Number.isInteger(points) || points < 1 || points > 1_000_000) {
    return { error: '所需積分需為 1 到 1,000,000 的整數。' };
  }

  if (typeof body.isActive !== 'boolean') {
    return { error: '請指定活動是否啟用。' };
  }

  const startsAt = parseActivityDate(body.startsAt);
  const endsAt = parseActivityDate(body.endsAt);
  if (startsAt === undefined || endsAt === undefined) {
    return { error: '活動開始或結束時間格式不正確。' };
  }
  if (startsAt && endsAt && startsAt >= endsAt) {
    return { error: '活動結束時間必須晚於開始時間。' };
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (isReward && (!description || description.length > 500)) {
    return { error: '兌換說明需為 1 到 500 個字。' };
  }

  return {
    input: {
      name,
      points,
      isActive: body.isActive,
      startsAt,
      endsAt,
      description,
    },
  };
}
