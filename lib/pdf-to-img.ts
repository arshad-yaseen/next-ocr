// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { PDFPageProxy } from "pdfjs-dist/types/src/display/api";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const loadPdf = async (file: File): Promise<PDFPageProxy[]> => {
  let uri: string
  uri = URL.createObjectURL(file)
  const pdf = await pdfjsLib.getDocument({ url: uri }).promise;

  const pages: pdfjsLib.PDFPageProxy[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    pages.push(page);
  }
  return pages;
};

const renderPageToImage = async (page: pdfjsLib.PDFPageProxy, scale: number = 3): Promise<string> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!canvas || !context) {
    throw new Error("Canvas or context is null.");
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = viewport.width * pixelRatio;
  canvas.height = viewport.height * pixelRatio;
  context.scale(pixelRatio, pixelRatio);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    enableWebGL: false,
  };

  const renderTask = page.render(renderContext);

  await renderTask.promise;

  // Reduce image quality to 0.5
  const image = canvas.toDataURL("image/jpeg", 0.5);

  return image;
};

export const pdfToImg = async (file: File): Promise<string[]> => {
  try {
    const pages = await loadPdf(file);
    const images: string[] = [];

    for (const page of pages) {
      const image = await renderPageToImage(page);
      images.push(image);
    }

    return images;
  } catch (error) {
    console.error("PDF error:", error);
    return [];
  }
};