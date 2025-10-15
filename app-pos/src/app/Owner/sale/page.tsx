import { requireOwnerPage } from '@/lib/page-guards';

const SalePage = async () => {
  await requireOwnerPage();
  return (
    <div>SalePage</div>
  )
}
export default SalePage