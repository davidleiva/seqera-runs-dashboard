export interface RawBoxplot {
  min: number;
  q1: number;
  q2: number;
  q3: number;
  max: number;
  mean: number;
  minLabel?: string;
  q1Label?: string;
  q2Label?: string;
  q3Label?: string;
  maxLabel?: string;
}

export interface RawProcessMetric {
  process: string;
  // All boxplot sub-objects can be null in real Nextflow data (e.g. time=null on instant
  // processes, cpu=null on processes that didn't record CPU usage like UNICYCLER)
  cpu: RawBoxplot | null;
  cpuUsage?: RawBoxplot | null;
  mem: RawBoxplot | null;
  memUsage?: RawBoxplot | null;
  vmem?: RawBoxplot | null;
  time: RawBoxplot | null;
  reads?: RawBoxplot | null;
  writes?: RawBoxplot | null;
}

export interface RawTask {
  taskId: number;
  name: string;
  process: string;
  status: string;
  exit: number;
  duration: number;
  realtime: number;
  pcpu: number;
  pmem: number;
  memory: number;
  cpus: number;
  cost?: number;
  machineType?: string;
  container?: string;
}

export interface RawStats {
  succeedCount: number;
  succeedPct: number | null;
  succeedDuration: number;
  failedCount: number;
  failedPct: number | null;
  failedDuration?: number;
  cachedCount: number;
  cachedPct: number | null;
  cachedDuration?: number;
  ignoredCount: number;
  ignoredPct: number | null;
  computeTimeFmt: string | null;
}

export interface RawLoad {
  cpus: number;
  cpuTime: number;
  cpuLoad: number;
  cpuEfficiency: number;
  memoryReq: number;
  memoryRss: number;
  memoryEfficiency: number;
  readBytes: number;
  writeBytes: number;
  cost: number | null;
  peakCpus: number;
  peakTasks: number;
  peakMemory: number;
  loadCpus?: number;
  loadMemory?: number;
  loadTasks?: number;
  pending: number;
  submitted: number;
  running: number;
  succeeded: number;
  failed: number;
  cached: number;
  aborted: number;
  retries: number;
  executors: string[] | null;
}

export interface RawRun {
  id: string;
  runName: string;
  projectName: string;
  repository: string;
  revision: string;
  commitId: string | null;
  sessionId: string;
  commandLine: string;
  status: string;
  userName: string | null;
  submit: string;
  start: string | null;
  complete: string | null;
  duration: number | null;
  success: boolean;
  exitStatus: number | null;
  errorMessage: string | null;
  resume: boolean;
  container: string | null;
  containerEngine: string | null;
  workDir: string;
  launchDir: string;
  profile: string;
  nextflow?: { version: string; build: string; timestamp: string };
  manifest?: { name: string | null; description?: string | null; version?: string | null } | null;
  stats: RawStats;
  load: RawLoad;
  metrics?: RawProcessMetric[];
  tasks?: RawTask[];
}
