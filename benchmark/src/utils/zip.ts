/**
 * zip: maakt een benchmark resultaat zip bestand.
 */
import JSZip from 'jszip';
import { benchmarkConfig } from '../config/config';
import type { BenchmarkResult } from '../types';

// Haal de config en testresultaten op en zet ze in een zip bestand
export async function downloadBenchmarkZip(results: BenchmarkResult[]): Promise<void> {
  if (results.length === 0) return;

  const zip = new JSZip();
  const summary = {
    createdAt: new Date().toISOString(),
    config: {
      language: benchmarkConfig.language,
      model: benchmarkConfig.model,
      bufferSeconds: benchmarkConfig.bufferSeconds,
    },
    results,
  };

  zip.file('config.json', JSON.stringify(summary.config, null, 2));
  zip.file('summary.json', JSON.stringify(summary, null, 2));

  for (const result of results) {
    zip.file(`results/${result.id}.json`, JSON.stringify(result, null, 2));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `socratisa-benchmark-${Date.now()}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
