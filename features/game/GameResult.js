'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { Pagination } from '@/shared/ui/molecules/Pagination';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Màn kết thúc một lượt: điểm, và danh sách từ vừa bị đẩy về nhóm chưa học. */
export function GameResult({ score, total, missed, onReplay }) {
  const t = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 4;
  return (
    <Card className="classic-result">
      <div style={{ textAlign: 'center', padding: 'var(--space-3) 0 var(--space-5)' }}>
        <div style={{ fontSize: 'var(--text-4xl)' }}>{score.wrong === 0 ? '🏆' : '📊'}</div>
        <h2 style={{ margin: 'var(--space-3) 0 var(--space-1)' }}>
          {score.right} / {total} {t('correct')}
        </h2>
        <p className="section-lead" style={{ margin: '0 auto' }}>
          {score.wrong === 0
            ? t('Perfect score! All words keep their current learning status.')
            : t('{0} words were marked as To learn in your flashcards.', [missed.length])}
        </p>
      </div>

      {missed.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('Missed words')}</th>
                <th>{t('Meaning')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {missed.slice(page * pageSize, (page + 1) * pageSize).map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.word}</strong> <span className="ipa">{m.ipa.us}</span>
                  </td>
                  <td>{m.meaningVi}</td>
                  <td>
                    <Speak text={m.word} src={m.voice?.us || m.voice?.uk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {missed.length > 0 && <Pagination page={page} total={missed.length} pageSize={pageSize} onChange={setPage} />}
      <div className="row row-end" style={{ marginTop: 'var(--space-4)' }}>
        <Button variant="primary" onClick={onReplay}>
          {t('Play again')}
        </Button>
      </div>
    </Card>
  );
}
