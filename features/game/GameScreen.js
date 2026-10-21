'use client';

import { useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { useProgress } from '@/features/progress/useProgress';
import { LessonSkeleton } from '@/features/lesson/LessonSkeleton';
import { MODES, practiceWords, selectWords } from './practice';
import { GameArt } from './GameArt';
import { PracticeSession } from './PracticeSession';
import { ClassicGameScreen } from './ClassicGameScreen';
import { Select } from '@/shared/ui/atoms/Select';
import { Icon } from '@/shared/ui/atoms/Icon';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
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
      <PageHeader eyebrow={day.title} title={t('Vocabulary game')} subtitle={t('Listen, spell, and match the words in this lesson.')} />
      <div className="arcade-settings">
        <div className="arcade-filters" role="group" aria-label={t('Choose your words')}>
          {[['all', 'All words'], ['starred', 'Starred'], ['review', 'To review']].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{t(label)}</button>)}
        </div>
        <label className="arcade-accent"><Icon name="headphones" size={18} /><span>{t('Audio')}</span><Select value={accent} onChange={(event) => setAccent(event.target.value)} aria-label={t('Audio accent')}><option value="us">{t('American audio')}</option><option value="uk">{t('British audio')}</option></Select></label>
      </div>

      {available('spell') === 0 && <div className="arcade-empty" role="status"><h3>{t('No words available yet')}</h3><p>{t(filter === 'all' ? 'These words need audio before listening practice is ready. The classic quiz is still available below.' : 'Try all words, or add words to this list from your flashcards.')}</p></div>}
      <div className="arcade-grid">
        {MODES.map((game) => {
          const count = available(game.id);
          const disabled = count < (game.id === 'meaning' || game.id === 'match' ? 2 : 1);
          return <button type="button" className={`arcade-game-card arcade-tone-${game.tone}`} data-mode={game.id} key={game.id} onClick={() => start(game)} disabled={disabled}>
            <div className="arcade-card-art"><span className="arcade-game-tag">{t(game.tag)}</span><GameArt kind={game.id} /><span className="arcade-card-arrow" aria-hidden="true">↗</span></div>
            <div className="arcade-card-copy"><h3>{t(game.title)}</h3><p>{t(game.description)}</p><span className="arcade-card-meta">{count ? t('{0} words', [count]) : t('No matching words')} <span aria-hidden="true">·</span> {t(game.id === 'sprint' ? '60 seconds' : 'Your pace')}</span></div>
          </button>;
        })}
      </div>
      <button type="button" className="arcade-classic" onClick={() => start('classic')}>
        <GameArt kind="classic" /><div><h3>{t('Classic word quiz')}</h3><p>{t('English, Vietnamese, and a little recall.')}</p></div><span aria-hidden="true">→</span>
      </button>

    </div>
  );
}
