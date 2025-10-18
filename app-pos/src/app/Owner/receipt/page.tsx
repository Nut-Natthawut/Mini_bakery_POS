import { requireOwnerPage } from '@/lib/page-guards';
import ReceiptPageClient from './ReceiptPageClient';

export default async function ReceiptPage() {
  await requireOwnerPage();
  return <ReceiptPageClient />;
}
