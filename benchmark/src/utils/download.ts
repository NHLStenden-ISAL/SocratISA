/**
 * download: download benchmark resultaten als een JSON bestand.
 */
import { benchmarkConfig } from '../config/config';
import type { BenchmarkResult } from '../types';

export async function downloadResults(results: BenchmarkResult[], model = benchmarkConfig.model): Promise<void> {
  if (results.length === 0) return;

  const summary = {
    createdAt: new Date().toISOString(),
    config: {
      language: benchmarkConfig.language,
      model,
      bufferSeconds: benchmarkConfig.bufferSeconds,
    },
    results,
  };

  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `results${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
