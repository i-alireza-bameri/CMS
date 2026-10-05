import React, { useState, useEffect } from 'react';
import { Table, Download, Search, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  initialContent?: string;
  fileUrl?: string;
  fileName?: string;
}

interface SheetData {
  name: string;
  data: string[][];
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  initialContent,
  fileUrl,
  fileName = 'spreadsheet.xlsx',
}) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. If fileUrl provided, try fetching binary and parsing via SheetJS
      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        try {
          const res = await fetch(fileUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const parsedSheets: SheetData[] = workbook.SheetNames.map((name) => {
              const sheet = workbook.Sheets[name];
              const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
              return {
                name,
                data: json.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')) : [])),
              };
            });
            if (parsedSheets.length > 0) {
              setSheets(parsedSheets);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not parse binary xlsx from url, falling back to text content', e);
        }
      }

      // 2. Fallback to initialContent if it is JSON or CSV
      if (initialContent) {
        try {
          const parsed = JSON.parse(initialContent);
          if (parsed.sheets && Array.isArray(parsed.sheets)) {
            setSheets(parsed.sheets);
            setLoading(false);
            return;
          }
        } catch {
          // If plain CSV
          const rows = initialContent.split('\n').map((r) => r.split(',').map((c) => c.trim()));
          setSheets([{ name: 'Sheet1', data: rows }]);
          setLoading(false);
          return;
        }
      }

      // Default demo dataset
      setSheets([
        {
          name: 'OpEx Model',
          data: [
            ['Cost Center', 'Resource Tier', 'Monthly Cost ($)', 'Growth Rate', 'Annualized ($)'],
            ['Compute Cluster', 'g4dn.2xlarge GPU x8', '3,450.00', '+12%', '41,400.00'],
            ['Database Engine', 'PostgreSQL Cloud SQL HA', '1,280.00', '+5%', '15,360.00'],
            ['Object Storage', 'S3 Multi-Region 50TB', '1,150.00', '+8%', '13,800.00'],
            ['Edge CDN & Ingress', 'Global Anycast 120 PoPs', '640.00', '+4%', '7,680.00'],
            ['Logging & Observability', 'Distributed OpenTelemetry', '420.00', '+3%', '5,040.00'],
          ],
        },
      ]);
      setLoading(false);
    }

    loadData();
  }, [initialContent, fileUrl]);

  const activeSheet = sheets[activeSheetIndex] || { name: 'Sheet1', data: [] };
  const rawRows = activeSheet.data;

  // Filter rows based on search
  const filteredRows = searchQuery
    ? rawRows.filter((row, i) =>
        i === 0 ? true : row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : rawRows;

  const headerRow = filteredRows[0] || [];
  const dataRows = filteredRows.slice(1);

  // Column letters (A, B, C, D...)
  const getColLetter = (index: number) => String.fromCharCode(65 + index);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rawRows.map((e) => e.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeSheet.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-500 text-sm">
        Parsing spreadsheet workbook...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{fileName}</span>
          </div>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {rawRows.length} rows × {headerRow.length} cols
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cells..."
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48 transition-colors"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-950">
        <table className="w-full border-collapse text-xs font-mono">
          <thead>
            {/* Column Coordinate Headers: A, B, C, D... */}
            <tr className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 border-b border-slate-800 select-none">
              <th className="w-12 px-2 py-1.5 text-center bg-slate-900 border-r border-slate-800 text-slate-600 text-[11px]">
                #
              </th>
              {headerRow.map((_, i) => (
                <th key={i} className="px-3 py-1.5 text-left border-r border-slate-800 font-medium text-[11px] text-slate-500">
                  {getColLetter(i)}
                </th>
              ))}
            </tr>
            {/* Header Data Row */}
            <tr className="bg-slate-900/60 text-slate-200 sticky top-[29px] z-10 border-b border-slate-800 font-semibold font-sans">
              <td className="px-2 py-2 text-center bg-slate-900 border-r border-slate-800 text-slate-500 font-mono text-[11px]">
                1
              </td>
              {headerRow.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 border-r border-slate-800/80 text-slate-100 font-medium truncate max-w-[200px]">
                  {cell}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {dataRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-900/50 transition-colors">
                {/* Row Number */}
                <td className="px-2 py-2 text-center bg-slate-950 border-r border-slate-800 text-slate-600 text-[11px] tabular-nums select-none">
                  {ri + 2}
                </td>
                {/* Cells */}
                {row.map((cell, ci) => {
                  const isNumber = /^-?[\d,.]+%?$/.test(cell.trim());
                  return (
                    <td
                      key={ci}
                      className={`px-3 py-2 border-r border-slate-800/60 truncate max-w-[250px] text-slate-300 ${
                        isNumber ? 'text-right tabular-nums text-slate-200' : 'text-left font-sans'
                      }`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Sheet Switcher Tabs */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-t border-slate-800 bg-slate-900/90 overflow-x-auto">
          <Table className="w-3.5 h-3.5 text-slate-500 ml-1 mr-2 shrink-0" />
          {sheets.map((sheet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSheetIndex(idx)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeSheetIndex === idx
                  ? 'bg-slate-800 text-indigo-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
