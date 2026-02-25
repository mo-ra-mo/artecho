export function isSupabaseStorageEnabled() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_STORAGE_BUCKET
  );
}

function getStorageApiBase() {
  const base = process.env.SUPABASE_URL || "";
  return `${base.replace(/\/+$/, "")}/storage/v1/object`;
}

export async function uploadToSupabaseStorage(params: {
  path: string;
  body: Buffer;
  contentType: string;
}) {
  const base = getStorageApiBase();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "";
  const url = `${base}/${encodeURIComponent(bucket)}/${params.path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      "Content-Type": params.contentType || "application/octet-stream",
      "x-upsert": "false",
    },
    body: params.body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${text}`);
  }
  return {
    publicUrl: `${(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/storage/v1/object/public/${encodeURIComponent(bucket)}/${params.path}`,
    storagePath: params.path,
  };
}

