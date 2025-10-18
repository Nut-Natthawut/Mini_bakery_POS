import { requireOwnerPage } from '@/lib/page-guards';
import SalePageClient from './SalePageClient';

export default async function SalePage() {
  await requireOwnerPage();
  return <SalePageClient />;
}
