'use client';

import { useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { useProgress } from '@/features/progress/useProgress';
import { LessonSkeleton } from '@/features/lesson/LessonSkeleton';
import { MODES, practiceWords, selectWords } from './practice';
import { GameArt } from './GameArt';
import { PracticeSession } from './PracticeSession';
import { ClassicGameScreen } from './ClassicGameScreen';
import { MatchGame } from './MatchGame';

export function GameScreen({ slug, day }) {
  const t = useTranslation();
  const { ready, day: progress, setVocab, setStar } = useProgress(slug);
  const [filter, setFilter] = useState('all');
  const [accent, setAccent] = useState('us');
  const [mode, setMode] = useState(null);
  const [sessionWords, setSessionWords] = useState([]);
  const vocabulary = day.vocabulary;
  const selected = selectWords(vocabulary, progress, filter);
  const featured = MODES[0];
  const available = (id) => practiceWords(selected, id).length;

  function start(nextMode) {
    setSessionWords(selected);
    setMode(nextMode);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function home() { setMode(null); window.scrollTo({ top: 0, behavior: 'instant' }); }

  if (!ready) return <LessonSkeleton blocks={2} />;
  if (mode === 'classic') return <div className="arcade"><button className="arcade-secondary" onClick={home}>← {t('Back to games')}</button><ClassicGameScreen day={day} ready={ready} onMiss={(word) => setVocab(word.id, 'unknown')} /></div>;
  if (mode?.id === 'match') return <div className="arcade"><MatchGame words={sessionWords} accent={accent} onHome={home} onMiss={(word) => setVocab(word.id, 'unknown')} /></div>;
  if (mode) return <div className="arcade"><PracticeSession mode={mode} words={sessionWords} accent={accent} onHome={home} onMiss={(word, spelling) => {
    setVocab(word.id, 'unknown');
    if (spelling) setStar(word.id, true);
  }} /></div>;

  return (
    <div className="arcade arcade-home">
      <div className="arcade-welcome">
      <header className="arcade-heading">
        <span className="arcade-eyebrow">{day.title} <span aria-hidden="true">/</span> {t('VOCABULARY ARCADE')}</span>
        <div className="arcade-heading-row"><h1>{t('A little play.')}<br /><span>{t('A little progress.')}</span></h1><span className="arcade-headphone-badge" aria-hidden="true">♫</span></div>
        <p>{t('Headphones on. Make these words your own.')}</p>
      </header>
      <div className="arcade-overview" aria-label={t('Your practice collection')}>
        <div><strong>{available('spell')}</strong><span>{t('Listening words')}</span></div>
        <div><strong>{available('phrases')}</strong><span>{t('Phrases')}</span></div>
        <div><strong>{selectWords(vocabulary, progress, 'review').length}</strong><span>{t('Words to revisit')}</span></div>
      </div>
      </div>

      <div className="arcade-settings">
        <div className="arcade-filters" role="group" aria-label={t('Choose your words')}>
          {[['all', 'All words'], ['starred', 'Starred'], ['review', 'To review']].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{t(label)}</button>)}
        </div>
        <label className="arcade-accent"><span>{t('Audio')}</span><select value={accent} onChange={(event) => setAccent(event.target.value)} aria-label={t('Audio accent')}><option value="us">US</option><option value="uk">UK</option></select></label>
      </div>

      <div className="arcade-collection">
      <section className="arcade-featured arcade-tone-forest">
        <div className="arcade-featured-copy"><span className="arcade-eyebrow"><span className="arcade-live-dot" />{t('YOUR DAILY LISTENING MOMENT')}</span>
          <h2>{t(featured.title)}</h2><p>{t(featured.description)}</p>
          <div className="arcade-featured-meta">{t('{0} words', [Math.min(10, available('spell'))])} <span>·</span> {t('Your pace')}</div>
          <button className="arcade-primary" type="button" disabled={!available('spell')} onClick={() => start(featured)}>{t('Let us play')} <span aria-hidden="true">↗</span></button>
        </div>
        <GameArt kind="spell" className="arcade-featured-art" />
      </section>

      <div className="arcade-catalog">
      <div className="arcade-section-title"><h2>{t('Find your flow')}</h2><span>{t('{0} words ready', [available('spell')])}</span></div>
      {available('spell') === 0 && <div className="arcade-empty" role="status"><h3>{t('No words available yet')}</h3><p>{t(filter === 'all' ? 'These words need audio before listening practice is ready. The classic quiz is still available below.' : 'Try all words, or add words to this list from your flashcards.')}</p></div>}
      <div className="arcade-grid">
        {MODES.slice(1).map((game) => {
          const count = available(game.id);
          const disabled = count < (game.id === 'meaning' || game.id === 'match' ? 2 : 1);
          return <button type="button" className={`arcade-game-card arcade-tone-${game.tone}`} data-mode={game.id} key={game.id} onClick={() => start(game)} disabled={disabled}>
            <div className="arcade-card-art"><span className="arcade-game-tag">{t(game.tag)}</span><GameArt kind={game.id} /><span className="arcade-card-arrow" aria-hidden="true">↗</span></div>
            <div className="arcade-card-copy"><h3>{t(game.title)}</h3><p>{t(game.description)}</p><span className="arcade-card-meta">{count ? t('{0} words', [count]) : t('No matching words')} <span aria-hidden="true">·</span> {t(game.id === 'sprint' ? '60 seconds' : 'Your pace')}</span></div>
          </button>;
        })}
      </div>
      </div>
      </div>
      <button type="button" className="arcade-classic" onClick={() => start('classic')}>
        <GameArt kind="classic" /><div><span className="arcade-eyebrow">{t('AN OLD FAVORITE')}</span><h3>{t('Classic word quiz')}</h3><p>{t('English, Vietnamese, and a little recall.')}</p></div><span aria-hidden="true">→</span>
      </button>
      <p className="arcade-footnote">{t('Small sessions. Familiar words. A stronger memory.')}</p>
    </div>
  );
}
