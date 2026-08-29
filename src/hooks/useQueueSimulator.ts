import { useState, useEffect, useCallback, useRef } from 'react';
import { TaskJob, WorkerNode, ClusterMetrics, QueueType, JobCategory, JobStatus } from '../types';
import { INITIAL_JOBS, INITIAL_WORKERS } from '../data/initialData';

export function useQueueSimulator() {
  const [jobs, setJobs] = useState<TaskJob[]>(INITIAL_JOBS);
  const [workers, setWorkers] = useState<WorkerNode[]>(INITIAL_WORKERS);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [selectedJob, setSelectedJob] = useState<TaskJob | null>(null);

  // Maintain reference to latest jobs and workers for loop tick
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const workersRef = useRef(workers);
  workersRef.current = workers;

  // Add new job
  const enqueueJob = useCallback((
    title: string,
    category: JobCategory,
    queue: QueueType,
    priority: number = 3,
    payload: Record<string, unknown> = {},
    maxRetries: number = 3
  ) => {
    const newJob: TaskJob = {
      id: `job-${Date.now().toString().slice(-6)}`,
      title,
      category,
      queue,
      status: 'pending',
      priority,
      payload,
      progress: 0,
      attempts: 0,
      maxRetries,
      createdAt: Date.now(),
      logs: [
        {
          timestamp: Date.now(),
          level: 'info',
          message: `Enqueued into ${queue} queue with priority ${priority}`,
        },
      ],
    };
    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  }, []);

  // Retry a job (from DLQ or failed)
  const retryJob = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            status: 'pending' as JobStatus,
            queue: job.queue === 'dlq' ? 'default' : job.queue,
            progress: 0,
            attempts: job.attempts,
            error: undefined,
            logs: [
              ...job.logs,
              {
                timestamp: Date.now(),
                level: 'info' as const,
                message: `Manual retry initiated. Attempt ${job.attempts + 1}/${job.maxRetries + 1}`,
              },
            ],
          };
        }
        return job;
      })
    );
  }, []);

  // Retry all in DLQ
  const retryAllDLQ = useCallback(() => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.queue === 'dlq' || job.status === 'failed') {
          return {
            ...job,
            status: 'pending' as JobStatus,
            queue: 'default' as QueueType,
            progress: 0,
            error: undefined,
            logs: [
              ...job.logs,
              {
                timestamp: Date.now(),
                level: 'info' as const,
                message: 'Batch DLQ replay dispatched to default lane',
              },
            ],
          };
        }
        return job;
      })
    );
  }, []);

  // Purge a specific queue
  const purgeQueue = useCallback((queueType: QueueType) => {
    setJobs((prev) => prev.filter((job) => job.queue !== queueType || job.status === 'processing'));
  }, []);

  // Cancel / Delete a job
  const deleteJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }
  }, [selectedJob]);

  // Toggle worker state
  const toggleWorkerDrain = useCallback((workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          const nextStatus = w.status === 'drained' ? 'active' : 'drained';
          return { ...w, status: nextStatus };
        }
        return w;
      })
    );
  }, []);

  // Add a new worker node
  const addWorker = useCallback((region: string = 'us-east (N. Virginia)') => {
    const newWorkerId = `worker-${Date.now().toString().slice(-4)}`;
    const names = ['Nova-Node', 'Vortex-Core', 'Titan-Cluster', 'Aether-Unit', 'Astra-Worker'];
    const randomName = `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 90 + 10)}`;
    const newWorker: WorkerNode = {
      id: newWorkerId,
      name: randomName,
      region,
      status: 'active',
      concurrency: 4,
      activeJobs: [],
      cpuUsage: Math.floor(Math.random() * 20 + 10),
      memoryUsage: 1024,
      maxMemory: 4096,
      processedCount: 0,
      failedCount: 0,
      uptimeSeconds: 0,
    };
    setWorkers((prev) => [...prev, newWorker]);
  }, []);

  // Remove worker node
  const removeWorker = useCallback((workerId: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));
  }, []);

  // Main simulation tick
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = Math.max(200, 1000 / simulationSpeed);
    const timer = setInterval(() => {
      const currentJobs = [...jobsRef.current];
      let currentWorkers = [...workersRef.current];
      let jobsUpdated = false;

      // 1. Advance in-progress jobs
      const updatedJobs: TaskJob[] = currentJobs.map((job): TaskJob => {
        if (job.status === 'processing') {
          const step = Math.floor(Math.random() * 14 + 6) * simulationSpeed;
          const newProgress = Math.min(100, job.progress + step);
          jobsUpdated = true;

          // If job completed
          if (newProgress >= 100) {
            // Check for simulated failure (5% chance unless already failed once)
            const shouldFail = Math.random() < 0.04 && job.attempts < job.maxRetries;

            if (shouldFail) {
              const nextAttempt = job.attempts + 1;
              const isDLQ = nextAttempt >= job.maxRetries;
              const failStatus: JobStatus = isDLQ ? 'failed' : 'retrying';
              const failQueue: QueueType = isDLQ ? 'dlq' : job.queue;

              return {
                ...job,
                progress: 0,
                attempts: nextAttempt,
                status: failStatus,
                queue: failQueue,
                error: `Upstream service error (HTTP 503). Retrying in exponential backoff.`,
                logs: [
                  ...job.logs,
                  {
                    timestamp: Date.now(),
                    level: 'error' as const,
                    message: isDLQ
                      ? `Execution failed permanently after ${nextAttempt} attempts. Routed to Dead-Letter Queue.`
                      : `Execution failed. Scheduling retry ${nextAttempt + 1}/${job.maxRetries}...`,
                  },
                ],
              };
            }

            // Normal successful completion
            return {
              ...job,
              progress: 100,
              status: 'completed' as JobStatus,
              completedAt: Date.now(),
              durationMs: job.startedAt ? Date.now() - job.startedAt : 4200,
              logs: [
                ...job.logs,
                {
                  timestamp: Date.now(),
                  level: 'success' as const,
                  message: `Job execution finished successfully. Output generated.`,
                },
              ],
              output: job.output || {
                status: 'OK',
                processedRecords: Math.floor(Math.random() * 5000 + 500),
                latencyMs: Math.floor(Math.random() * 120 + 20),
                verified: true,
              },
            };
          }

          // In-flight progression log
          if (newProgress > 50 && job.progress <= 50) {
            return {
              ...job,
              progress: newProgress,
              logs: [
                ...job.logs,
                {
                  timestamp: Date.now(),
                  level: 'info' as const,
                  message: `Step 2/3 complete. Streaming intermediate buffer...`,
                },
              ],
            };
          }

          return { ...job, progress: newProgress };
        }

        // Auto-promote retrying jobs back to pending
        if (job.status === 'retrying') {
          jobsUpdated = true;
          return {
            ...job,
            status: 'pending' as JobStatus,
          };
        }

        return job;
      });

      // 2. Worker assignment: match pending jobs to available workers
      const availableWorkers = currentWorkers.filter(
        (w) => w.status !== 'drained' && w.status !== 'offline'
      );

      // Find pending jobs sorted by priority (1 is highest)
      const pendingJobs = updatedJobs
        .filter((j) => j.status === 'pending')
        .sort((a, b) => a.priority - b.priority);

      if (pendingJobs.length > 0 && availableWorkers.length > 0) {
        for (const pendingJob of pendingJobs) {
          // Find worker with lowest active load
          const eligibleWorker = availableWorkers.find(
            (w) => w.activeJobs.length < w.concurrency
          );

          if (eligibleWorker) {
            const jobIndex = updatedJobs.findIndex((j) => j.id === pendingJob.id);
            if (jobIndex !== -1) {
              updatedJobs[jobIndex] = {
                ...updatedJobs[jobIndex],
                status: 'processing',
                startedAt: Date.now(),
                workerId: eligibleWorker.id,
                logs: [
                  ...updatedJobs[jobIndex].logs,
                  {
                    timestamp: Date.now(),
                    level: 'info' as const,
                    message: `Dispatched to worker node [${eligibleWorker.name}] (${eligibleWorker.region})`,
                  },
                ],
              };
              jobsUpdated = true;

              // Update worker stats
              eligibleWorker.activeJobs.push(pendingJob.id);
              eligibleWorker.status =
                eligibleWorker.activeJobs.length >= eligibleWorker.concurrency
                  ? 'busy'
                  : 'active';
            }
          }
        }
      }

      // 3. Update worker statuses based on job completion
      currentWorkers = currentWorkers.map((w) => {
        const activeJobIds = updatedJobs
          .filter((j) => j.workerId === w.id && j.status === 'processing')
          .map((j) => j.id);

        const isBusy = activeJobIds.length >= w.concurrency;
        const isIdle = activeJobIds.length === 0 && w.status !== 'drained';
        const baseCpu = activeJobIds.length > 0 ? 30 + activeJobIds.length * 12 : 8;
        const cpuNoise = Math.floor(Math.random() * 8 - 4);
        const cpuUsage = Math.min(99, Math.max(5, baseCpu + cpuNoise));

        return {
          ...w,
          activeJobs: activeJobIds,
          status: w.status === 'drained' ? 'drained' : isBusy ? 'busy' : isIdle ? 'idle' : 'active',
          cpuUsage,
          uptimeSeconds: w.uptimeSeconds + 1,
        };
      });

      if (jobsUpdated) {
        setJobs(updatedJobs);
        // Sync selected job if open
        if (selectedJob) {
          const freshSelected = updatedJobs.find((j) => j.id === selectedJob.id);
          if (freshSelected) setSelectedJob(freshSelected);
        }
      }

      setWorkers(currentWorkers);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, selectedJob]);

  // Derived cluster metrics
  const metrics: ClusterMetrics = {
    totalJobs: jobs.length,
    pendingCount: jobs.filter((j) => j.status === 'pending').length,
    processingCount: jobs.filter((j) => j.status === 'processing').length,
    completedCount: jobs.filter((j) => j.status === 'completed').length,
    failedCount: jobs.filter((j) => j.status === 'failed').length,
    dlqCount: jobs.filter((j) => j.queue === 'dlq').length,
    avgLatencyMs: 284,
    throughputPerSec: Math.round(
      workers.reduce((acc, w) => acc + (w.activeJobs.length > 0 ? 12 : 2), 0) * simulationSpeed
    ),
    activeWorkersCount: workers.filter((w) => w.status !== 'drained' && w.status !== 'offline').length,
    systemLoadPct: Math.round(
      workers.reduce((acc, w) => acc + w.cpuUsage, 0) / (workers.length || 1)
    ),
  };

  return {
    jobs,
    workers,
    metrics,
    isSimulating,
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    selectedJob,
    setSelectedJob,
    enqueueJob,
    retryJob,
    retryAllDLQ,
    purgeQueue,
    deleteJob,
    toggleWorkerDrain,
    addWorker,
    removeWorker,
  };
}
