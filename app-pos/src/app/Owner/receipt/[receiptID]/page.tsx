import { requireOwnerPage } from '@/lib/page-guards';
import ReceiptDetailPageClient from './ReceiptDetailPageClient';

type ReceiptDetailPageProps = {
  params: { receiptID: string };
};

export default async function ReceiptDetailPage({ params }: ReceiptDetailPageProps) {
  await requireOwnerPage();
  return <ReceiptDetailPageClient receiptID={params.receiptID} />;
}
