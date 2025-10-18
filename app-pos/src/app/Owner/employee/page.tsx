import { requireOwnerPage } from '@/lib/page-guards';
import EmployeesPageClient from './EmployeesPageClient';

export default async function EmployeesPage() {
  await requireOwnerPage();
  return <EmployeesPageClient />;
}
