/**
 * useGPUStatus: hook die de WebGPU-beschikbaarheid en GPU-naam bijhoudt.
 * Wordt eenmalig bij mount uitgevoerd.
 */
import { useState, useEffect } from 'react';
import { useServices } from '../contexts/useServices';

export interface GPUStatus {
  isAvailable: boolean | null;
  gpuName: string | null;
  isChecking: boolean;
}

export function useGPUStatus(): GPUStatus {
  const { webLLMService } = useServices();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [gpuName, setGpuName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const available = webLLMService.isWebGPUAvailable();
      if (!available) {
        if (!cancelled) {
          setIsAvailable(false);
          setIsChecking(false);
        }
        return;
      }

      const name = await webLLMService.detectGPU();
      if (!cancelled) {
        setIsAvailable(true);
        setGpuName(name);
        setIsChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [webLLMService]);

  return { isAvailable, gpuName, isChecking };
}
