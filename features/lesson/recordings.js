// Cloud vocabulary may still reference old macOS files. Prefer the bundled neural
// replacement only when both ID and spoken text match; never change the word.
export function mergeVocabularyAudio(vocabulary, bundled) {
  const local = new Map(bundled.map((word) => [word.id, word]));
  return vocabulary.map((word) => {
    const candidate = local.get(word.id);
    if (candidate?.word !== word.word) return word;
    const voice = { ...candidate.voice, ...word.voice };
    for (const accent of ['us', 'uk']) {
      if (candidate.voice?.[accent]?.includes('/voice-neural/')) voice[accent] = candidate.voice[accent];
    }
    return { ...word, voice };
  });
}
