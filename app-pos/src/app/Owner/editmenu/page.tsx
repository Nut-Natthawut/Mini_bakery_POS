import MenuList from './menuList';
import { redirect } from 'next/navigation';
import { getTokenPayload } from '@/lib/auth-helpers';  


export default async function EditMenuPage() {
  const payload = getTokenPayload();
  if (!payload || payload.role !== 'Owner') {
    redirect('/unauthorized');
  }
  return (
    <div className="w-full p-8">
      <MenuList />
    </div>
  );
};

