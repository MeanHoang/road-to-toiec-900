import './globals.css';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppShell } from '@/features/navigation/AppShell';
import { ACTIVE_EVENT, themeColorOf } from '@/shared/lib/event';

export const metadata = {
  title: 'Road to TOEIC 900',
  description: 'Học TOEIC hai kỹ năng — lý thuyết, từ vựng, luyện nghe',
};

// Màu thanh địa chỉ phải đi theo --bg của sự kiện đang chạy, không thì nó lệch
// hẳn so với trang trên điện thoại.
const themeColor = themeColorOf(ACTIVE_EVENT);

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: themeColor.dark },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-event={ACTIVE_EVENT || undefined}>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
