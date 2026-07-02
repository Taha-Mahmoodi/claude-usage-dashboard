"use client";

import type { DeviceRow } from "@/lib/types";
import { totalTokens, modelFamily } from "@/lib/metrics";
import { fmtTokens } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Only ever 5 rows (top tasks in 7d), so no virtualization needed (<50-row rule).
export function TopTasksTable({ tasks }: { tasks: DeviceRow[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks in the last 7 days.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/10 hover:bg-transparent">
          <TableHead className="h-8">Device</TableHead>
          <TableHead className="h-8">Model</TableHead>
          <TableHead className="h-8 text-right">Tokens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((t) => (
          <TableRow key={t.session_id + t.ts} className="border-white/5">
            <TableCell className="max-w-24 truncate py-2 text-muted-foreground">
              {t.device}
            </TableCell>
            <TableCell className="py-2">{modelFamily(t.model)}</TableCell>
            <TableCell className="py-2 text-right font-medium tabular-nums">
              {fmtTokens(totalTokens(t))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
