import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("links")
    .select("generated_url, clicks")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error buscando enlace:", error);

    return new Response("Error interno de JEc LINK", {
      status: 500,
    });
  }

  if (!data) {
    return new Response("Este enlace JEc LINK no existe.", {
      status: 404,
    });
  }

  const newClicks = (data.clicks ?? 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("links")
    .update({
      clicks: newClicks,
    })
    .eq("slug", slug);

  if (updateError) {
    console.error("Error actualizando clicks:", updateError);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: data.generated_url,
      "Cache-Control": "no-store",
    },
  });
}