import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB) || 50;
const MAX_FILE_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function POST(request: NextRequest) {
  try {
    const ip =
      (request as any).ip ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    try {
      applyRateLimit(ip);
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as any).status === 429
      ) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
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
        { error: `Payload exceeds ${MAX_UPLOAD_SIZE_MB}MB limit` },
        { status: 413 },
      );
    }

    const pinataFormData = new FormData();
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    pinataFormData.append("file", fileBlob, "encrypted-payload.bin");

    if (!process.env.PINATA_JWT) {
      console.error("Missing PINATA_JWT environment variable");
      return NextResponse.json(
        { error: "Storage service unconfigured" },
        { status: 500 },
      );
    }

    const pinataResponse = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error(`Pinata error: ${errorText}`);
      // Do not leak internal error details to the client
      throw new Error("Failed to pin file to IPFS");
    }

    const pinataData = await pinataResponse.json();

    return NextResponse.json(pinataData);
  } catch (err: any) {
    console.error("Upload Error:", err);
    // Return a sanitized error message to the client
    return NextResponse.json(
      { error: "An unexpected error occurred during upload" },
      { status: 500 },
    );
  }
}
