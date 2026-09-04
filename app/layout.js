import './globals.css';

export const metadata = {
  title: 'Road to TOEIC 900',
  description: 'Học TOEIC hai kỹ năng — lý thuyết, từ vựng, luyện nghe',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f8fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0d131d' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
