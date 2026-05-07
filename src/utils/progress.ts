/**
 * progress: hulpfuncties voor het formatteren van AI model progressie.
 */
import type { ProgressInfo } from '../types';


export function formatProgressText(
  progressInfo: ProgressInfo | null | undefined,
  t: (key: string) => string,
  loadingKey?: string,
): string {
  const showProgress = progressInfo && progressInfo.percentage > 0;

  if (!showProgress) {
    return progressInfo?.text || t(loadingKey || 'generic_loading');
  }

  const action = progressInfo.isDownloading
    ? t('home_preload_downloading')
    : t('home_preload_cache');

  const mb = progressInfo.mbFetched != null
    ? `: ${progressInfo.mbFetched} MB`
    : '';

  return `${action}${mb} (${progressInfo.percentage}%)`;
}
