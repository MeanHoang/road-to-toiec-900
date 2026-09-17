'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Modal } from '@/shared/ui/organisms/Modal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLeaderboard } from './useLeaderboard';

/** Huy chương cho ba hạng đầu, còn lại là số. */
const rankMark = (i) => ['🥇', '🥈', '🥉'][i] || i + 1;

/**
 * Một hàng. Càng lên cao càng nặng ký về mặt thị giác — avatar to hơn, điểm to
 * hơn, viền huy chương, nền đậm hơn.
 *
 * `pct` là điểm so với người dẫn đầu, vẽ thành một dải chạy sau lưng hàng. Con
 * số cho biết CHÍNH XÁC bao nhiêu, dải cho biết CÁCH BIỆT bao xa — nhìn một cái
 * là thấy ai đang bỏ xa ai, không phải trừ nhẩm trong đầu.
 */
function Row({ entry, rank, isMe, pct }) {
  const tier = rank < 3 ? ` is-top is-top${rank + 1}` : '';

  return (
    <li className={`board-row${tier}${isMe ? ' is-me' : ''}`}>
      <span className="board-bar" style={{ width: `${pct}%` }} aria-hidden="true" />

      <span className="board-rank">{rankMark(rank)}</span>

      {entry.photo ? (
        <img className="board-avatar" src={entry.photo} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="board-avatar board-avatar-blank" aria-hidden="true">
          {(entry.name || '?').trim().charAt(0).toUpperCase()}
        </span>
      )}

      <span className="board-name">
        {entry.name}
        {isMe && <span className="board-you"> · bạn</span>}
      </span>

      <span className="board-score">
        <b>{entry.score}</b>
        <small>điểm</small>
      </span>
    </li>
  );
}

/**
 * Bảng xếp hạng, nằm sau một nút bấm.
 *
 * Để sau nút chứ không bày thẳng ra trang chủ vì hai lẽ: trang chủ là chỗ để
 * BẮT ĐẦU HỌC, một bảng thứ hạng bày sẵn ở đó tranh chỗ với việc đó; và bảng
 * chỉ tải khi mở, nên người không quan tâm thì không phải trả lượt đọc nào.
 *
 * XEM bảng không cần đăng nhập — rule Firestore cho đọc công khai. Đăng nhập
 * chỉ để CÓ TÊN trên bảng, vì phiên ẩn danh không có tên và mỗi trình duyệt lại
 * sinh một uid mới.
 */
export function LeaderboardButton() {
  const { cloud, anonymous } = useAuth();
  const [open, setOpen] = useState(false);
  const { rows, error, loading, me } = useLeaderboard({ enabled: open });

  if (!cloud) return null;

  return (
    <>
      {/* size="sm" để đứng ngang hàng với nút đăng nhập ngay cạnh. */}
      <Button size="sm" onClick={() => setOpen(true)}>
        🏆 Bảng xếp hạng
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Bảng xếp hạng">
        {loading ? (
          <div className="stack">
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
          </div>
        ) : error ? (
          // Không gộp lỗi vào "chưa có ai": đọc hỏng mà báo bảng trống thì
          // người ta đi tìm nhầm chỗ, tưởng chưa ai học.
          <Notice>⚠️ {error}</Notice>
        ) : rows.length === 0 ? (
          <Notice>Chưa có ai trên bảng.</Notice>
        ) : (
          <ol className="board">
            {rows.map((entry, i) => (
              <Row
                key={entry.uid}
                entry={entry}
                rank={i}
                isMe={entry.uid === me}
                // So với người dẫn đầu. Dẫn đầu luôn đầy dải; chia cho 1 khi
                // điểm cao nhất là 0 để khỏi ra NaN lúc chưa ai làm gì.
                pct={Math.round((entry.score / (rows[0].score || 1)) * 100)}
              />
            ))}
          </ol>
        )}

        {anonymous && !loading && (
          <Notice style={{ marginTop: 'var(--space-4)' }}>
            Bạn đang học ẩn danh nên chưa có tên trên bảng. Đăng nhập Google để lên bảng — tiến độ
            đang có vẫn giữ nguyên.
          </Notice>
        )}
      </Modal>
    </>
  );
}
