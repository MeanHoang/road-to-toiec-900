// Mấy con số đếm được từ một buổi học. Nhiều màn cùng cần nên gom lại đây.

/** Tổng số câu nghe của một buổi. */
export const countQuestions = (day) =>
  day.listening.reduce((n, set) => n + set.questions.length, 0);

/** Tổng số ảnh trong bài từ vựng qua hình. */
export const countPictures = (day) =>
  day.pictures.reduce((n, set) => n + set.questions.length, 0);
