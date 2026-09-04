'use client';

import { countQuestions } from '@/lib/days';
import { useDayList } from '@/components/DayProvider';
import { useProgress, summarize } from '@/lib/progress';
import { Callout } from '@/components/primitives';
import { NavCard } from '@/components/patterns';

function DayRow({ day }) {
  const { day: state, ready } = useProgress(day.slug);
  const s = summarize(state, day);

  return (
    <NavCard
      href={`/day/${day.slug}`}
      lead={String(day.no).padStart(2, '0')}
      leadBrand
      title={`${day.title} — ${day.subtitle}`}
      meta={`${day.grammar.length} cấu trúc · ${day.vocabulary.length} từ vựng · ${countQuestions(day)} câu nghe`}
      percent={ready ? s.percent : 0}
    />
  );
}

export default function Home() {
  const { days, loading } = useDayList();
  const totalVocab = days.reduce((n, d) => n + d.vocabulary.length, 0);
  const totalAudio = days.reduce((n, d) => n + countQuestions(d), 0);

  return (
    <>
      <div className="hero">
        <h1>Road to TOEIC 900</h1>
        <p>Chọn buổi học để bắt đầu</p>

        <div className="stat-row">
          <div className="stat">
            <b>{days.length}</b>
            <span>buổi học</span>
          </div>
          <div className="stat">
            <b>{totalVocab}</b>
            <span>từ vựng</span>
          </div>
          <div className="stat">
            <b>{totalAudio}</b>
            <span>câu nghe</span>
          </div>
        </div>
      </div>

      <div className="stack">
        {loading && <p className="section-lead">Đang tải danh sách buổi học…</p>}
        {days.map((d) => (
          <DayRow key={d.slug} day={d} />
        ))}

        <NavCard
          empty
          lead={String(days.length + 1).padStart(2, '0')}
          title="Buổi tiếp theo"
          meta="Chưa nhập tài liệu"
        />
      </div>

      <Callout style={{ marginTop: 'var(--space-5)' }}>
        Toàn bộ nội dung là file tĩnh trong repo. Tiến độ học lưu ngay trên máy bạn, không gửi đi
        đâu cả.
      </Callout>
    </>
  );
}
