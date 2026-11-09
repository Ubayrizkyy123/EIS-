import { readJson, requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { userUpdateSchema } from "@/lib/validations/eis";
import { userService } from "@/server/services/eis";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;

    return Response.json({ data: await userService.get(apiContext, id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;
    const input = await readJson(request, userUpdateSchema);
    const data = await userService.update(apiContext, id, input);

    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const apiContext = await requireApiContext();
    const { id } = await context.params;
    const data = await userService.remove(apiContext, id);

    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
