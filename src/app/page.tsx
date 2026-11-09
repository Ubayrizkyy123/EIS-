import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Database,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Data akademik terpusat",
    description:
      "Kelola siswa, guru, kelas, mata pelajaran, dan tahun ajaran dalam satu sistem.",
    icon: GraduationCap,
  },
  {
    title: "Absensi dan jadwal",
    description:
      "Pantau kehadiran harian serta jadwal pelajaran setiap kelas secara real-time.",
    icon: CalendarCheck,
  },
  {
    title: "Nilai yang terukur",
    description:
      "Lihat rata-rata nilai per mata pelajaran dan perkembangan siswa dari database.",
    icon: LayoutDashboard,
  },
  {
    title: "Database terintegrasi",
    description:
      "Prisma ORM dengan PostgreSQL, migrasi, seed, dan tipe data yang aman.",
    icon: Database,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              E
            </span>
            EIS Sekolah
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Masuk
            </Link>
            <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            Sistem Informasi Sekolah
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Kelola akademik sekolah dengan lebih terarah
          </h1>
          <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            EIS Sekolah menyatukan data siswa, guru, kelas, absensi, jadwal, dan
            nilai dalam satu dashboard yang terhubung langsung ke database.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", className: "gap-2" })}
            >
              Masuk ke dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/api/health"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Cek status sistem
            </Link>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 size-5 text-muted-foreground" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Akun sekolah Anda sudah siap?
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Masuk menggunakan akun yang diberikan administrator untuk melihat
              ringkasan akademik sekolah.
            </p>
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Masuk sekarang
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© EIS Sekolah. Semua hak dilindungi.</p>
          <p>Dibangun dengan Next.js, Prisma, dan Auth.js.</p>
        </div>
      </footer>
    </div>
  );
}
