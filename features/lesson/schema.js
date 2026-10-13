// Hình dạng của một buổi học và cách ghép các file collection lại.
// Không phụ thuộc nguồn: import tĩnh trong repo hay Firestore đều dùng chung.

import { englishMetadata } from '../../shared/lib/englishLabels.js';

export const SCHEMA_VERSION = 1;

/**
 * Gộp các file collection của một buổi thành object phẳng cho component dùng.
 * `has()` để màn tổng quan ẩn hoạt động mà buổi đó không có.
 */
export function assemble(slug, files) {
  if (!files?.day) return null;
  const { day, ...collections } = files;

  for (const [name, file] of Object.entries(collections)) {
    if (!file) continue;
    if (file.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `${slug}/${name} uses schemaVersion ${file.schemaVersion}; the app expects ${SCHEMA_VERSION}.`,
      );
    }
    if (file.day !== slug) {
      throw new Error(`${slug}/${name} belongs to day="${file.day}" instead of ${slug}.`);
    }
  }

  const has = (name) => day.collections?.includes(name) && !!collections[name];
  const items = (name) => (has(name) ? collections[name].items.map(englishMetadata) : []);

  return {
    ...englishMetadata(day),
    has,
    grammar: items('grammar'),
    theory: items('theory'),
    vocabulary: items('vocabulary'),
    translation: items('translation'),
    listening: items('listening'),
    pictures: items('pictures'),
    quiz: items('quiz'),
    exercises: items('exercises'),
  };
}
