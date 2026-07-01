import type { RunVM } from '../../../core/models';

export interface RunDetailVM extends RunVM {
  resources: {
    cpuEfficiencyPct: number;
    peakCpus: number;
    memoryPeakLabel: string;
  } | null;
  topProcesses: {
    name: string;
    valuePct: number;
  }[];
}
