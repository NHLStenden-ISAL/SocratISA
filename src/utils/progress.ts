/**
 * progress: hulpfuncties voor het formatteren van AI model progressie.
 */
import type { ProgressInfo } from '../types';


export function formatProgressText(
  progressInfo: ProgressInfo | null | undefined,
  t: (key: string) => string,
  loadingKey?: string,
): string {
  // Generieke laadscherm voor geen proggressie
  const showProgress = progressInfo && progressInfo.percentage > 0;
  if (!showProgress) {
    return progressInfo?.text || t(loadingKey || 'generic_loading');
  }

  // Download/Cache text
  const action = progressInfo.isDownloading
    ? t('home_preload_downloading')
    : t('home_preload_cache');

  // MB gedownload/opgehaald text
  const mb = progressInfo.mbFetched != null
    ? `: ${progressInfo.mbFetched} MB`
    : '';

  return `${action}${mb} (${progressInfo.percentage}%)`;
}
