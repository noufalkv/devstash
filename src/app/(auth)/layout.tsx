import { HomeNav } from "@/components/homepage/home-nav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HomeNav />
      {/* pt-22 = the fixed 64px nav + the usual 24px padding */}
      <main className="flex flex-1 items-center justify-center p-6 pt-22">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
