import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  searchParams.set("page", String(page));

  return `${basePath}?${searchParams.toString()}`;
}

export function Pagination({
  basePath,
  page,
  totalPages,
  params,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(basePath, params, page - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Sebelumnya
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={pageHref(basePath, params, page + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Berikutnya
          </Link>
        ) : null}
      </div>
    </div>
  );
}
