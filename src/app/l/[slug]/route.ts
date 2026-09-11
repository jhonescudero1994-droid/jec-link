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

function detectDevice(userAgent: string) {
  if (/mobile/i.test(userAgent)) return "Mobile";
  if (/tablet|ipad/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

function detectOS(userAgent: string) {
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

function detectBrowser(userAgent: string) {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/opr|opera/i.test(userAgent)) return "Opera";
  if (/chrome/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "Unknown";
}

export async function GET(
  request: Request,
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

  const userAgent = request.headers.get("user-agent") ?? "";

  const country =
    request.headers.get("x-vercel-ip-country") ?? "Unknown";

  const city =
    request.headers.get("x-vercel-ip-city") ?? "Unknown";

  const device = detectDevice(userAgent);
  const os = detectOS(userAgent);
  const browser = detectBrowser(userAgent);

  const { error: eventError } = await supabaseAdmin
    .from("click_events")
    .insert({
      slug,
      country,
      city,
      device,
      os,
      browser,
    });

  if (eventError) {
    console.error(
      "Error guardando evento de clic:",
      eventError
    );
  }

  const newClicks = (data.clicks ?? 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("links")
    .update({
      clicks: newClicks,
    })
    .eq("slug", slug);

  if (updateError) {
    console.error(
      "Error actualizando clicks:",
      updateError
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: data.generated_url,
      "Cache-Control": "no-store",
    },
  });
}