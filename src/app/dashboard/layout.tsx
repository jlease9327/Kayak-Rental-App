import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { logout } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await verifySession();
  if (!authed) redirect("/login");

  return (
    <div className="relative flex-1">
      <form action={logout} className="absolute right-4 top-4 sm:right-8">
        <button
          type="submit"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Log out
        </button>
      </form>
      {children}
    </div>
  );
}
