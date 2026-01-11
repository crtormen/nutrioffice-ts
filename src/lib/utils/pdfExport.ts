import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface CaptureOptions {
  scale?: number;
  backgroundColor?: string;
  logging?: boolean;
  useCORS?: boolean;
}

export interface ChartImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Captures a DOM element as an image using html2canvas
 * @param element - The DOM element to capture
 * @param options - html2canvas options
 * @returns Promise with the image data URL and dimensions
 */
export const captureChartAsImage = async (
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<ChartImage> => {
  const defaultOptions: CaptureOptions = {
    scale: 2, // Higher quality
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true, // Allow cross-origin images
    ...options,
  };

  try {
    const canvas = await html2canvas(element, defaultOptions);
    const dataUrl = canvas.toDataURL("image/png");

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error("Error capturing chart as image:", error);
    throw new Error("Failed to capture chart");
  }
};

/**
 * Captures multiple DOM elements as images
 * @param elements - Array of DOM elements to capture
 * @param options - html2canvas options
 * @returns Promise with array of image data
 */
export const captureMultipleCharts = async (
  elements: HTMLElement[],
  options: CaptureOptions = {},
): Promise<ChartImage[]> => {
  try {
    const promises = elements.map((element) =>
      captureChartAsImage(element, options),
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error("Error capturing multiple charts:", error);
    throw new Error("Failed to capture charts");
  }
};

/**
 * Adds an image to a PDF document
 * @param pdf - jsPDF instance
 * @param image - Chart image data
 * @param x - X position in mm
 * @param y - Y position in mm
 * @param maxWidth - Maximum width in mm
 * @returns The height of the added image in mm
 */
export const addImageToPDF = (
  pdf: jsPDF,
  image: ChartImage,
  x: number,
  y: number,
  maxWidth: number,
): number => {
  // Calculate aspect ratio to maintain proportions
  const aspectRatio = image.width / image.height;
  const width = maxWidth;
  const height = width / aspectRatio;

  pdf.addImage(image.dataUrl, "PNG", x, y, width, height);

  return height;
};

/**
 * Adds a new page to the PDF if needed based on current position
 * @param pdf - jsPDF instance
 * @param currentY - Current Y position
 * @param requiredHeight - Required height for next content
 * @param pageHeight - Page height in mm
 * @param margin - Page margin in mm
 * @returns New Y position after potential page break
 */
export const checkPageBreak = (
  pdf: jsPDF,
  currentY: number,
  requiredHeight: number,
  pageHeight: number,
  margin: number,
): number => {
  if (currentY + requiredHeight > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return currentY;
};

/**
 * Waits for all images in an element to load
 * @param element - The DOM element containing images
 * @returns Promise that resolves when all images are loaded
 */
export const waitForImagesToLoad = (element: HTMLElement): Promise<void> => {
  const images = element.getElementsByTagName("img");
  const promises: Promise<void>[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (!img.complete) {
      promises.push(
        new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
        }),
      );
    }
  }

  return Promise.all(promises).then(() => undefined);
};

/**
 * Waits for charts to render (useful for Recharts and other chart libraries)
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Promise that resolves after the delay
 */
export const waitForChartsToRender = (delay: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};
