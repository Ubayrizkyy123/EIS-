import { requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { alertService } from "@/server/services/eis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;
    const data = await alertService.resolve(apiContext, id);

    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
