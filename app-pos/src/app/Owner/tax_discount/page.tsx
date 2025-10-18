import DiscoutManage from "./discoutmanage";
import { requireOwnerPage } from "@/lib/page-guards";

export default async function TaxDiscountPage() {
  await requireOwnerPage();
  return <DiscoutManage />;
}
