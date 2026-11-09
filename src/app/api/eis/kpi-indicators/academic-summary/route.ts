import { requireApiContext, requireRoles } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { KPI_READ_ROLES } from "@/lib/permissions";
import { getAcademicKpiSummary } from "@/server/queries/academic-kpi";

export async function GET(request: Request) {
  try {
    const context = await requireApiContext();
    requireRoles(context, KPI_READ_ROLES);

    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId") ?? undefined;

    const summary = await getAcademicKpiSummary(academicYearId);

    return Response.json({ data: summary });
  } catch (error) {
    return toErrorResponse(error);
  }
}

