type ProviderMode = "mvp" | "external" | "fal";

export type ExternalTrainStartInput = {
  jobId: string;
  modelId: string;
  userId: string;
  videos: string[];
  planTier: string;
};

export type ExternalTrainStartResult = {
  externalJobId: string;
  statusUrl?: string;
  raw?: unknown;
};

export type ExternalTrainStatusResult = {
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  progress: number;
  artifactUrl?: string;
  notes?: string;
  raw?: unknown;
};

function getMode(): ProviderMode {
  const mode = (process.env.LORA_PROVIDER || "mvp").toLowerCase();
  if (mode === "fal") return "fal";
  return mode === "external" ? "external" : "mvp";
}

function getAuthHeaders() {
  const apiKey = process.env.LORA_EXTERNAL_API_KEY || "";
  if (!apiKey) return {};
  return { Authorization: `Bearer ${apiKey}` };
}

function getFalHeaders() {
  const key = process.env.FAL_KEY || "";
  if (!key) return {};
  return {
    Authorization: `Key ${key}`,
    "x-fal-key": key,
  };
}

function clampProgress(value: unknown) {
  const p = Number(value);
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, Math.floor(p)));
}

function normalizeStatus(value: unknown): ExternalTrainStatusResult["status"] {
  const s = String(value || "").toUpperCase();
  if (["QUEUED", "PENDING", "WAITING"].includes(s)) return "QUEUED";
  if (["RUNNING", "PROCESSING", "IN_PROGRESS", "STARTED"].includes(s)) {
    return "RUNNING";
  }
  if (["SUCCEEDED", "COMPLETED", "DONE", "SUCCESS"].includes(s)) {
    return "SUCCEEDED";
  }
  if (["FAILED", "ERROR", "CANCELLED"].includes(s)) return "FAILED";
  return "RUNNING";
}

export function isExternalLoraProviderEnabled() {
  const mode = getMode();
  if (mode === "external") return !!process.env.LORA_EXTERNAL_TRAIN_URL;
  if (mode === "fal") return !!process.env.FAL_LORA_ENDPOINT;
  return false;
}

export function getLoraProviderName() {
  const mode = getMode();
  if (mode === "fal") return "fal";
  if (mode === "external") return "external";
  return "mvp";
}

export async function startExternalLoraTraining(
  input: ExternalTrainStartInput
): Promise<ExternalTrainStartResult> {
  if (getMode() === "fal") {
    const endpoint = (process.env.FAL_LORA_ENDPOINT || "").trim();
    if (!endpoint) {
      throw new Error("FAL_LORA_ENDPOINT is not configured.");
    }
    const url = `https://queue.fal.run/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getFalHeaders(),
      },
      body: JSON.stringify({
        input: {
          videos: input.videos,
          user_id: input.userId,
          model_id: input.modelId,
          plan_tier: input.planTier,
        },
        metadata: { local_job_id: input.jobId },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (json && (json.error || json.message)) || "fal training start failed."
      );
    }

    const externalJobId = String(json?.request_id || json?.requestId || "").trim();
    if (!externalJobId) {
      throw new Error("fal provider did not return request_id.");
    }

    const statusUrl = `https://queue.fal.run/${endpoint}/requests/${externalJobId}/status`;
    return { externalJobId, statusUrl, raw: json };
  }

  const url = process.env.LORA_EXTERNAL_TRAIN_URL;
  if (!url) {
    throw new Error("LORA_EXTERNAL_TRAIN_URL is not configured.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      jobId: input.jobId,
      modelId: input.modelId,
      userId: input.userId,
      videos: input.videos,
      planTier: input.planTier,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json && (json.error || json.message)) || "External training start failed."
    );
  }

  const externalJobId = String(
    json?.jobId || json?.id || json?.prediction_id || ""
  ).trim();
  if (!externalJobId) {
    throw new Error("External provider did not return a job id.");
  }

  return {
    externalJobId,
    statusUrl:
      typeof json?.statusUrl === "string" && json.statusUrl.trim()
        ? json.statusUrl.trim()
        : undefined,
    raw: json,
  };
}

export async function fetchExternalLoraTrainingStatus(params: {
  externalJobId: string;
  statusUrl?: string | null;
}): Promise<ExternalTrainStatusResult> {
  if (getMode() === "fal") {
    const endpoint = (process.env.FAL_LORA_ENDPOINT || "").trim();
    const directStatusUrl = (params.statusUrl || "").trim();
    const statusUrl =
      directStatusUrl ||
      `https://queue.fal.run/${endpoint}/requests/${params.externalJobId}/status`;
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: { ...getFalHeaders() },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (json && (json.error || json.message)) || "fal status check failed."
      );
    }

    const state = String(
      json?.status || json?.state || json?.request_status || ""
    ).toUpperCase();
    const status =
      state === "IN_QUEUE"
        ? "QUEUED"
        : state === "COMPLETED" || state === "OK"
        ? "SUCCEEDED"
        : state === "ERROR" || state === "FAILED"
        ? "FAILED"
        : "RUNNING";
    const progress = clampProgress(json?.progress ?? json?.percent ?? 0);

    let artifactUrl: string | undefined;
    let notes: string | undefined =
      typeof json?.message === "string" ? json.message : undefined;
    let raw: unknown = json;

    if (status === "SUCCEEDED") {
      const resultUrl = statusUrl.replace(/\/status$/, "");
      const resultRes = await fetch(resultUrl, {
        method: "GET",
        headers: { ...getFalHeaders() },
      });
      const resultJson = await resultRes.json().catch(() => ({}));
      if (resultRes.ok) {
        raw = { status: json, result: resultJson };
        artifactUrl =
          typeof resultJson?.lora_url === "string"
            ? resultJson.lora_url
            : typeof resultJson?.result?.lora_url === "string"
            ? resultJson.result.lora_url
            : typeof resultJson?.result?.adapterUrl === "string"
            ? resultJson.result.adapterUrl
            : undefined;
        notes =
          typeof resultJson?.message === "string"
            ? resultJson.message
            : typeof resultJson?.result?.message === "string"
            ? resultJson.result.message
            : notes;
      }
    }

    return {
      status,
      progress,
      artifactUrl,
      notes,
      raw,
    };
  }

  const directStatusUrl = (params.statusUrl || "").trim();
  const fromTemplate = (process.env.LORA_EXTERNAL_STATUS_URL || "").replace(
    "{jobId}",
    params.externalJobId
  );
  const url = directStatusUrl || fromTemplate;
  if (!url) {
    throw new Error("No status URL is configured for external LoRA provider.");
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeaders() },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json && (json.error || json.message)) || "External status check failed."
    );
  }

  const status = normalizeStatus(json?.status || json?.state);
  const progress = clampProgress(json?.progress ?? json?.percent ?? 0);
  const artifactUrl =
    typeof json?.artifactUrl === "string"
      ? json.artifactUrl
      : typeof json?.adapterUrl === "string"
      ? json.adapterUrl
      : undefined;
  const notes =
    typeof json?.notes === "string"
      ? json.notes
      : typeof json?.message === "string"
      ? json.message
      : undefined;

  return {
    status,
    progress,
    artifactUrl,
    notes,
    raw: json,
  };
}

