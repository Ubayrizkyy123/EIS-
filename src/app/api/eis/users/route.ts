import { requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { userService } from "@/server/services/eis";

export async function GET(request: Request) {
  try {
    const context = await requireApiContext();
    const searchParams = new URL(request.url).searchParams;

    return Response.json(await userService.list(context, searchParams));
  } catch (error) {
    return toErrorResponse(error);
  }
}
