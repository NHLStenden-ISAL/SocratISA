/**
 * useModelStatus: hook die eenmalig model status en GPU naam checked en het resultaat beheert.
 */
import { useState, useEffect } from 'react';
import { useServices } from '../contexts/useServices';

export interface ModelStatus {
  canUseModel: boolean | null;
  gpuName: string | null;
  isChecking: boolean;
}

export function useModelStatus(): ModelStatus {
  const { webLLMService } = useServices();
  const [canUseModel, setCanUseModel] = useState<boolean | null>(null);
  const [gpuName, setGpuName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(function checkModelOnMount() {
    let cancelled = false;

    async function check() {

      // Check of het lokale AI model gebruikt kan worden
      const isCompatible = await webLLMService.canUseModel();
      if (!isCompatible) {
        if (!cancelled) {
          setCanUseModel(false);
          setIsChecking(false);
        }
        return;
      }

      // Haal GPU naam op
      const gpuName = await webLLMService.detectGPU();
      if (!cancelled) {
        setCanUseModel(true);
        setGpuName(gpuName);
        setIsChecking(false);
      }
    }

    check();

    return () => { cancelled = true; };
  }, [webLLMService]);

  return { canUseModel, gpuName, isChecking };
}
