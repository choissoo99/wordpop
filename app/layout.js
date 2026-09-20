import './globals.css';

export const metadata = {
  title: 'WordPop | 발음부터 팝송까지',
  description: '영어 또는 한글을 검색하면 발음기호, 뜻, 예문, 관련 단어와 팝송을 한 번에 보여주는 영어 학습 사이트',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
