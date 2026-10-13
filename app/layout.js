import './globals.css';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/features/language/LanguageProvider';
import { LANGUAGE_COOKIE, languageOf } from '@/features/language/translate';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppShell } from '@/features/navigation/AppShell';
import { ACTIVE_EVENT, themeColorOf } from '@/shared/lib/event';

export const metadata = {
  title: 'Road to TOEIC 900',
  description: 'TOEIC listening and reading practice — theory, vocabulary, and listening drills',
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

export default async function RootLayout({ children }) {
  const locale = languageOf((await cookies()).get(LANGUAGE_COOKIE)?.value);
  return (
    <html lang={locale} data-event={ACTIVE_EVENT || undefined}>
      <body>
        <LanguageProvider initialLocale={locale}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
