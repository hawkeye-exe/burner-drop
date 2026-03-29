import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    try {
      applyRateLimit(ip);
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        error.status === 429
      ) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        );
      }
      throw error;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Payload exceeds 50MB limit" },
        { status: 413 },
      );
    }

    const pinataFormData = new FormData();
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    pinataFormData.append("file", fileBlob, "encrypted-payload.bin");

    const pinataResponse = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      throw new Error(`Pinata error: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();

    return NextResponse.json(pinataData);
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
