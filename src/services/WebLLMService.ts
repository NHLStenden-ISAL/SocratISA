/**
 * WebLLMService: lokale promptgeneratie via WebGPU.
 * Single Responsibility: detectie van WebGPU en generatie van prompts.
 */
import type * as webllm from '@mlc-ai/web-llm';
import type { SurveyAnswers, IWebLLMService } from '../types';

/** Naam van het te gebruiken model. */
const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';

type ProgressCallback = (text: string) => void;

export class WebLLMService implements IWebLLMService {
  private static engine: webllm.MLCEngine | null = null;

  /** Controleer of WebGPU beschikbaar is in de browser. */
  static isWebGPUAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  isWebGPUAvailable(): boolean {
    return WebLLMService.isWebGPUAvailable();
  }

  /** Detecteer de GPU-naam via de WebGPU API. */
  static async detectGPU(): Promise<string | null> {
    try {
      type NavGPU = { gpu: { requestAdapter(): Promise<{ info?: { description?: string; device?: string; vendor?: string; architecture?: string } } | null> } };
      if ((navigator as unknown as NavGPU).gpu) {
        const adapter = await (navigator as unknown as NavGPU).gpu.requestAdapter();
        if (adapter?.info) {
          const i = adapter.info;
          const name = i.description || i.device || [i.vendor, i.architecture].filter(Boolean).join(' ') || '';
          if (name) return name.toUpperCase();
        }
      }
    } catch (gpuErr) {
      console.warn('WebLLMService: kon GPU niet detecteren:', gpuErr);
    }
    return null;
  }

  /** Instantie-methode voor interface compliance. */
  async detectGPU(): Promise<string | null> {
    return WebLLMService.detectGPU();
  }

  /** Koppel leerstijl key aan stijl-aanwijzing key. */
  private getStyleHintKey(styleKey: string): string {
    const map: Record<string, string> = {
      survey_option_visual: 'style_hint_visual',
      survey_option_step: 'style_hint_step',
      survey_option_conceptual: 'style_hint_conceptual',
      survey_option_practical: 'style_hint_practical',
    };
    return map[styleKey] || 'style_hint_default';
  }

  /** Bouw een systeemprompt die het model een Socratische prompt laat genereren. */
  private buildSystemPrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = this.getStyleHintKey(answers.styleKey);
    return translate('webllm_system_prompt', {
      subject: answers.subject,
      topic: answers.topic,
      styleHint: translate(styleHintKey),
    });
  }

  /** Laad het model en stream een prompt via WebLLM token-voor-token. */
  async *generatePromptStream(
    answers: SurveyAnswers,
    translate: (key: string, options?: Record<string, string>) => string,
    onProgress?: ProgressCallback,
  ): AsyncGenerator<string> {
    if (!WebLLMService.isWebGPUAvailable()) {
      throw new Error('WebGPU niet beschikbaar');
    }

    const webllmModule = await import('@mlc-ai/web-llm');

    if (!WebLLMService.engine) {
      onProgress?.(translate('webllm_progress_loading'));
      WebLLMService.engine = await webllmModule.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          const pct = Math.round(report.progress * 100);
          const text = report.text || translate('webllm_progress_downloading');
          onProgress?.(`${text} (${pct}%)`);
        },
      });
    }

    onProgress?.(translate('webllm_progress_generating'));

    const systemPrompt = this.buildSystemPrompt(answers, translate);
    const userMessage = translate('webllm_user_message', {
      subject: answers.subject,
      topic: answers.topic,
    });

    const stream = await WebLLMService.engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      presence_penalty: 1.2,
      stop: ['[EINDE]', '[END]'],
      stream: true,
    } as webllm.ChatCompletionRequestStreaming);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) yield content;
    }
  }
}
