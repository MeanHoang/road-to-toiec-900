/**
 * Nói thẳng đáp án ở đây từ đâu ra.
 *
 * Cô không phát đáp án chính thức cho phần này, nên đáp án dùng để chấm là do
 * máy nghe lại audio rồi chép ra — sai vài từ là chuyện bình thường. Người học
 * phải biết điều đó TRƯỚC khi bị báo sai, nếu không họ sẽ tự sửa bài đúng của
 * mình thành bài sai theo máy.
 *
 * Dùng ở cả hai panel chép nên để chung một chỗ: hai bản chữ khác nhau thì
 * kiểu gì cũng có một bản bị bỏ quên.
 */
export function AnswerNote() {
  return (
    <p className="caption">
      Đáp án ở đây do AI nghe audio chép lại nên <strong>có thể sai</strong> — cô không có đáp án
      chính thức cho phần này. Thấy chỗ nào sai thì{' '}
      <a
        href="https://www.facebook.com/mhoang0000/"
        target="_blank"
        rel="noopener noreferrer"
      >
        ib
      </a>{' '}
      cho mình nhé.
    </p>
  );
}
