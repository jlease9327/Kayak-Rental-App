import { getLocations } from "@/lib/actions";
import { BookingWizard } from "./BookingWizard";

export default async function BookPage() {
  const locations = await getLocations();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-lg">
        <BookingWizard locations={locations} />
      </div>
    </div>
  );
}
