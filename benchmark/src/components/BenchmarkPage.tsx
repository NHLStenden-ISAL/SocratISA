/**
 * BenchmarkPage: benchmark UI voor het testen van socratische prompt generatie.
 */
import { useCallback, useRef, useState } from 'react';
import { WebLLMAdapter } from '../adapters/WebLLMAdapter';
import { benchmarkConfig } from '../config/config';
import { buildInput, getStyleDisplayName } from '../utils/prompts';
import { testCases } from '../config/testCases';
import { downloadBenchmarkZip } from '../utils/zip';
import type { BenchmarkResult } from '../types';
import './BenchmarkPage.css';

const STORAGE_KEY = 'benchmark-results';

/** Haal de initiële status uit sessionStorage. */
function getInitialState(): { results: BenchmarkResult[]; status: string } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { results: JSON.parse(raw), status: 'Klaar' };
  } catch {
    //Negeer storage errors
  }
  return { results: [], status: 'Niet geladen' };
}

const initialState = getInitialState();

export const BenchmarkPage = () => {
  const adapter = useRef(new WebLLMAdapter()).current;
  const running = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(initialState.status);
  const [results, setResults] = useState<BenchmarkResult[]>(initialState.results);

  /** Bewaar resultaten in sessionStorage voor herladen. */
  const persistResults = useCallback((next: BenchmarkResult[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Negeer storage errors
    }
  }, []);

  /** Laad het WebLLM model in de browser. */
  const loadModel = async () => {
    setBusy(true);
    setStatus('Model laden');

    try {
      await adapter.preloadModel((text) => {
        setStatus(text || 'Model laden...');
      });
      setLoaded(true);
      setStatus('Model geladen');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  /** Verwijder het WebLLM model uit de cache. */
  const deleteModel = async () => {
    setBusy(true);
    setStatus('AI model verwijderen');

    try {
      await adapter.clearModelCache();
      setLoaded(false);
      setResults([]);
      sessionStorage.removeItem(STORAGE_KEY);
      setStatus('AI model verwijderd');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  /** Wacht de gegeven buffer tijd tussen tests. */
  const waitBetweenTests = async (seconds: number) => {
    const end = Date.now() + seconds * 1000;

    while (running.current && Date.now() < end) {
      setStatus(`GPU rust ${Math.ceil((end - Date.now()) / 1000)}s`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  /** Voer alle benchmark testcases uit. */
  const runTests = async () => {
    if (!loaded || busy) return;

    sessionStorage.removeItem(STORAGE_KEY);

    running.current = true;
    setBusy(true);
    setResults([]);

    const nextResults: BenchmarkResult[] = [];

    try {
      for (let index = 0; index < testCases.length; index += 1) {
        if (!running.current) break;

        const testCase = testCases[index];
        setStatus(`Test uitvoeren: ${testCase.id}`);
        const input = buildInput(testCase, benchmarkConfig.language);

        try {
          const result = await adapter.generate(testCase, benchmarkConfig.language);
          nextResults.push({
            id: testCase.id,
            input,
            output: result.output,
            error: null,
            durationMs: result.durationMs,
          });
        } catch (err) {
          nextResults.push({
            id: testCase.id,
            input,
            output: null,
            error: err instanceof Error ? err.message : String(err),
            durationMs: 0,
          });
        }

        setResults([...nextResults]);

        if (running.current && index < testCases.length - 1 && benchmarkConfig.bufferSeconds > 0) {
          await waitBetweenTests(benchmarkConfig.bufferSeconds);
        }
      }
    } finally {
      const finished = running.current;
      running.current = false;
      try {
        await adapter.unloadModel();
        setLoaded(false);
      } catch {
        // Negeer ontlaad errors
      }
      setStatus(finished ? 'Klaar' : 'Gestopt');
      setBusy(false);
      persistResults(nextResults);
    }
  };

  /** Stop de lopende benchmark. */
  const stopTests = () => {
    running.current = false;
    setStatus('Stoppen na huidige test');
  };

  /** Download alle resultaten als zip bestand. */
  const handleDownloadZip = useCallback(async () => {
    await downloadBenchmarkZip(results);
  }, [results]);

  const averageDuration = results.length
    ? results.reduce((total, result) => total + result.durationMs, 0) / results.length / 1000
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
        <div className="actions">
          <button onClick={loadModel} disabled={busy || loaded}>Model laden</button>
          <button onClick={runTests} disabled={busy || !loaded}>Tests uitvoeren</button>
          <button onClick={stopTests} disabled={!busy || !loaded}>Stop</button>
          <button onClick={deleteModel} disabled={busy}>AI model verwijderen</button>
          <button onClick={handleDownloadZip} disabled={results.length === 0 || busy}>
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
          <span>{averageDuration.toFixed(1)}s</span>
          <p>gemiddelde tijd</p>
        </article>
        <article>
          <span>{results.filter((result) => result.error).length}</span>
          <p>errors</p>
        </article>
      </section>

      {/* Benchmark testcases en resultaten */}
      <section className="results" aria-label="Benchmark resultaten">
        {testCases.map((testCase) => {
          const result = results.find((item) => item.id === testCase.id);
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
