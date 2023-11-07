"use client";

import { pdfToImg } from "@/lib/pdf-to-img";
import { useState } from "react";
import Link from "next/link";

// Enum for tracking the status of file uploads/processing.
enum Status {
  IDLE,
  UPLOADING,
  ANALYZING,
  SUCCESS,
  ERROR,
}

export default function Home() {
  const [pdfContent, setPdfContent] = useState<string[]>([]);
  const [status, setStatus] = useState(Status.IDLE);
  const [pagesFinished, setPagesFinished] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Handle extraction of text from the uploaded PDF.
  const handleExtractPdf = async (file: File) => {
    if (!file) return;
    try {
      // Convert each PDF page to image for OCR.
      const images = await pdfToImg(file);
      setTotalPages(images.length);
      setStatus(Status.ANALYZING);
      const pages = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const text = await runOCR(image);
        const textArray = text?.map((item: { Text: string }) => item.Text);
        pages.push(textArray?.join(" "));
        setPagesFinished(i + 1);
      }
      return pages;
    } catch (error) {
      console.error("Error extracting PDF:", error);
      setStatus(Status.ERROR);
    }
  };

  // Function to run OCR on an image.
  const runOCR = async (imageUrl: string) => {
    try {
      // Call to API endpoint to perform OCR.
      const response = await fetch("/api/textract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataUrl: imageUrl }),
      });

      const data = await response.json();
      return data?.Blocks.filter(
        (item: { BlockType: string }) => item.BlockType === "LINE"
      );
    } catch (error) {
      console.log("err", error);
    }
  };

  // Handle changes for PDF upload.
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;
    const file = files[0];
    setStatus(Status.UPLOADING);
    const pdfContent = await handleExtractPdf(file);
    const formattedPdfContent = pdfContent?.map(
      (item: string, index: number) => `Page ${index + 1}:\n${item}\n\n`
    );
    setTimeout(() => {
      setStatus(Status.SUCCESS);
      setPdfContent(formattedPdfContent!);
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center sm:p-24 p-4">
      <h4 className="text-2xl font-semibold">
        Extract text from PDFs using Next.js 13
      </h4>

      <Link
        href={"https://arshadyaseen.com/nextjs-pdf-extract-ocr"}
        className="underline mt-3 underline-offset-[3px] mb-24"
      >
        How built this?
      </Link>

      {
        {
          [Status.IDLE]: (
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="ml-28"
            />
          ),
          [Status.UPLOADING]: <p>Uploading PDF...</p>,
          [Status.ANALYZING]: (
            <p className="text-center">
              Analyzing PDF... <br />
              {pagesFinished} of {totalPages} pages analyzed.
            </p>
          ),
          [Status.SUCCESS]: <p>PDF successfully analyzed</p>,
          [Status.ERROR]: <p>Error analyzing PDF.</p>,
        }[status]
      }

      {pdfContent &&
        pdfContent.map((page, index) => (
          <div
            key={index}
            className="sm:w-[800px] w-full mt-6 bg-background border border-input rounded-md p-6"
          >
            <p className="text-lg font-medium mt-4">Page {index + 1}</p>
            <p className="mt-4">{page}</p>
          </div>
        ))}
    </main>
  );
}
