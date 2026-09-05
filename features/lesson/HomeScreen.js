'use client';

import { AccountBar } from '@/features/auth/AccountBar';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { NavCardSkeleton } from '@/shared/ui/molecules/NavCardSkeleton';
import { DayRow } from './DayRow';
import { countQuestions } from './stats';
import { useDayList } from './useDayList';

/**
 * Một con số ở đầu trang. Lúc chưa tải xong thì để ô trống chứ KHÔNG hiện 0 —
 * "0 từ vựng" là một câu sai, và người đọc kịp tin nó trước khi số thật nhảy vào.
 */
function Stat({ value, label, loading }) {
  return (
    <div className="stat">
      <b>{loading ? <Skeleton width={36} height={29} style={{ margin: '0 auto' }} /> : value}</b>
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
          <Stat value={days.length} label="buổi học" loading={loading} />
          <Stat value={totalVocab} label="từ vựng" loading={loading} />
          <Stat value={totalAudio} label="câu nghe" loading={loading} />
        </div>
      </div>

      <AccountBar />

      {loading ? (
        <LoadingBlock label="Đang tải danh sách buổi học">
          <NavCardSkeleton />
          <NavCardSkeleton />
        </LoadingBlock>
      ) : (
        <div className="stack">
          {days.map((d) => (
            <DayRow key={d.slug} day={d} />
          ))}

          {/* Thẻ "buổi tiếp theo" chỉ hiện khi đã biết có bao nhiêu buổi — lúc
              đang tải nó sẽ đánh số 01 rồi nhảy sang 02, trông như lỗi. */}
          <NavCard
            empty
            lead={String(days.length + 1).padStart(2, '0')}
            title="Buổi tiếp theo"
            meta="Chưa nhập tài liệu"
          />
        </div>
      )}

      <Callout style={{ marginTop: 'var(--space-5)' }}>
        Toàn bộ nội dung là file tĩnh trong repo. Tiến độ học luôn lưu trước ở máy bạn nên mất mạng
        vẫn học được; đăng nhập Google thì được đồng bộ thêm lên tài khoản để đổi máy vẫn học tiếp.
      </Callout>
    </>
  );
}
