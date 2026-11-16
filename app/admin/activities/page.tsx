'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useId, useState } from 'react';
import type { RaffleActivity, RewardActivity } from '@/app/lib/types';

type ActivityType = 'raffle' | 'reward';

type ActivityDraft = {
  type: ActivityType;
  name: string;
  points: number;
  description: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

type ActivityItem = ActivityDraft & { id: string; createdAt: string };

function createDraft(type: ActivityType = 'raffle'): ActivityDraft {
  return {
    type,
    name: '',
    points: 100,
    description: '',
    isActive: true,
    startsAt: '',
    endsAt: '',
  };
}

function toLocalDateTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toApiDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function toActivityItems(raffles: RaffleActivity[], rewards: RewardActivity[]): ActivityItem[] {
  return [
    ...raffles.map((item) => ({
      ...item,
      type: 'raffle' as const,
      description: '',
      startsAt: toLocalDateTime(item.startsAt),
      endsAt: toLocalDateTime(item.endsAt),
    })),
    ...rewards.map((item) => ({
      ...item,
      type: 'reward' as const,
      startsAt: toLocalDateTime(item.startsAt),
      endsAt: toLocalDateTime(item.endsAt),
    })),
  ];
}

function ActivityFields({
  draft,
  onChange,
}: {
  draft: ActivityDraft;
  onChange: (draft: ActivityDraft) => void;
}) {
  const idPrefix = useId();

  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>活動名稱</label>
        <input
          id={`${idPrefix}-name`}
          required
          maxLength={80}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-points`}>所需積分</label>
        <input
          id={`${idPrefix}-points`}
          required
          type="number"
          min={1}
          max={1_000_000}
          step={1}
          value={draft.points}
          onChange={(event) => onChange({ ...draft, points: Number(event.target.value) })}
        />
      </div>
      {draft.type === 'reward' ? (
        <div className="field">
          <label htmlFor={`${idPrefix}-description`}>兌換說明</label>
          <textarea
            id={`${idPrefix}-description`}
            required
            maxLength={500}
            value={draft.description}
            onChange={(event) => onChange({ ...draft, description: event.target.value })}
          />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor={`${idPrefix}-starts-at`}>開始時間（選填）</label>
        <input
          id={`${idPrefix}-starts-at`}
          type="datetime-local"
          value={draft.startsAt}
          onChange={(event) => onChange({ ...draft, startsAt: event.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-ends-at`}>結束時間（選填）</label>
        <input
          id={`${idPrefix}-ends-at`}
          type="datetime-local"
          value={draft.endsAt}
          onChange={(event) => onChange({ ...draft, endsAt: event.target.value })}
        />
      </div>
      <label className="field">
        <span>活動狀態</span>
        <span>
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => onChange({ ...draft, isActive: event.target.checked })}
          />{' '}
          啟用
        </span>
      </label>
    </>
  );
}

function ActivityEditor({
  activity,
  onSaved,
}: {
  activity: ActivityItem;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<ActivityDraft>(activity);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/activities/${activity.type}/${encodeURIComponent(activity.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          startsAt: toApiDateTime(draft.startsAt),
          endsAt: toApiDateTime(draft.endsAt),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? '更新活動失敗。');
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '更新活動失敗。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="card section-card">
      <div className="product-topline">
        <span className="tag">{activity.type === 'raffle' ? '抽獎' : '兌換'}</span>
        <span>{activity.isActive ? '已啟用' : '已停用'}</span>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <ActivityFields draft={draft} onChange={setDraft} />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="form-actions">
          <button type="submit" className="button primary" disabled={isSaving}>
            {isSaving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </article>
  );
}

export default function ActivityAdminPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [draft, setDraft] = useState<ActivityDraft>(createDraft());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const [message, setMessage] = useState('');

  const loadActivities = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/admin/activities', { cache: 'no-store' });
      const result = await response.json() as {
        error?: string;
        raffles?: RaffleActivity[];
        rewards?: RewardActivity[];
      };
      setLoginRequired(response.status === 401);
      if (!response.ok) throw new Error(result.error ?? '無法載入活動資料。');
      setActivities(toActivityItems(result.raffles ?? [], result.rewards ?? []));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '無法載入活動資料。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          startsAt: toApiDateTime(draft.startsAt),
          endsAt: toApiDateTime(draft.endsAt),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? '建立活動失敗。');
      setDraft(createDraft(draft.type));
      setMessage('活動已建立。');
      await loadActivities();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '建立活動失敗。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <div>
        <span className="eyebrow">管理員專用</span>
        <h1 className="page-title">活動管理</h1>
      </div>

      {error ? (
        <div className="card section-card">
          <p className="form-error" role="alert">{error}</p>
          {loginRequired ? <Link href="/login" className="button secondary">前往登入</Link> : null}
        </div>
      ) : null}

      {message ? <p className="form-success" role="status">{message}</p> : null}

      {!error ? (
        <>
          <section className="card section-card">
            <h2>建立活動</h2>
            <form className="form-grid" onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="activity-type">活動類型</label>
                <select
                  id="activity-type"
                  value={draft.type}
                  onChange={(event) => setDraft(createDraft(event.target.value === 'reward' ? 'reward' : 'raffle'))}
                >
                  <option value="raffle">抽獎活動</option>
                  <option value="reward">積分兌換</option>
                </select>
              </div>
              <ActivityFields draft={draft} onChange={setDraft} />
              <div className="form-actions">
                <button type="submit" className="button primary" disabled={isSaving}>
                  {isSaving ? '建立中...' : '建立活動'}
                </button>
              </div>
            </form>
          </section>

          {isLoading ? <p>載入活動中...</p> : null}
          {!isLoading && activities.length === 0 ? <p>目前沒有活動。</p> : null}
          <section className="page-stack">
            <h2>目前活動</h2>
            <div className="activity-grid">
              {activities.map((activity) => (
                <ActivityEditor key={`${activity.type}-${activity.id}`} activity={activity} onSaved={() => void loadActivities()} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
