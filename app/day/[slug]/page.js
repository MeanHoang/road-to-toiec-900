'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { countPictures, countQuestions } from '@/features/lesson/stats';
import { summarize } from '@/features/progress/summarize';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Section } from '@/shared/ui/atoms/Section';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { TopBar } from '@/shared/ui/organisms/TopBar';

/** Nhãn trạng thái ở cuối mỗi thẻ hoạt động. */
function stateBadge(done, total) {
  if (total === 0) return <Badge>chưa có</Badge>;
  if (done === 0) return <Badge>bắt đầu</Badge>;
  if (done >= total) return <Badge tone="success">xong</Badge>;
  return (
    <Badge tone="brand">
      {done} / {total}
    </Badge>
  );
}

function DayOverviewScreen({ slug, day }) {
  const { day: state, ready } = useProgress(slug);
  const s = summarize(state, day);
  const base = `/day/${slug}`;

  const pct = (done, total) => (total ? (done / total) * 100 : 0);

  return (
    <>
      <TopBar crumbs={[{ label: 'Trang chủ', href: '/' }, { label: day.title }]} />

      <PageHeader eyebrow={`Buổi ${day.no}`} title={day.title} subtitle={day.subtitle}>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={ready ? s.percent : 0} label="Tiến độ" />
        </div>
      </PageHeader>

      <Section
        title="Nội dung buổi học"
        lead="Làm theo thứ tự từ trên xuống — lý thuyết trước, luyện nghe sau cùng."
      >
        <div className="stack">
          {day.has('grammar') && (
            <NavCard
              href={`${base}/theory`}
              lead="📘"
              title="Lý thuyết"
              meta={`${day.grammar.length} cấu trúc ngữ pháp · ${day.theory.length} khối lý thuyết`}
              trailing={<Badge>đọc</Badge>}
            />
          )}

          {day.has('vocabulary') && (
            <>
              <NavCard
                href={`${base}/cards`}
                lead="🗂"
                title="Thẻ từ vựng"
                meta="Mặt trước là từ + IPA, lật ra mới có nghĩa"
                percent={ready ? pct(s.known, s.total) : 0}
                trailing={stateBadge(s.known, s.total)}
              />

              <NavCard
                href={`${base}/game`}
                lead="🎮"
                title="Game từ vựng"
                meta="Trắc nghiệm Anh ↔ Việt · sai từ nào thì từ đó quay lại thẻ chưa học"
                trailing={<Badge>chơi</Badge>}
              />
            </>
          )}

          {day.has('pictures') && (
            <NavCard
              href={`${base}/pictures`}
              lead="🖼"
              title="Từ vựng qua hình"
              meta={`${countPictures(day)} ảnh · quần áo, giới từ vị trí, địa điểm`}
              trailing={<Badge>luyện</Badge>}
            />
          )}

          {day.has('translation') && (
            <NavCard
              href={`${base}/grammar`}
              lead="✍️"
              title="Bài tập ngữ pháp"
              meta={`${day.translation.length} câu · gạch S / V / O rồi dịch`}
              percent={ready ? pct(s.transDone, s.transTotal) : 0}
              trailing={stateBadge(s.transDone, s.transTotal)}
            />
          )}

          {day.has('listening') && (
            <NavCard
              href={`${base}/listen`}
              lead="🎧"
              title="Luyện nghe"
              meta={`${day.listening.length} bộ bài · ${countQuestions(day)} câu`}
              percent={ready ? pct(s.listenDone, s.listenTotal) : 0}
              trailing={stateBadge(s.listenDone, s.listenTotal)}
            />
          )}

          {day.has('vocabulary') && (
            <NavCard
              href={`${base}/vocab`}
              lead="📋"
              title="Bảng từ vựng"
              meta={`Tra cứu ${day.vocabulary.length} từ · IPA UK/US · lọc theo trạng thái`}
              trailing={<Badge>tra cứu</Badge>}
            />
          )}
        </div>
      </Section>

      <p className="caption" style={{ marginTop: 'var(--space-5)' }}>
        Tiến độ lưu ngay trên máy bạn, không gửi đi đâu.
      </p>
    </>
  );
}

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} >
      {(day) => <DayOverviewScreen slug={slug} day={day} />}
    </DayGate>
  );
}
