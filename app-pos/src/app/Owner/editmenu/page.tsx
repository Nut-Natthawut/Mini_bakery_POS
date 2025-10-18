import MenuList from './menuList';
import { requireOwnerPage } from '@/lib/page-guards';

export default async function EditMenuPage() {
  await requireOwnerPage();
  return (
    <div className="w-full p-8">
      <MenuList />
    </div>
  );
}

