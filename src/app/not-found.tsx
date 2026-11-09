import type { Metadata } from "next";

import { NotFoundState } from "@/components/system/not-found-state";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return <NotFoundState fullScreen />;
}
