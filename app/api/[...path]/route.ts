import { NextResponse } from "next/server"

const API_URL = process.env.API_URL || "https://localhost:7163/api"
const API_KEY = process.env.API_KEY
const API_KEY_HEADER = process.env.API_KEY_HEADER || "X-API-KEY"
const ALLOW_SELF_SIGNED_CERT = process.env.ALLOW_SELF_SIGNED_CERT === "true"

// Allow self-signed certificates in development
if (ALLOW_SELF_SIGNED_CERT) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

async function proxyRequest(request: Request, pathSegments?: string[]) {
  const requestUrl = new URL(request.url)
  const trimmedBase = API_URL.replace(/\/$/, "")
  const path = pathSegments?.length ? `/${pathSegments.join("/")}` : ""
  const targetUrl = new URL(`${trimmedBase}${path}`)
  targetUrl.search = requestUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  if (API_KEY) {
    headers.set(API_KEY_HEADER, API_KEY)
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : request.body
  const fetchOptions: RequestInit & { duplex?: string } = {
    method: request.method,
    headers,
    body,
    redirect: "follow",
  }

  // Required for streaming bodies in Node.js 18+
  if (body) {
    fetchOptions.duplex = "half"
  }

  const response = await fetch(targetUrl.toString(), fetchOptions)

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}
