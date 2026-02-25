type ProvisionTargetTier = "PRO_PLUS" | "CREATOR";

export type ProvisionProviderResult = {
  externalId: string;
  endpoint?: string | null;
  raw?: unknown;
};

function hasExternalProvider() {
  return Boolean(process.env.PROVISION_PROVIDER_URL);
}

export async function provisionPhysicalDatabase(params: {
  userId: string;
  tier: ProvisionTargetTier;
  idempotencyKey: string;
}): Promise<ProvisionProviderResult> {
  if (!hasExternalProvider()) {
    return {
      externalId: `sim-${params.userId}-${Date.now()}`,
      endpoint: `sim://db/${params.userId}`,
      raw: { mode: "simulated" },
    };
  }

  const res = await fetch(process.env.PROVISION_PROVIDER_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PROVISION_PROVIDER_API_KEY || ""}`,
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      userId: params.userId,
      tier: params.tier,
      region: process.env.PROVISION_DEFAULT_REGION || "fra1",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data && (data.error || data.message)) || "Provision provider failed."
    );
  }

  const externalId = String(data?.id || data?.externalId || "").trim();
  if (!externalId) {
    throw new Error("Provision provider did not return externalId.");
  }

  return {
    externalId,
    endpoint:
      typeof data?.endpoint === "string" && data.endpoint.trim()
        ? data.endpoint.trim()
        : null,
    raw: data,
  };
}

