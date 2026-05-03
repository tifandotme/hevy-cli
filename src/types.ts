import type { paths } from "./generated/hevy-openapi"

export type ApiPath = keyof paths
export type ApiMethod<P extends ApiPath> = keyof paths[P] &
  ("get" | "post" | "put" | "delete" | "patch")

type Operation<P extends ApiPath, M extends ApiMethod<P>> = paths[P][M]

type JsonContent<T> = T extends { content: { "application/json": infer Body } }
  ? Body
  : unknown

type ResponseMap<P extends ApiPath, M extends ApiMethod<P>> =
  Operation<P, M> extends { responses: infer Responses } ? Responses : never

type SuccessStatus = 200 | 201 | 202 | 204

type SuccessResponseObject<
  P extends ApiPath,
  M extends ApiMethod<P>,
> = ResponseMap<P, M>[keyof ResponseMap<P, M> & SuccessStatus]

export type ApiResponse<
  P extends ApiPath,
  M extends ApiMethod<P>,
> = JsonContent<SuccessResponseObject<P, M>>

export type ApiRequestBody<P extends ApiPath, M extends ApiMethod<P>> =
  Operation<P, M> extends {
    requestBody?: { content: { "application/json": infer Body } }
  }
    ? Body
    : never

export type JsonObject = Record<string, unknown>
