import { financeVoidSchema } from "@/lib/validations/eis";
import { readJson, requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { financeService } from "@/server/services/eis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;
    const input = await readJson(request, financeVoidSchema);
    const data = await financeService.void(apiContext, id, input.reason);

    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
