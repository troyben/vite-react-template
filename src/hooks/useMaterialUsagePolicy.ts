import { useEffect, useState } from 'react';
import { getUsagePolicy, usagePolicyParams, type UsagePolicy } from '@/services/materialUsagePolicyService';
import type { MaterialCategory, MaterialUnit } from '@/services/materialService';
import type { MaterialUsageProperties } from '@/services/materialUsageService';

export function useMaterialUsagePolicy(category: MaterialCategory, unit: MaterialUnit, properties: MaterialUsageProperties) {
  const key = JSON.stringify(usagePolicyParams(category, unit, properties));
  const [result, setResult] = useState<{ key: string; policy?: UsagePolicy; error?: string }>();
  useEffect(() => {
    let active = true;
    getUsagePolicy(JSON.parse(key)).then(policy => {
      if (active) setResult({ key, policy });
    }).catch(() => {
      if (active) setResult({ key, error: 'Could not load compatible usage settings. Close and reopen the form to retry.' });
    });
    return () => { active = false; };
  }, [key]);
  return result?.key === key ? result : { key };
}
