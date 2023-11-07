import { textract } from "@/lib/textract";
import { DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { dataUrl } = await req.json();

  // Convert dataUrl to byte Uint8Array base 64
  const blob = Buffer.from(dataUrl.split(",")[1], "base64");

  const params = {
    Document: {
      Bytes: blob,
    },
    FeatureTypes: ["TABLES", "FORMS"],
  };

  try {
    const data = await textract.send(new DetectDocumentTextCommand(params));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error calling Textract:", error);
    return NextResponse.json(
      { error: "Failed to process the document" },
      { status: 500 }
    );
  }
}