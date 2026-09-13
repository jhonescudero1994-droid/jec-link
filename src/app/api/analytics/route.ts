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

    return Response.json({
      totalLinks: totalLinks ?? 0,
      totalClicks: totalClicks ?? 0,
      clicksToday: clicksToday ?? 0,
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