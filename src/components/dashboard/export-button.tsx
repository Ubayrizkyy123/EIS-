"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportButtonProps = {
  rows: Array<Array<string | number>>;
  filename?: string;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function ExportButton({
  rows,
  filename = `eis-dashboard-admin-${new Date().toISOString().slice(0, 10)}.csv`,
}: ExportButtonProps) {
  function handleExport() {
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${content}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport}>
      <Download className="size-4" aria-hidden="true" />
      Export Data
    </Button>
  );
}
