export function getPagination(searchParams: URLSearchParams) {
  const rawPage = Number(searchParams.get("page") ?? "1");
  const rawLimit = Number(searchParams.get("limit") ?? "25");
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.trunc(rawLimit)))
    : 25;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export function optionalSearch(searchParams: URLSearchParams) {
  const search = searchParams.get("search")?.trim();
  return search ? search : undefined;
}
