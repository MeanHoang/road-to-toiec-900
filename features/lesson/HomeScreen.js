'use client';

import { AccountBar } from '@/features/auth/AccountBar';
import { Callout } from '@/shared/ui/atoms/Callout';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { DayRow } from './DayRow';
import { countQuestions } from './stats';
import { useDayList } from './useDayList';

function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function HomeScreen() {
  const { days, loading } = useDayList();
  const totalVocab = days.reduce((n, d) => n + d.vocabulary.length, 0);
  const totalAudio = days.reduce((n, d) => n + countQuestions(d), 0);

  return (
    <>
      <div className="hero">
        <h1>Road to TOEIC 900</h1>
        <p>Chọn buổi học để bắt đầu</p>

        <div className="stat-row">
          <Stat value={days.length} label="buổi học" />
          <Stat value={totalVocab} label="từ vựng" />
          <Stat value={totalAudio} label="câu nghe" />
        </div>
      </div>

      <AccountBar />

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
        Toàn bộ nội dung là file tĩnh trong repo. Tiến độ học luôn lưu trước ở máy bạn nên mất mạng
        vẫn học được; đăng nhập Google thì được đồng bộ thêm lên tài khoản để đổi máy vẫn học tiếp.
      </Callout>
    </>
  );
}
