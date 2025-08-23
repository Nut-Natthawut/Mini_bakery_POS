import { redirect } from "next/navigation";
import LoginPage from "./login/page";

export default function HomePage() {
  return (
    <div>
      <LoginPage></LoginPage>
    </div>
  );
}
