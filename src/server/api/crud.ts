import "server-only";

import type { ZodType } from "zod";

import type { ApiContext } from "@/lib/api";
import { readJson, requireApiContext } from "@/lib/api";
import { toErrorResponse } from "@/lib/api-error";

type ItemContext = { params: Promise<{ id: string }> };

export type CollectionService<TCreate> = {
  list(context: ApiContext, searchParams: URLSearchParams): Promise<unknown>;
  create(context: ApiContext, input: TCreate): Promise<unknown>;
};

export type ItemService<TUpdate> = {
  get(context: ApiContext, id: string): Promise<unknown>;
  update(context: ApiContext, id: string, input: TUpdate): Promise<unknown>;
  remove(context: ApiContext, id: string): Promise<unknown>;
};

export function makeCollectionRoutes<TCreate>(
  service: CollectionService<TCreate>,
  createSchema: ZodType<TCreate>,
) {
  async function GET(request: Request) {
    try {
      const context = await requireApiContext();
      const searchParams = new URL(request.url).searchParams;

      return Response.json(await service.list(context, searchParams));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async function POST(request: Request) {
    try {
      const context = await requireApiContext();
      const input = await readJson(request, createSchema);
      const data = await service.create(context, input);

      return Response.json({ data }, { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  return { GET, POST };
}

export function makeItemRoutes<TUpdate>(
  service: ItemService<TUpdate>,
  updateSchema: ZodType<TUpdate>,
) {
  async function GET(_request: Request, context: ItemContext) {
    try {
      const apiContext = await requireApiContext();
      const { id } = await context.params;

      return Response.json({ data: await service.get(apiContext, id) });
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async function PATCH(request: Request, context: ItemContext) {
    try {
      const apiContext = await requireApiContext();
      const { id } = await context.params;
      const input = await readJson(request, updateSchema);
      const data = await service.update(apiContext, id, input);

      return Response.json({ data });
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async function DELETE(_request: Request, context: ItemContext) {
    try {
      const apiContext = await requireApiContext();
      const { id } = await context.params;
      const data = await service.remove(apiContext, id);

      return Response.json({ data });
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  return { GET, PATCH, DELETE };
}
