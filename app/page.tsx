'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type HomeStats = {
  members: number;
  reviews: number;
  raffles: number;
  rewards: number;
};

const hotProducts = [
  { name: '阿華田冰淇淋風味飲品', score: '4.9', store: '7-11' },
  { name: '炭烤雞腿便當', score: '4.8', store: 'FamilyMart' },
  { name: '抹茶拿鐵', score: '4.7', store: 'OK Mart' },
  { name: '鹽之花蛋糕', score: '4.6', store: '7-11' },
];

export default function HomePage() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const refreshStats = async () => {
      try {
        const response = await fetch('/api/home-stats', { cache: 'no-store' });
        const result = await response.json() as HomeStats & { error?: string };
        if (!response.ok) throw new Error(result.error ?? '無法載入網站統計資料。');
        setStats(result);
        setStatsError('');
      } catch (error) {
        setStatsError(error instanceof Error ? error.message : '無法載入網站統計資料。');
      }
    };

    void refreshStats();
    const interval = window.setInterval(() => void refreshStats(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const numberFormat = new Intl.NumberFormat('zh-TW');
  const statItems = [
    { label: '會員數', value: stats?.members },
    { label: '評價數', value: stats?.reviews },
    { label: '抽獎活動', value: stats?.raffles },
    { label: '兌換活動', value: stats?.rewards },
  ];

  return (
    <div className="page-stack">
      <section className="hero card">
        <div>
          <span className="eyebrow">超商飲食評價社群</span>
          <h1>跟朋友一起找出最值得買的超商商品</h1>
          <p>
            分享購買心得、累積積分、升級會員，還能參加抽獎活動，讓你每次買東西都更有方向。
          </p>
          <div className="cta-row">
            <Link href="/signup" className="button primary">
              立即加入
            </Link>
            <Link href="/feed" className="button secondary">
              看熱門動態
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {statItems.map((stat) => (
          <div key={stat.label} className="card stat-card">
            <div className="stat-value">{stat.value === undefined ? '—' : numberFormat.format(stat.value)}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </section>
      {statsError ? <p className="form-error" role="status">{statsError}</p> : null}

      <section className="card section-card">
        <div className="section-header">
          <h2>熱門商品</h2>
          <Link href="/feed">查看全部</Link>
        </div>
        <div className="list-grid">
          {hotProducts.map((item) => (
            <div key={item.name} className="product-item">
              <div className="product-topline">
                <span className="tag">{item.store}</span>
                <span className="rating">⭐ {item.score}</span>
              </div>
              <h3>{item.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
