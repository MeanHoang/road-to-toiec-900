'use client';

import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Màn kết thúc một lượt: điểm, và danh sách từ vừa bị đẩy về nhóm chưa học. */
export function GameResult({ score, total, missed, onReplay }) {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: 'var(--space-3) 0 var(--space-5)' }}>
        <div style={{ fontSize: 'var(--text-4xl)' }}>{score.wrong === 0 ? '🏆' : '📊'}</div>
        <h2 style={{ margin: 'var(--space-3) 0 var(--space-1)' }}>
          {score.right} / {total} correct
        </h2>
        <p className="section-lead" style={{ margin: '0 auto' }}>
          {score.wrong === 0
            ? 'Perfect score! All words keep their current learning status.'
            : `${missed.length} words were marked as To learn in your flashcards.`}
        </p>
      </div>

      {missed.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Missed words</th>
                <th>Meaning</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {missed.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.word}</strong> <span className="ipa">{m.ipa.us}</span>
                  </td>
                  <td>{m.meaningVi}</td>
                  <td>
                    <Speak text={m.word} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="row row-end" style={{ marginTop: 'var(--space-4)' }}>
        <Button variant="primary" onClick={onReplay}>
          Play again
        </Button>
      </div>
    </Card>
  );
}
