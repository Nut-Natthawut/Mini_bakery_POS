import CategoryForm from './categoryForm';
import { requireOwnerPage } from '@/lib/page-guards';

const CategoryPage = async () => {
  await requireOwnerPage();
  return (
    <CategoryForm />
  )
}
export default CategoryPage