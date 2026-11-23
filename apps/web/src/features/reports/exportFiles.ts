// Keep CSV and JSON downloads at the browser boundary so report calculations stay independent of file handling.
export type CsvValue = string | number | null | undefined;

export function csvCell(value: CsvValue) {
  const text = String(value ?? "");
  // Prefix formula-like text before CSV escaping so spreadsheet applications treat it as text.
  const safe =
    /^[=+@\t\r]/.test(text) ||
    (text.startsWith("-") && !/^-?\d+(\.\d+)?$/.test(text))
      ? "'" + text
      : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCSV(filename: string, headers: string[], rows: CsvValue[][]) {
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  downloadFile(filename, csv, "text/csv;charset=utf-8");
}

export function downloadJSON(filename: string, value: unknown) {
  downloadFile(
    filename,
    JSON.stringify(value, null, 2),
    "application/json;charset=utf-8",
  );
}
