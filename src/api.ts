import type { ApiMethod, ApiPath, ApiRequestBody, ApiResponse } from "./types"

export const HEVY_API_BASE_URL = "https://api.hevyapp.com"

export class HevyApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`Hevy API error ${status}${body ? `: ${body}` : ""}`)
    this.name = "HevyApiError"
  }
}

export type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>

export interface RequestOptions<P extends ApiPath, M extends ApiMethod<P>> {
  apiKey: string
  path: P
  method: M
  query?: Record<string, string | number | boolean | undefined> | undefined
  pathParams?: Record<string, string | number> | undefined
  body?: ApiRequestBody<P, M> | undefined
  fetcher?: Fetcher | undefined
}

function interpolatePath(
  path: string,
  params: Record<string, string | number> = {},
): string {
  return path.replaceAll(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key]
    if (value === undefined) {
      throw new Error(`Missing path parameter: ${key}`)
    }
    return encodeURIComponent(String(value))
  })
}

function buildUrl(
  path: string,
  query: Record<string, string | number | boolean | undefined> = {},
): string {
  const url = new URL(path, HEVY_API_BASE_URL)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function request<P extends ApiPath, M extends ApiMethod<P>>(
  options: RequestOptions<P, M>,
): Promise<ApiResponse<P, M>> {
  const fetcher = options.fetcher ?? fetch
  const path = interpolatePath(options.path, options.pathParams)
  const url = buildUrl(path, options.query)
  const hasBody = options.body !== undefined

  const requestInit: RequestInit = {
    method: options.method.toUpperCase(),
    headers: {
      "api-key": options.apiKey,
      ...(hasBody ? { "content-type": "application/json" } : {}),
    },
  }
  if (hasBody) {
    requestInit.body = JSON.stringify(options.body)
  }

  const response = await fetcher(url, requestInit)

  const text = await response.text()
  if (!response.ok) {
    throw new HevyApiError(response.status, url, text)
  }

  if (!text) {
    return undefined as ApiResponse<P, M>
  }

  return JSON.parse(text) as ApiResponse<P, M>
}

export async function fetchAllPages<
  T extends Record<string, unknown>,
>(options: {
  fetchPage(page: number): Promise<T>
  arrayKey: string
  startPage?: number | undefined
}): Promise<T> {
  const startPage = options.startPage ?? 1
  const firstPage = await options.fetchPage(startPage)
  const pageCount = Number(firstPage.page_count ?? startPage)
  const firstValues = firstPage[options.arrayKey as keyof T]
  const values: unknown[] = Array.isArray(firstValues) ? [...firstValues] : []

  const remainingPages = Array.from(
    { length: Math.max(pageCount - startPage, 0) },
    (_, index) => startPage + index + 1,
  )
  const remainingResults = await Promise.all(
    remainingPages.map((page) => options.fetchPage(page)),
  )

  for (const nextPage of remainingResults) {
    const nextValues = nextPage[options.arrayKey as keyof T]
    if (Array.isArray(nextValues)) {
      values.push(...nextValues)
    }
  }

  return {
    ...firstPage,
    page: startPage,
    page_count: pageCount,
    [options.arrayKey]: values,
  }
}
