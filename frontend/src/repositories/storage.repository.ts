import { supabase } from "../lib/supabase";

// O nome fisico do bucket e preservado para nao invalidar arquivos existentes.
const CLIENT_LOGOS_BUCKET = "organization-logos";

export async function uploadClientLogo(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(CLIENT_LOGOS_BUCKET).upload(path, file, {
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(CLIENT_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadOnboardingLogo(userId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() || "png";
  const path = `${userId}/onboarding-logo.${extension}`;
  const { error } = await supabase.storage.from(CLIENT_LOGOS_BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(CLIENT_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
