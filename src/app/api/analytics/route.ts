import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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

function getChileDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

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
    Number(chileParts.find((part) => part.type === "second")?.value),
  );

  const offset = chileAsUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offset);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return Response.json({ error: "No autorizado." }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return Response.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    if (
      !adminEmail ||
      user.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      return Response.json(
        { error: "Acceso restringido al administrador." },
        { status: 403 },
      );
    }

    const selectedSlug = request.nextUrl.searchParams.get("slug")?.trim() || null;

    let project: {
      project_name: string | null;
      type: string;
      generated_url: string;
      slug: string;
      created_at: string;
      clicks: number | null;
    } | null = null;

    if (selectedSlug) {
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from("links")
        .select("project_name,type,generated_url,slug,created_at,clicks")
        .eq("slug", selectedSlug)
        .eq("archived", false)
        .maybeSingle();

      if (projectError) {
        console.error("Error obteniendo proyecto:", projectError);

        return Response.json(
          { error: "No se pudo obtener el proyecto." },
          { status: 500 },
        );
      }

      if (!projectData) {
        return Response.json(
          { error: "El proyecto solicitado no existe." },
          { status: 404 },
        );
      }

      project = projectData;
    }

    let activeSlugs: string[] = [];

    if (selectedSlug) {
      activeSlugs = [selectedSlug];
    } else {
      const { data: activeLinks, error: activeLinksError } = await supabaseAdmin
        .from("links")
        .select("slug")
        .eq("archived", false);

      if (activeLinksError) {
        console.error("Error obteniendo enlaces activos:", activeLinksError);

        return Response.json(
          { error: "No se pudieron obtener los enlaces." },
          { status: 500 },
        );
      }

      activeSlugs = (activeLinks ?? [])
        .map((link) => link.slug)
        .filter(
          (slug): slug is string =>
            typeof slug === "string" && slug.trim().length > 0,
        );
    }

    const totalLinks = activeSlugs.length;

    if (activeSlugs.length === 0) {
      return Response.json({
        scope: selectedSlug ? "project" : "general",
        project,
        totalLinks: 0,
        totalClicks: 0,
        validClicks: 0,
        validClicksToday: 0,
        topCountry: { value: "Sin datos", count: 0 },
        topCity: { value: "Sin datos", count: 0 },
        topDevice: { value: "Sin datos", count: 0 },
        topOS: { value: "Sin datos", count: 0 },
        topBrowser: { value: "Sin datos", count: 0 },
        topLink: {
          value: "Sin datos",
          count: 0,
          type: selectedSlug ? project?.type ?? "Sin tipo" : "Sin tipo",
        },
        projectStats: {},
        dailyClicksBySlug: {},
      });
    }

    const totalClicksQuery = supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("slug", activeSlugs);

    const { count: totalClicks, error: clicksError } = await totalClicksQuery;

    if (clicksError) {
      console.error("Error contando clics totales:", clicksError);

      return Response.json(
        { error: "No se pudieron obtener los clics." },
        { status: 500 },
      );
    }

    const validClicksQuery = supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_human", true)
      .in("slug", activeSlugs);

    const { count: validClicks, error: validClicksError } =
      await validClicksQuery;

    if (validClicksError) {
      console.error("Error contando clics válidos:", validClicksError);

      return Response.json(
        { error: "No se pudieron obtener los clics válidos." },
        { status: 500 },
      );
    }

    const startOfToday = getChileStartOfToday();

    const todayQuery = supabaseAdmin
      .from("click_events")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_human", true)
      .in("slug", activeSlugs)
      .gte("created_at", startOfToday.toISOString());

    const { count: validClicksToday, error: todayError } = await todayQuery;

    if (todayError) {
      console.error("Error contando clics válidos de hoy:", todayError);

      return Response.json(
        { error: "No se pudieron obtener los clics válidos de hoy." },
        { status: 500 },
      );
    }

    const eventsQuery = supabaseAdmin
      .from("click_events")
      .select("slug,country,city,device,os,browser,created_at")
      .eq("is_human", true)
      .in("slug", activeSlugs);

    const { data: validEvents, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error("Error obteniendo eventos válidos:", eventsError);

      return Response.json(
        { error: "No se pudieron obtener los datos de analítica." },
        { status: 500 },
      );
    }

    const events = validEvents ?? [];

    const { data: allProjectEvents, error: projectEventsError } = await supabaseAdmin
      .from("click_events")
      .select("slug")
      .in("slug", activeSlugs);

    if (projectEventsError) {
      console.error("Error obteniendo conteos por proyecto:", projectEventsError);

      return Response.json(
        { error: "No se pudieron obtener los conteos por proyecto." },
        { status: 500 },
      );
    }

    const projectStats: Record<
      string,
      { totalClicks: number; validClicks: number; validClicksToday: number }
    > = {};

    for (const slug of activeSlugs) {
      projectStats[slug] = {
        totalClicks: 0,
        validClicks: 0,
        validClicksToday: 0,
      };
    }

    for (const event of allProjectEvents ?? []) {
      if (projectStats[event.slug]) {
        projectStats[event.slug].totalClicks += 1;
      }
    }

    for (const event of events) {
      if (!projectStats[event.slug]) {
        continue;
      }

      projectStats[event.slug].validClicks += 1;

      if (new Date(event.created_at) >= startOfToday) {
        projectStats[event.slug].validClicksToday += 1;
      }
    }

    const dailyClicksBySlug: Record<string, Record<string, number>> = {};

    for (const slug of activeSlugs) {
      dailyClicksBySlug[slug] = {};
    }

    for (const event of events) {
      if (!dailyClicksBySlug[event.slug]) {
        continue;
      }

      const dateKey = getChileDateKey(new Date(event.created_at));

      dailyClicksBySlug[event.slug][dateKey] =
        (dailyClicksBySlug[event.slug][dateKey] ?? 0) + 1;
    }

    const topCountry = getMostFrequent(
      events.map((event) => event.country),
    );
    const topCity = getMostFrequent(
      events.map((event) => event.city),
    );
    const topDevice = getMostFrequent(
      events.map((event) => event.device),
    );
    const topOS = getMostFrequent(
      events.map((event) => event.os),
    );
    const topBrowser = getMostFrequent(
      events.map((event) => event.browser),
    );

    const topLink = getMostFrequent(
      events.map((event) => event.slug),
    );

    let topLinkType = "Sin tipo";

    if (!selectedSlug && topLink.value !== "Sin datos") {
      const { data: topLinkData, error: topLinkError } = await supabaseAdmin
        .from("links")
        .select("type")
        .eq("slug", topLink.value)
        .maybeSingle();

      if (topLinkError) {
        console.error(
          "Error obteniendo tipo del enlace principal:",
          topLinkError,
        );
      } else {
        topLinkType = topLinkData?.type ?? "Sin tipo";
      }
    }

    return Response.json({
      scope: selectedSlug ? "project" : "general",
      project,
      totalLinks,
      totalClicks: totalClicks ?? 0,
      validClicks: validClicks ?? 0,
      validClicksToday: validClicksToday ?? 0,
      topCountry,
      topCity,
      topDevice,
      topOS,
      topBrowser,
      topLink: {
        ...topLink,
        type: selectedSlug ? project?.type ?? "Sin tipo" : topLinkType,
      },
      projectStats,
      dailyClicksBySlug,
    });
  } catch (error) {
    console.error("Error en API de analítica:", error);

    return Response.json(
      { error: "Error interno en analítica." },
      { status: 500 },
    );
  }
}
