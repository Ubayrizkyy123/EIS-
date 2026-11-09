import { requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { activityLogService } from "@/server/services/eis";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;

    return Response.json({ data: await activityLogService.get(apiContext, id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
