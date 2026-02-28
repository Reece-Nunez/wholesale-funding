import RecaptchaProvider from '../components/RecaptchaProvider';

export const metadata = {
  title: 'Apply | Wholesale Funding Solutions',
  description: 'Submit your business funding application. Same-day approvals, funding in 24-48 hours.',
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <RecaptchaProvider>{children}</RecaptchaProvider>;
}
