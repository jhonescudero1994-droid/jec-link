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

function getMostFrequent(values: (string | null)[]) {
  const counts: Record<string, number> = {};

  for (const value of values) {
    if (!value) continue;

    const cleanValue = decodeURIComponent(value).trim();

    if (!cleanValue) continue;

    counts[cleanValue] = (counts[cleanValue] ?? 0) + 1;
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

export async function GET() {
  try {
    const { count: totalLinks, error: linksError } = await supabaseAdmin
      .from("links")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (linksError) {
      console.error("Error contando enlaces:", linksError);

      return Response.json(
        {
          error: "No se pudieron obtener los enlaces.",
        },
        {
          status: 500,
        }
      );
    }

    const { count: totalClicks, error: clicksError } = await supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (clicksError) {
      console.error("Error contando clics:", clicksError);

      return Response.json(
        {
          error: "No se pudieron obtener los clics.",
        },
        {
          status: 500,
        }
      );
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count: clicksToday, error: todayError } = await supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .gte("created_at", startOfToday.toISOString());

    if (todayError) {
      console.error("Error contando clics de hoy:", todayError);

      return Response.json(
        {
          error: "No se pudieron obtener los clics de hoy.",
        },
        {
          status: 500,
        }
      );
    }

    const { data: clickEvents, error: eventsError } = await supabaseAdmin
      .from("click_events")
      .select("country, city, device");

    if (eventsError) {
      console.error("Error obteniendo eventos:", eventsError);

      return Response.json(
        {
          error: "No se pudieron obtener los datos de analítica.",
        },
        {
          status: 500,
        }
      );
    }

    const events = clickEvents ?? [];

    const topCountry = getMostFrequent(
      events.map((event) => event.country)
    );

    const topCity = getMostFrequent(
      events.map((event) => event.city)
    );

    const topDevice = getMostFrequent(
      events.map((event) => event.device)
    );

    return Response.json({
      totalLinks: totalLinks ?? 0,
      totalClicks: totalClicks ?? 0,
      clicksToday: clicksToday ?? 0,

      topCountry,
      topCity,
      topDevice,
    });
  } catch (error) {
    console.error("Error en API de analítica:", error);

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