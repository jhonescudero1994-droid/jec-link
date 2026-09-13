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
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  return "Unknown";
}

function isLikelyBot(request: Request, userAgent: string) {
  const ua = userAgent.toLowerCase();

  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "slurp",
    "preview",
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "telegrambot",
    "googlebot",
    "bingbot",
    "yandexbot",
    "baiduspider",
    "duckduckbot",
    "petalbot",
    "whatsapp",
    "curl/",
    "wget/",
    "python-requests",
    "axios/",
    "node-fetch",
    "headlesschrome",
    "lighthouse",
  ];

  if (!ua) {
    return true;
  }

  if (botPatterns.some((pattern) => ua.includes(pattern))) {
    return true;
  }

  const purpose =
    request.headers.get("purpose")?.toLowerCase() ?? "";

  const secPurpose =
    request.headers.get("sec-purpose")?.toLowerCase() ?? "";

  const xMoz =
    request.headers.get("x-moz")?.toLowerCase() ?? "";

  if (
    purpose.includes("prefetch") ||
    purpose.includes("preview") ||
    secPurpose.includes("prefetch") ||
    secPurpose.includes("preview") ||
    xMoz.includes("prefetch")
  ) {
    return true;
  }

  return false;
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

  const userAgent =
    request.headers.get("user-agent") ?? "";

  const botDetected =
    isLikelyBot(request, userAgent);

  if (!botDetected) {
    const country =
      request.headers.get("x-vercel-ip-country") ??
      "Unknown";

    const city =
      request.headers.get("x-vercel-ip-city") ??
      "Unknown";

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
        is_human: true,
      });

    if (eventError) {
      console.error(
        "Error guardando evento de clic:",
        eventError
      );
    }

    const newClicks = (data.clicks ?? 0) + 1;

    const { error: updateError } =
      await supabaseAdmin
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
  } else {
    console.log(
      `JEc LINK ignoró tráfico técnico para el slug ${slug}`
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