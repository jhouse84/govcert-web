import JSZip from "jszip";

interface SampleFile {
  name: string;
  type: string;
  content?: string;
  contentBase64?: string;
}

interface SamplePackage {
  companyName: string;
  totalFiles: number;
  fileTypes: { txt: number; xlsx: number; csv: number };
  files: SampleFile[];
  certificationIntent?: {
    primaryLabel: string;
    explorationLevel: string;
    explorationNote: string;
  };
}

/**
 * Bundle all sample files into a single ZIP and trigger download.
 * File name: "Sample GovCert Data_Company Name.zip"
 */
export async function downloadSampleZip(data: SamplePackage): Promise<void> {
  const zip = new JSZip();

  for (const file of data.files) {
    if (file.contentBase64) {
      // Binary files (xlsx, etc.)
      const binary = atob(file.contentBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      zip.file(file.name, bytes);
    } else if (file.content) {
      // Text files (csv, txt)
      zip.file(file.name, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const safeName = (data.companyName || "Company").replace(/[^a-zA-Z0-9 _-]/g, "");
  const filename = `Sample GovCert Data_${safeName}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
