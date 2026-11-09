import { attendanceBulkSchema } from "@/lib/validations/eis";
import { readJson, requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";
import { attendanceService } from "@/server/services/eis";

export async function POST(request: Request) {
  try {
    const context = await requireApiContext();
    const input = await readJson(request, attendanceBulkSchema);
    const data = await attendanceService.saveDaily(context, input);

    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
