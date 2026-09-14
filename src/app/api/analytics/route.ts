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

function cleanValue(value: string | null) {
  if (!value) return null;

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function getMostFrequent(values: (string | null)[]) {
  const counts: Record<string, number> = {};

  for (const value of values) {
    const cleaned = cleanValue(value);

    if (!cleaned || cleaned === "Unknown") {
      continue;
    }

    counts[cleaned] = (counts[cleaned] ?? 0) + 1;
  }

  let topValue = "";
  let topCount = 0;

  for (const [value, count] of Object.entries(counts)) {
    if (count > topCount) {
      topValue = value;
      topCount = count;
    }
  }

  return {
    value: topValue || "Sin datos",
    count: topCount,
  };
}
function getChileStartOfToday() {
  const timeZone = "America/Santiago";
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const day = Number(
    parts.find((part) => part.type === "day")?.value
  );

  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0)
  );

  const chileParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcGuess);

  const chileAsUtc = Date.UTC(
    Number(chileParts.find((part) => part.type === "year")?.value),
    Number(chileParts.find((part) => part.type === "month")?.value) - 1,
    Number(chileParts.find((part) => part.type === "day")?.value),
    Number(chileParts.find((part) => part.type === "hour")?.value),
    Number(chileParts.find((part) => part.type === "minute")?.value),
    Number(chileParts.find((part) => part.type === "second")?.value)
  );

  const offset = chileAsUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offset);
}

export async function GET() {
  try {
    const { count: totalLinks, error: linksError } =
      await supabaseAdmin
        .from("links")
        .select("*", {
          count: "exact",
          head: true,
        });

    if (linksError) {
      console.error(
        "Error contando enlaces:",
        linksError
      );

      return Response.json(
        {
          error: "No se pudieron obtener los enlaces.",
        },
        {
          status: 500,
        }
      );
    }

    const { count: totalClicks, error: clicksError } =
      await supabaseAdmin
        .from("click_events")
        .select("*", {
          count: "exact",
          head: true,
        });

    if (clicksError) {
      console.error(
        "Error contando clics totales:",
        clicksError
      );

      return Response.json(
        {
          error: "No se pudieron obtener los clics.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      count: validClicks,
      error: validClicksError,
    } = await supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_human", true);

    if (validClicksError) {
      console.error(
        "Error contando clics válidos:",
        validClicksError
      );

      return Response.json(
        {
          error:
            "No se pudieron obtener los clics válidos.",
        },
        {
          status: 500,
        }
      );
    }

   const startOfToday = getChileStartOfToday();

    const {
      count: validClicksToday,
      error: todayError,
    } = await supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_human", true)
      .gte(
        "created_at",
        startOfToday.toISOString()
      );

    if (todayError) {
      console.error(
        "Error contando clics válidos de hoy:",
        todayError
      );

      return Response.json(
        {
          error:
            "No se pudieron obtener los clics válidos de hoy.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: validEvents,
      error: eventsError,
    } = await supabaseAdmin
      .from("click_events")
      .select("slug, country, city, device")
      .eq("is_human", true);

    if (eventsError) {
      console.error(
        "Error obteniendo eventos válidos:",
        eventsError
      );

      return Response.json(
        {
          error:
            "No se pudieron obtener los datos de analítica.",
        },
        {
          status: 500,
        }
      );
    }

    const events = validEvents ?? [];

    const topCountry = getMostFrequent(
      events.map((event) => event.country)
    );

    const topCity = getMostFrequent(
      events.map((event) => event.city)
    );

    const topDevice = getMostFrequent(
      events.map((event) => event.device)
    );
    const topLink = getMostFrequent(
  events.map((event) => event.slug)
);
const {
  data: topLinkData,
  error: topLinkError,
} = await supabaseAdmin
  .from("links")
  .select("type")
  .eq("slug", topLink.value)
  .maybeSingle();
  if (topLinkError) {
  console.error(
    "Error obteniendo tipo del enlace principal:",
    topLinkError
  );
}

    return Response.json({
      totalLinks: totalLinks ?? 0,

      totalClicks: totalClicks ?? 0,

      validClicks: validClicks ?? 0,

      validClicksToday:
        validClicksToday ?? 0,

      topCountry,
      topCity,
      topDevice,
      topLink: {
  ...topLink,
  type: topLinkData?.type ?? "Sin tipo",
},
    });
  } catch (error) {
    console.error(
      "Error en API de analítica:",
      error
    );

    return Response.json(
      {
        error: "Error interno en analítica.",
      },
      {
        status: 500,
      }
    );
  }
}