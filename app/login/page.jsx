import LoginClient from './LoginClient';
import CaptchaWrapper from '@/components/CaptchaWrapper';

export const metadata = {
  title: `Masuk`,
  description: 'Masuk untuk menyimpan bookmark dan menikmati fitur lainnya di situs kami.',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function LoginPage() {
  return (
    <CaptchaWrapper>
      <LoginClient />
    </CaptchaWrapper>
  );
}
