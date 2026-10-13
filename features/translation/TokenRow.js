'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { isMarkWrong, LABELS } from './marks';

/**
 * Dãy cụm từ của một câu, cộng bảng chọn nhãn.
 *
 * Cụm đang chọn là state của riêng khối này — màn hình bên ngoài không cần biết
 * người học đang trỏ vào cụm nào, nó chỉ cần biết nhãn cuối cùng.
 */
export function TokenRow({ question, marks, checked, onAssign }) {
  const t = useTranslation();
  const [sel, setSel] = useState(null);

  const assign = (label) => {
    if (sel == null) return;
    onAssign(sel, label);
    setSel(null);
  };

  return (
    <>
      <div className="tokens">
        {question.tokens.map((tok, i) => {
          const mark = marks[i];
          const wrong = checked && isMarkWrong(marks, question.key, i);
          return (
            <button
              key={i}
              type="button"
              className={[
                'token',
                mark && `is-${mark.toLowerCase()}`,
                sel === i && 'is-selected',
                wrong && 'is-wrong',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !checked && setSel(sel === i ? null : i)}
            >
              {tok}
            </button>
          );
        })}
      </div>

      {!checked && (
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          {sel == null ? (
            <span className="caption">{t('Select a phrase above to label it')}</span>
          ) : (
            <>
              <span className="caption">{t('Label “')}{question.tokens[sel]}&rdquo;:</span>
              {LABELS.map((l) => (
                <Button key={l.key} size="sm" onClick={() => assign(l.key)}>
                  <Badge tone={l.tone}>{l.key}</Badge>
                  {t(l.text)}
                </Button>
              ))}
              <Button variant="quiet" size="sm" onClick={() => assign(null)}>
                {t('Clear label')}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
