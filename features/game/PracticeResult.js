'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Speak } from '@/shared/ui/molecules/Speak';
import { GameArt } from './GameArt';

export function PracticeResult({ results, sprint, onRetry, onHome }) {
  const t = useTranslation();
  const right = results.filter((r) => r.correct).length;
  const missed = [...new Map(results.filter((r) => !r.correct).map((r) => [r.word.id, r.word])).values()];
  return (
    <section className="arcade-result">
      <div className="arcade-result-art arcade-tone-mint"><GameArt kind={sprint ? 'sprint' : 'spell'} /></div>
      <span className="arcade-eyebrow">{t('SESSION COMPLETE')}</span>
      <h1>{t('Results')}</h1>
      {missed.length > 0 && <p>{t('These words are saved to your review list.')}</p>}
      <div className="arcade-result-stats">
        <div><strong>{right}<small> / {results.length}</small></strong><span>{t('Correct answers')}</span></div>
        <div><strong>{results.length ? Math.round(right / results.length * 100) : 0}<small>%</small></strong><span>{t('Accuracy')}</span></div>
        <div><strong>{missed.length}</strong><span>{t('Words to revisit')}</span></div>
      </div>
      {missed.length > 0 && <div className="arcade-review-list">
        <h2>{t('Words to revisit')}</h2>
        <p>{t('These words are saved to your review list.')}</p>
        {missed.map((word) => <div className="arcade-review-word" key={word.id}>
          <div><strong>{word.word}</strong><span>{word.meaningVi}</span></div>
          <Speak text={word.word} src={word.voice?.us || word.voice?.uk} />
        </div>)}
      </div>}
      <div className="arcade-result-actions">
        <button className="arcade-primary" type="button" onClick={() => onRetry(missed.length ? missed : null)}>{missed.length ? t('Practice missed words') : t('Play another round')} <span aria-hidden="true">→</span></button>
        <button className="arcade-secondary" type="button" onClick={onHome}>{t('Back to games')}</button>
      </div>
    </section>
  );
}
