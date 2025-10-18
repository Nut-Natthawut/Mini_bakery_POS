import { requireOwnerPage } from '@/lib/page-guards';
import ReportPageClient from './ReportPageClient';

export default async function ReportPage() {
  await requireOwnerPage();
  return <ReportPageClient />;
}
