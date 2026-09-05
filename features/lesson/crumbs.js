// Breadcrumb của mọi màn trong một buổi học.
//
// Bảy màn con đều tự dựng lại mảng này bằng tay, và DayGate dựng thêm một bản
// nữa cho lúc đang tải — sửa nhãn "Trang chủ" là phải sửa tám chỗ. Giờ một chỗ.

/**
 * @param slug     buổi học, để trỏ về màn tổng quan
 * @param dayTitle nhãn của buổi, thường là day.title
 * @param trail    các cấp sau đó: chuỗi (cấp cuối) hoặc { label, href }
 */
export function lessonCrumbs(slug, dayTitle, ...trail) {
  const home = { label: 'Trang chủ', href: '/' };
  if (!trail.length) return [home, { label: dayTitle }];

  return [
    home,
    { label: dayTitle, href: `/day/${slug}` },
    ...trail.map((step) => (typeof step === 'string' ? { label: step } : step)),
  ];
}
