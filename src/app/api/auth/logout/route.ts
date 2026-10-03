import { NextResponse, type NextRequest } from "next/server";
import { encerrarSessao } from "@/lib/auth/session";

async function sair(request: NextRequest) {
  await encerrarSessao();
  // 303 força GET no destino mesmo após POST.
  return NextResponse.redirect(new URL("/", request.url), 303);
}

export async function POST(request: NextRequest) {
  return sair(request);
}

export async function GET(request: NextRequest) {
  return sair(request);
}
