import { TileTask, TileResult } from './fractal.worker';

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: TileTask[] = [];
  private busyWorkers: Set<number> = new Set();
  private onTileComplete: ((result: TileResult) => void) | null = null;
  private onAllComplete: (() => void) | null = null;
  private pendingCount = 0;
  private cancelled = false;

  constructor(poolSize?: number) {
    const size = poolSize ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4);

    try {
      for (let i = 0; i < size; i++) {
        const worker = new Worker(new URL('./fractal.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<TileResult>) => this.handleResult(i, e.data);
        this.workers.push(worker);
      }
    } catch (error) {
      console.warn(
        'WorkerPool: Failed to initialize Web Workers, falling back to main thread.',
        'Reason:', error instanceof Error ? error.message : String(error)
      );
    }
  }

  get isAvailable(): boolean {
    return this.workers.length > 0;
  }

  cancel(): void {
    this.cancelled = true;
    this.taskQueue = [];
    this.pendingCount = 0;
    this.busyWorkers.clear();
  }

  processTiles(
    tasks: TileTask[],
    onTileComplete: (result: TileResult) => void,
    onAllComplete: () => void
  ): void {
    this.cancelled = false;
    this.taskQueue = [...tasks];
    this.pendingCount = tasks.length;
    this.onTileComplete = onTileComplete;
    this.onAllComplete = onAllComplete;

    // Dispatch initial tasks to all available workers
    for (let i = 0; i < this.workers.length && this.taskQueue.length > 0; i++) {
      this.dispatchNext(i);
    }
  }

  private dispatchNext(workerIndex: number): void {
    if (this.cancelled || this.taskQueue.length === 0) return;
    const task = this.taskQueue.shift()!;
    this.busyWorkers.add(workerIndex);
    this.workers[workerIndex].postMessage(task);
  }

  private handleResult(workerIndex: number, result: TileResult): void {
    if (this.cancelled) return;

    this.busyWorkers.delete(workerIndex);
    this.pendingCount--;

    this.onTileComplete?.(result);

    if (this.taskQueue.length > 0) {
      this.dispatchNext(workerIndex);
    } else if (this.pendingCount <= 0) {
      this.onAllComplete?.();
    }
  }

  terminate(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
  }
}
