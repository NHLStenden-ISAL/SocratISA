/**
 * BenchmarkPage: benchmark UI voor het testen van socratische prompt generatie.
 */
import { useCallback, useRef, useState } from 'react';
import { WebLLMAdapter } from '../adapters/WebLLMAdapter';
import { benchmarkConfig } from '../config/config';
import { buildInput, getStyleDisplayName } from '../utils/prompts';
import { testCases } from '../config/testCases';
import { downloadResults } from '../utils/download';
import type { BenchmarkResult } from '../types';
import './BenchmarkPage.css';

const STORAGE_KEY = 'benchmark-results';

/** Haal de initiële status uit sessionStorage. */
function getInitialState(): { results: BenchmarkResult[]; status: string } {
  try {
    const storedResults = sessionStorage.getItem(STORAGE_KEY);
    if (storedResults) return { results: JSON.parse(storedResults), status: 'Klaar' };
  } catch {
    // Negeer storage errors
  }
  return { results: [], status: 'Niet geladen' };
}

const initialState = getInitialState();

export const BenchmarkPage = () => {
  const webLLMAdapter = useRef(new WebLLMAdapter()).current;
  // Ref blijft actueel binnen de async benchmark loops
  const isRunningRef = useRef(false);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState(initialState.status);
  const [results, setResults] = useState<BenchmarkResult[]>(initialState.results);

  /** Bewaar resultaten in sessionStorage voor pagina verversen */
  const persistResults = useCallback((next: BenchmarkResult[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Negeer storage errors
    }
  }, []);

  /** Laad het WebLLM model in */
  const loadModel = async () => {
    setIsBusy(true);
    setStatus('Model laden');

    try {
      await webLLMAdapter.preloadModel((text) => {
        setStatus(text || 'Model laden...');
      });
      setIsModelLoaded(true);
      setStatus('Model geladen');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  };

  /** Verwijder het WebLLM model uit de cache. */
  const clearCachedModel = async () => {
    setIsBusy(true);
    setStatus('AI model verwijderen');

    try {
      await webLLMAdapter.clearModelCache();
      setIsModelLoaded(false);
      setResults([]);
      sessionStorage.removeItem(STORAGE_KEY);
      setStatus('AI model verwijderd');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  };

  /** Wacht de gegeven buffer tijd tussen tests. */
  const waitBetweenTests = async (seconds: number) => {
    const end = Date.now() + seconds * 1000;

    while (isRunningRef.current && Date.now() < end) {
      setStatus(`GPU rust ${Math.ceil((end - Date.now()) / 1000)}s`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  /** Voer een set van alle benchmark testcases uit. */
  const runSingleSet = async (): Promise<BenchmarkResult[]> => {
    const nextResults: BenchmarkResult[] = [];

    for (let index = 0; index < testCases.length; index += 1) {
      if (!isRunningRef.current) break;

      const testCase = testCases[index];
      setStatus(`Test uitvoeren: ${testCase.id}`);
      const input = buildInput(testCase, benchmarkConfig.language);

      try {
        const generated = await webLLMAdapter.generate(testCase, benchmarkConfig.language);
        nextResults.push({
          id: testCase.id,
          input,
          output: generated.output,
          error: null,
          durationMs: generated.durationMs,
        });
      } catch (error) {
        nextResults.push({
          id: testCase.id,
          input,
          output: null,
          error: error instanceof Error ? error.message : String(error),
          durationMs: 0,
        });
      }

      setResults([...nextResults]);
      persistResults([...nextResults]);

      if (isRunningRef.current && index < testCases.length - 1 && benchmarkConfig.bufferSeconds > 0) {
        await waitBetweenTests(benchmarkConfig.bufferSeconds);
      }
    }

    return nextResults;
  };

  /** Voer benchmark runs uit, download elke run en ontlaad daarna het model. */
  const runTests = async () => {
    if (!isModelLoaded || isBusy) return;

    sessionStorage.removeItem(STORAGE_KEY);

    isRunningRef.current = true;
    setIsBusy(true);
    setResults([]);

    try {
      for (let run = 1; run <= benchmarkConfig.repeatCount; run += 1) {
        if (!isRunningRef.current) break;

        if (benchmarkConfig.repeatCount > 1) {
          setStatus(`Run ${run}/${benchmarkConfig.repeatCount}`);
        }

        const nextResults = await runSingleSet();

        if (isRunningRef.current && nextResults.length > 0) {
          await downloadResults(nextResults);
        }

        if (isRunningRef.current && run < benchmarkConfig.repeatCount) {
          setStatus('Wachten voor volgende run');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } finally {
      const finished = isRunningRef.current;
      isRunningRef.current = false;
      try {
        await webLLMAdapter.unloadEngine();
        setIsModelLoaded(false);
      } catch {
        // Negeer ontlaad errors
      }
      setStatus(finished ? 'Klaar' : 'Gestopt');
      setIsBusy(false);
    }
  };

  /** Stop de lopende benchmark. */
  const stopTests = () => {
    isRunningRef.current = false;
    setStatus('Stoppen na huidige test');
  };

  /** Download alle resultaten als JSON bestand. */
  const handleDownloadResults = useCallback(async () => {
    await downloadResults(results);
  }, [results]);

  const averageSeconds = results.length
    ? results.reduce((totalMs, result) => totalMs + result.durationMs, 0) / results.length / 1000
    : 0;

  return (
    <main className="page">
      {/* Titel en introductie */}
      <section className="hero">
        <h1>SocratISA Benchmark</h1>
        <p className="intro">
          Benchmark om te testen hoe goed een AI-model socratische prompts kan maken.
        </p>
      </section>

      {/* Benchmark acties */}
      <section className="controls" aria-label="Benchmark bediening">
        <div>
          <span className="label">Status</span>
          <strong>{status}</strong>
        </div>
        <div>
          <span className="label">Model</span>
          <strong>{benchmarkConfig.model}</strong>
        </div>
        <div>
          <span className="label">Buffer</span>
          <strong>{benchmarkConfig.bufferSeconds}s</strong>
        </div>
        <div>
          <span className="label">Taal</span>
          <strong>{benchmarkConfig.language.toUpperCase()}</strong>
        </div>
        <div>
          <span className="label">Herhalingen</span>
          <strong>{benchmarkConfig.repeatCount}</strong>
        </div>
        <div className="actions">
          <button onClick={loadModel} disabled={isBusy || isModelLoaded}>Model laden</button>
          <button onClick={runTests} disabled={isBusy || !isModelLoaded}>Tests uitvoeren</button>
          <button onClick={stopTests} disabled={!isBusy || !isModelLoaded}>Stop</button>
          <button onClick={clearCachedModel} disabled={isBusy}>AI model verwijderen</button>
          <button onClick={handleDownloadResults} disabled={results.length === 0 || isBusy}>
            Resultaten downloaden
          </button>
        </div>
      </section>

      {/* Benchmark overzicht */}
      <section className="summary" aria-label="Resultaten overzicht">
        <article>
          <span>{results.length}</span>
          <p>uitgevoerd van {testCases.length}</p>
        </article>
        <article>
          <span>{averageSeconds.toFixed(1)}s</span>
          <p>gemiddelde tijd</p>
        </article>
        <article>
          <span>{results.filter((savedResult) => savedResult.error).length}</span>
          <p>errors</p>
        </article>
      </section>

      {/* Benchmark testcases en resultaten */}
      <section className="results" aria-label="Benchmark resultaten">
        {testCases.map((testCase) => {
          const result = results.find((savedResult) => savedResult.id === testCase.id);
          const input = buildInput(testCase, benchmarkConfig.language);

          return (
            <article className="result-card" key={testCase.id}>
              <div className="result-head">
                <div>
                  <span className="case-id">{testCase.id}</span>
                  <h2>{input.subject}</h2>
                </div>
                <span>{result ? `${result.durationMs} ms` : 'Nog niet uitgevoerd'}</span>
              </div>
              <dl>
                <div>
                  <dt>Topic</dt>
                  <dd>{input.topic}</dd>
                </div>
                <div>
                  <dt>Leerstijl</dt>
                  <dd>{getStyleDisplayName(input.learningStyle, benchmarkConfig.language)}</dd>
                </div>
                <div>
                  <dt>Verwacht</dt>
                  <dd>{input.expected}</dd>
                </div>
                <div>
                  <dt>Response</dt>
                  <dd className="output">{result?.output || 'Geen response'}</dd>
                </div>
                <div>
                  <dt>Error</dt>
                  <dd className="error">{result?.error || 'Geen error'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>
    </main>
  );
};
