import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white px-6 py-24 text-center dark:from-sky-950 dark:to-black">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
        Paddle Point Kayak Rentals
      </p>
      <h1 className="mt-3 max-w-lg text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Book your kayak in under a minute
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Pick up at one of our launch points, or have us deliver straight to
        you.
      </p>
      <Link
        href="/book"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-sky-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
      >
        Book Now
      </Link>

      <div className="mt-16 flex gap-6 text-sm text-zinc-400">
        <Link href="/dashboard" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Owner dashboard
        </Link>
        <span>·</span>
        <Link href="/qr" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Get QR code
        </Link>
      </div>
    </div>
  );
}
