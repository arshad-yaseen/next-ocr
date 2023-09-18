"use client";

import { createWorker } from "tesseract.js";
import { pdfToImg } from "@/lib/pdf-to-img";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [pdfContent, setPdfContent] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtractPdf = async (file: File) => {
    if (!file) return;
    try {
      const images = await pdfToImg(file);
      const pages = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const worker = await createWorker({
          logger: (m) => setStatus(m.status),
        });

        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        const {
          data: { text },
        } = await worker.recognize(image);

        // Pushing the extracted text from each page to the pages array
        pages.push(text);

        await worker.terminate();
      }

      return pages;
    } catch (error) {
      console.error("Error extracting PDF:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;
    const file = files[0];
    setLoading(true);
    const pdfContent = await handleExtractPdf(file);
    setLoading(false);
    setPdfContent(pdfContent!);
  };

  return (
    <main className="flex min-h-screen flex-col items-center sm:p-24 p-4">

<h4 className="text-2xl font-semibold" >
          Extract text from PDFs using Next.js 13
        </h4>

        <Link
        href={"https://arshadyaseen.com/nextjs-pdf-extract-ocr"}
        className="underline mt-3 underline-offset-[3px] mb-24"
        >
          How built this?
        </Link>

      <input type="file" accept=".pdf" onChange={handleFileUpload} className="ml-28" />

      {
        loading && status && (
          <p className="mt-28">
            {status}
          </p>
        )
      }

      {pdfContent &&
        pdfContent.map((page, index) => (
          <div
            key={index}
            className="sm:w-[800px] w-full mt-6 bg-background border border-input rounded-md p-6"
          >
            <p className="text-lg font-medium mt-4">
              Page {index + 1}
            </p>
            <p className="mt-4">{page}</p>
          </div>
        ))}
    </main>
  );
}
