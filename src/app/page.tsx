"use client";



import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import QRCode from "qrcode";

import { supabase } from "@/lib/supabase";

type Mode = "whatsapp" | "web" | "phone" | "sms" | "email" | "text";

type MainView = "create" | "history" | "analytics";

type LinkRecord = {
  id: number;
  project_name: string | null;
  type: Mode;
  content: string | null;
  generated_url: string;
  message: string | null;
  slug: string | null;
  clicks: number | null;
  created_at: string;
  archived: boolean;
};

type ProjectAnalyticsStats = {
  totalClicks: number;
  validClicks: number;
  validClicksToday: number;
};


const tools: { id: Mode; label: string }[] = [

  { id: "whatsapp", label: "WhatsApp" },

  { id: "web", label: "Web / URL" },

  { id: "phone", label: "Teléfono" },

  { id: "sms", label: "SMS" },

  { id: "email", label: "Correo electrónico" },

  { id: "text", label: "Texto / QR" },

];



export default function Home() {

  const [mode, setMode] = useState<Mode>("whatsapp");

  const [mainView, setMainView] = useState<MainView>("create");

  const [showAnalytics, setShowAnalytics] = useState(false);



  const [adminEmail, setAdminEmail] = useState("");

const [adminPassword, setAdminPassword] = useState("");

const [isAuthenticated, setIsAuthenticated] = useState(false);

const [loginError, setLoginError] = useState("");

const [showAdminLogin, setShowAdminLogin] = useState(false);



 const [totalLinks, setTotalLinks] = useState(0);

const [totalClicks, setTotalClicks] = useState(0);

const [validClicks, setValidClicks] = useState(0);

const [validClicksToday, setValidClicksToday] = useState(0);



  const [topCountry, setTopCountry] = useState("Sin datos");

  const [topCountryCount, setTopCountryCount] = useState(0);

  const [topCity, setTopCity] = useState("Sin datos");

  const [topCityCount, setTopCityCount] = useState(0);

  const [topDevice, setTopDevice] = useState("Sin datos");

  const [topDeviceCount, setTopDeviceCount] = useState(0);

  const [topLink, setTopLink] = useState("Sin datos");

const [topLinkCount, setTopLinkCount] = useState(0);

const [topLinkType, setTopLinkType] = useState("Sin tipo");

const [projectName, setProjectName] = useState("");
const [historyLinks, setHistoryLinks] = useState<LinkRecord[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);
const [historyError, setHistoryError] = useState("");
const [historySearch, setHistorySearch] = useState("");
const [deletingId, setDeletingId] = useState<number | null>(null);
const [editingId, setEditingId] = useState<number | null>(null);
const [editingProjectName, setEditingProjectName] = useState("");
const [savingProjectName, setSavingProjectName] = useState(false);
const [selectedAnalyticsSlug, setSelectedAnalyticsSlug] = useState<string | null>(null);
const [analyticsSearch, setAnalyticsSearch] = useState("");
const [analyticsLoading, setAnalyticsLoading] = useState(false);
const [analyticsError, setAnalyticsError] = useState("");
const [topOS, setTopOS] = useState("Sin datos");
const [topOSCount, setTopOSCount] = useState(0);
const [topBrowser, setTopBrowser] = useState("Sin datos");
const [topBrowserCount, setTopBrowserCount] = useState(0);
const [selectedProjectName, setSelectedProjectName] = useState("");
const [selectedProjectType, setSelectedProjectType] = useState("");
const [selectedProjectUrl, setSelectedProjectUrl] = useState("");
const [projectStats, setProjectStats] = useState<Record<string, ProjectAnalyticsStats>>({});

useEffect(() => {
  let mounted = true;

  supabase.auth.getSession().then(({ data }) => {
    if (mounted) {
      setIsAuthenticated(Boolean(data.session));
    }
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setIsAuthenticated(Boolean(session));
    },
  );

  return () => {
    mounted = false;
    authListener.subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
    async function loadAnalytics() {
      if (!isAuthenticated || mainView !== "analytics") {
        return;
      }

      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setAnalyticsError("La sesión no está disponible.");
          return;
        }

        const endpoint = selectedAnalyticsSlug
          ? `/api/analytics?slug=${encodeURIComponent(selectedAnalyticsSlug)}`
          : "/api/analytics";

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo cargar la analítica.");
        }

        setTotalLinks(data.totalLinks ?? 0);
        setTotalClicks(data.totalClicks ?? 0);
        setValidClicks(data.validClicks ?? 0);
        setValidClicksToday(data.validClicksToday ?? 0);

        setTopCountry(data.topCountry?.value ?? "Sin datos");
        setTopCountryCount(data.topCountry?.count ?? 0);
        setTopCity(data.topCity?.value ?? "Sin datos");
        setTopCityCount(data.topCity?.count ?? 0);
        setTopDevice(data.topDevice?.value ?? "Sin datos");
        setTopDeviceCount(data.topDevice?.count ?? 0);
        setTopOS(data.topOS?.value ?? "Sin datos");
        setTopOSCount(data.topOS?.count ?? 0);
        setTopBrowser(data.topBrowser?.value ?? "Sin datos");
        setTopBrowserCount(data.topBrowser?.count ?? 0);
        setTopLink(data.topLink?.value ?? "Sin datos");
        setTopLinkCount(data.topLink?.count ?? 0);
        setTopLinkType(data.topLink?.type ?? "Sin tipo");

        setSelectedProjectName(data.project?.project_name ?? "");
        setSelectedProjectType(data.project?.type ?? "");
        setSelectedProjectUrl(data.project?.generated_url ?? "");

        if (data.projectStats && typeof data.projectStats === "object") {
          setProjectStats(data.projectStats);
        }
      } catch (error) {
        console.error("Error cargando analítica:", error);
        setAnalyticsError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la analítica.",
        );
      } finally {
        setAnalyticsLoading(false);
      }
    }

    loadAnalytics();
  }, [isAuthenticated, mainView, selectedAnalyticsSlug]);

  useEffect(() => {
    async function loadProjectStatsForHistory() {
      if (!isAuthenticated || mainView !== "history") {
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          return;
        }

        const response = await fetch("/api/analytics", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.projectStats && typeof data.projectStats === "object") {
          setProjectStats(data.projectStats);
        }
      } catch (error) {
        console.error("Error cargando métricas de proyectos:", error);
      }
    }

    loadProjectStatsForHistory();
  }, [isAuthenticated, mainView]);
useEffect(() => {
  async function loadHistory() {
    if ((mainView !== "history" && mainView !== "analytics") || !isAuthenticated) {
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    const { data, error } = await supabase
      .from("links")
      .select(
        "id,project_name,type,content,generated_url,message,slug,clicks,created_at,archived",
      )
      .eq("archived", false)
      .order("created_at", { ascending: false });
    
      if (error) {
        console.error("Error cargando Mis QR:", error);
        setHistoryError(
          "No se pudo cargar el historial. Revisa los permisos de Supabase.",
        );
        setHistoryLinks([]);
      } else {
        setHistoryLinks((data ?? []) as LinkRecord[]);
      }

      setHistoryLoading(false);
    }

    loadHistory();
  }, [mainView, isAuthenticated]);

    const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");



  const [website, setWebsite] = useState("");



  const [callPhone, setCallPhone] = useState("");



  const [smsPhone, setSmsPhone] = useState("");

  const [smsMessage, setSmsMessage] = useState("");



  const [email, setEmail] = useState("");

  const [subject, setSubject] = useState("");

  const [emailMessage, setEmailMessage] = useState("");



  const [freeText, setFreeText] = useState("");



  const [result, setResult] = useState("");

  const [qr, setQr] = useState("");

  const [copied, setCopied] = useState(false);



  function getOriginalContent() {

    if (mode === "whatsapp") return phone;

    if (mode === "web") return website;

    if (mode === "phone") return callPhone;

    if (mode === "sms") return smsPhone;

    if (mode === "email") return email;

    return freeText;

  }



  function getMessageContent() {

    if (mode === "whatsapp") {

      return message || null;

    }



    if (mode === "sms") {

      return smsMessage || null;

    }



    if (mode === "email") {

      const parts = [];



      if (subject) {

        parts.push(`Asunto: ${subject}`);

      }



      if (emailMessage) {

        parts.push(emailMessage);

      }



      return parts.length > 0 ? parts.join("\n") : null;

    }



    return null;

  }



  function generateSlug(length = 6) {

  const chars =

    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";



  let slug = "";



  for (let i = 0; i < length; i++) {

    slug += chars.charAt(Math.floor(Math.random() * chars.length));

  }



  return slug;

}



type SaveLinkResult =
  | { status: "created"; slug: string }
  | { status: "duplicate" }
  | { status: "error" };

async function saveToSupabase(value: string): Promise<SaveLinkResult> {

  const slug = generateSlug();

  const { error } = await supabase.from("links").insert({

    project_name: projectName.trim(),

    type: mode,

    content: getOriginalContent(),

    generated_url: value,

    message: getMessageContent(),

    slug,

    clicks: 0,

  });



  if (error) {

    if (error.code === "23505") {
      return { status: "duplicate" };
    }

    console.error("Error guardando en Supabase:", error);

    return { status: "error" };

  }



  console.log("JEc LINK guardado correctamente en Supabase.");

  console.log("Slug generado:", slug);



  return { status: "created", slug };

}



async function createQR(value: string) {

  try {

    if (!projectName.trim()) {
      alert("Escribe un nombre para este proyecto.");
      return;
    }

    const saveResult = await saveToSupabase(value);

    if (saveResult.status === "duplicate") {
      alert(
        "Este destino ya tiene un QR guardado en JEc LINK. No se creó un duplicado. Revisa Mis QR para reutilizarlo.",
      );

      setMainView("history");
      setShowAnalytics(false);

      if (!isAuthenticated) {
        setShowAdminLogin(true);
        setLoginError("");
      }

      return;
    }

    if (saveResult.status === "error") {
      alert("No se pudo crear el enlace corto.");
      return;
    }

    const slug = saveResult.slug;

    const shortLink = `${window.location.origin}/l/${slug}`;



    const qrImage = await QRCode.toDataURL(shortLink, {

      width: 1000,

      margin: 2,

      errorCorrectionLevel: "H",

    });



    setResult(shortLink);

    setQr(qrImage);

    setCopied(false);

  } catch (error) {

    console.error("Error generando QR:", error);

    alert("No se pudo generar el código QR.");

  }

}



async function generateWhatsApp() {

    const cleanPhone = phone.replace(/\D/g, "");



    if (!cleanPhone) {

      alert("Ingresa un número de WhatsApp.");

      return;

    }



    const value =

      `https://wa.me/${cleanPhone}` +

      (message ? `?text=${encodeURIComponent(message)}` : "");



    await createQR(value);

  }



  async function generateWeb() {

    let cleanURL = website.trim();



    if (!cleanURL) {

      alert("Ingresa una dirección web.");

      return;

    }



    if (

      !cleanURL.startsWith("http://") &&

      !cleanURL.startsWith("https://")

    ) {

      cleanURL = `https://${cleanURL}`;

    }



    try {

      cleanURL = new URL(cleanURL).toString();

    } catch {

      alert("La dirección web no es válida.");

      return;

    }



    await createQR(cleanURL);

  }



  async function generatePhone() {

    const cleanPhone = callPhone.replace(/[^\d+]/g, "");



    if (!cleanPhone) {

      alert("Ingresa un número telefónico.");

      return;

    }



    await createQR(`tel:${cleanPhone}`);

  }



  async function generateSMS() {

    const cleanPhone = smsPhone.replace(/[^\d+]/g, "");



    if (!cleanPhone) {

      alert("Ingresa un número para el SMS.");

      return;

    }



    const value =

      `sms:${cleanPhone}` +

      (smsMessage ? `?body=${encodeURIComponent(smsMessage)}` : "");



    await createQR(value);

  }



  async function generateEmail() {

    const cleanEmail = email.trim();



    if (!cleanEmail || !cleanEmail.includes("@")) {

      alert("Ingresa un correo electrónico válido.");

      return;

    }



    const params = new URLSearchParams();



    if (subject) {

      params.set("subject", subject);

    }



    if (emailMessage) {

      params.set("body", emailMessage);

    }



    const query = params.toString();



    const value = `mailto:${cleanEmail}${query ? `?${query}` : ""}`;



    await createQR(value);

  }



  async function generateText() {

    const cleanText = freeText.trim();



    if (!cleanText) {

      alert("Escribe el texto que deseas convertir en QR.");

      return;

    }



    await createQR(cleanText);

  }



  async function copyResult() {

    if (!result) return;



    try {

      await navigator.clipboard.writeText(result);

      setCopied(true);



      setTimeout(() => {

        setCopied(false);

      }, 2000);

    } catch {

      alert("No se pudo copiar el contenido.");

    }

  }



  function downloadQR() {

    if (!qr) return;



    const anchor = document.createElement("a");



    anchor.href = qr;

    anchor.download = `jec-link-${mode}-qr.png`;



    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

  }



  async function copyHistoryLink(slug: string | null) {
    if (!slug) {
      alert("Este registro antiguo no tiene enlace corto para copiar.");
      return;
    }

    const shortLink = `${window.location.origin}/l/${slug}`;

    try {
      await navigator.clipboard.writeText(shortLink);
      alert("Enlace copiado.");
    } catch {
      alert("No se pudo copiar el enlace.");
    }
  }

  async function downloadHistoryQR(link: LinkRecord) {
    if (!link.slug) {
      alert("Este registro antiguo no tiene código corto para generar el QR.");
      return;
    }

    try {
      const shortLink = `${window.location.origin}/l/${link.slug}`;
      const qrImage = await QRCode.toDataURL(shortLink, {
        width: 1000,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      const anchor = document.createElement("a");
      const safeName = (link.project_name || `jec-link-${link.slug}`)
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

      anchor.href = qrImage;
      anchor.download = `${safeName || "jec-link"}-qr.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error("Error descargando QR del historial:", error);
      alert("No se pudo descargar el QR.");
    }
  }

  function startEditingProjectName(link: LinkRecord) {
    setEditingId(link.id);
    setEditingProjectName(link.project_name || "");
  }

  function cancelEditingProjectName() {
    setEditingId(null);
    setEditingProjectName("");
  }

  async function saveProjectName(link: LinkRecord) {
    const cleanName = editingProjectName.trim();

    if (!cleanName) {
      alert("Escribe un nombre para el proyecto.");
      return;
    }

    setSavingProjectName(true);

    const { error } = await supabase
      .from("links")
      .update({ project_name: cleanName })
      .eq("id", link.id);

    if (error) {
      console.error("Error actualizando nombre del proyecto:", error);
      alert(
        "No se pudo cambiar el nombre. Revisa que Supabase permita actualizar registros autenticados.",
      );
      setSavingProjectName(false);
      return;
    }

    setHistoryLinks((current) =>
      current.map((item) =>
        item.id === link.id
          ? { ...item, project_name: cleanName }
          : item,
      ),
    );

    if (link.slug && selectedAnalyticsSlug === link.slug) {
      setSelectedProjectName(cleanName);
    }

    setEditingId(null);
    setEditingProjectName("");
    setSavingProjectName(false);
  }

  async function deleteHistoryLink(link: LinkRecord) {
    const projectLabel =
      link.project_name ||
      (link.slug ? `Proyecto ${link.slug}` : `Registro antiguo #${link.id}`);

    const shortLinkWarning = link.slug
      ? `El enlace corto /l/${link.slug} dejará de funcionar.`
      : "Este registro antiguo no tiene código corto asociado.";

    const confirmed = window.confirm(
      `¿Eliminar "${projectLabel}"?\n\n${shortLinkWarning} Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(link.id);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const deleteRequest = supabase
        .from("links")
        .delete()
        .eq("id", link.id);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("DELETE_TIMEOUT"));
        }, 12000);
      });

      const { error } = await Promise.race([deleteRequest, timeoutPromise]);

      if (error) {
        console.error("Error eliminando QR:", error);
        alert(
          "No se pudo eliminar el QR. Revisa que Supabase permita eliminar registros autenticados.",
        );
        return;
      }

      setHistoryLinks((current) =>
        current.filter((item) => item.id !== link.id),
      );

      if (link.slug && selectedAnalyticsSlug === link.slug) {
        setSelectedAnalyticsSlug(null);
      }
    } catch (error) {
      console.error("Error eliminando QR:", error);

      if (error instanceof Error && error.message === "DELETE_TIMEOUT") {
        alert(
          "Supabase tardó demasiado en responder. El botón se reactivó; actualiza Mis QR antes de intentarlo de nuevo.",
        );
      } else {
        alert("Ocurrió un error inesperado al eliminar el QR.");
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setDeletingId(null);
    }
  }

  function typeLabel(type: Mode) {
    return tools.find((tool) => tool.id === type)?.label ?? type;
  }

  function clearResult() {

    setResult("");

    setQr("");

    setCopied(false);

  }



  async function handleAdminLogin() {

  setLoginError("");



  const { error } = await supabase.auth.signInWithPassword({

    email: adminEmail,

    password: adminPassword,

  });



  if (error) {

    setIsAuthenticated(false);

    setLoginError("Correo o contraseña incorrectos.");

    return;

  }



  setIsAuthenticated(true);

  setShowAdminLogin(false);

  setShowAnalytics(mainView === "analytics");

  setAdminPassword("");

}



async function handleAdminLogout() {

  await supabase.auth.signOut();



  setIsAuthenticated(false);

  setMainView("create");

  setShowAnalytics(false);

  setShowAdminLogin(false);

  setAdminEmail("");

  setAdminPassword("");

  setLoginError("");

}



 function changeMode(newMode: Mode) {

  setMainView("create");

  setShowAnalytics(false);

  setShowAdminLogin(false);

  setMode(newMode);

  clearResult();

}

  function clearAll() {

    setProjectName("");

    setPhone("");

    setMessage("");



    setWebsite("");



    setCallPhone("");



    setSmsPhone("");

    setSmsMessage("");



    setEmail("");

    setSubject("");

    setEmailMessage("");



    setFreeText("");



    clearResult();

  }



  function generateCurrent() {

    if (mode === "whatsapp") {

      return generateWhatsApp();

    }



    if (mode === "web") {

      return generateWeb();

    }



    if (mode === "phone") {

      return generatePhone();

    }



    if (mode === "sms") {

      return generateSMS();

    }



    if (mode === "email") {

      return generateEmail();

    }



    return generateText();

  }



  const buttonLabel: Record<Mode, string> = {

    whatsapp: "Generar enlace + QR",

    web: "Generar QR de la web",

    phone: "Generar QR de llamada",

    sms: "Generar SMS + QR",

    email: "Generar Email + QR",

    text: "Generar código QR",

  };



  const openLabel: Record<Exclude<Mode, "text">, string> = {

    whatsapp: "Abrir WhatsApp",

    web: "Abrir página",

    phone: "Realizar llamada",

    sms: "Abrir SMS",

    email: "Abrir correo",

  };



  return (

    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        <header className="mb-10 text-center">

          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">

            Generador universal

          </div>



          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">

            JEc <span className="text-cyan-400">LINK</span>

          </h1>



          <p className="mt-4 text-lg text-slate-300">

            Conecta. Comparte. Simplifica.

          </p>



          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">

            Crea enlaces y códigos QR desde una sola herramienta.

          </p>

        </header>



        <section className="mb-7 space-y-3">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
            <button
              onClick={() => {
                setMainView("create");
                setShowAnalytics(false);
                setShowAdminLogin(false);
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mainView === "create"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Crear
            </button>

            <button
              onClick={() => {
                setMainView("history");
                setShowAnalytics(false);

                if (isAuthenticated) {
                  setShowAdminLogin(false);
                } else {
                  setShowAdminLogin(true);
                  setLoginError("");
                }
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mainView === "history"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Mis QR
            </button>

            <button
              onClick={() => {
                setMainView("analytics");
                setSelectedAnalyticsSlug(null);

                if (isAuthenticated) {
                  setShowAnalytics(true);
                  setShowAdminLogin(false);
                } else {
                  setShowAnalytics(false);
                  setShowAdminLogin(true);
                  setLoginError("");
                }
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mainView === "analytics"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Analítica
            </button>
          </div>

          {mainView === "create" && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:grid-cols-3 lg:grid-cols-6">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => changeMode(tool.id)}
                  className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                    mode === tool.id
                      ? tool.id === "whatsapp"
                        ? "bg-emerald-500 text-white"
                        : "bg-cyan-400 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {(mainView === "analytics" || mainView === "history") &&
          showAdminLogin &&
          !isAuthenticated && (

  <section className="mb-7 rounded-2xl border border-slate-800 bg-slate-900 p-6">

    <div className="mx-auto max-w-md">

      <div className="text-center">

        <p className="text-3xl">🔐</p>



        <h2 className="mt-3 text-2xl font-black text-white">

          {mainView === "history" ? "Acceso a Mis QR" : "Acceso a Analítica"}

        </h2>



        <p className="mt-2 text-sm text-slate-400">

          Inicia sesión para acceder a los datos privados de JEc LINK.

        </p>

      </div>



      <div className="mt-6 space-y-4">

        <input

          type="email"

          value={adminEmail}

          onChange={(e) => setAdminEmail(e.target.value)}

          placeholder="Correo electrónico"

          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"

        />



        <input

          type="password"

          value={adminPassword}

          onChange={(e) => setAdminPassword(e.target.value)}

          placeholder="Contraseña"

          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"

        />



        {loginError && (

          <p className="text-sm font-semibold text-red-400">

            {loginError}

          </p>

        )}



        <button

          onClick={handleAdminLogin}

          className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-300"

        >

          Iniciar sesión

        </button>

      </div>

    </div>

  </section>

)}



        <section

  className={`grid gap-6 lg:grid-cols-2 ${

    mainView === "create" ? "" : "hidden"

  }`}

>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <FieldLabel text="Nombre del proyecto" />
              <Input
                value={projectName}
                setValue={setProjectName}
                placeholder="Ej: Facebook 4Life · Campaña octubre"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Este nombre te permitirá encontrar el QR y revisar su analítica después. JEc LINK bloqueará destinos duplicados.
              </p>
            </div>

            {mode === "whatsapp" && (

              <>

                <Badge text="WhatsApp" green />



                <Title

                  title="Crear enlace de WhatsApp"

                  description="Ingresa el número con código de país. No necesitas escribir el símbolo +."

                />



                <FieldLabel text="Número de WhatsApp" />



                <Input

                  value={phone}

                  setValue={setPhone}

                  placeholder="Ej: 56912345678"

                  type="tel"

                />



                <FieldLabel text="Mensaje predeterminado" />



                <Textarea

                  value={message}

                  setValue={setMessage}

                  placeholder="Ej: Hola, quiero más información..."

                />

              </>

            )}



            {mode === "web" && (

              <>

                <Badge text="Web / URL" />



                <Title

                  title="Crear código QR para una web"

                  description="Pega una página, tienda, red social, catálogo o cualquier enlace."

                />



                <FieldLabel text="Dirección web" />



                <Input

                  value={website}

                  setValue={setWebsite}

                  placeholder="Ej: https://misitio.com"

                />



                <Info>

                  Puedes escribir la dirección sin{" "}

                  <strong className="text-slate-200">https://</strong>. JEc LINK

                  lo agregará automáticamente.

                </Info>

              </>

            )}



            {mode === "phone" && (

              <>

                <Badge text="Teléfono" />



                <Title

                  title="Crear QR para llamada"

                  description="Al escanearlo desde un teléfono, permitirá iniciar una llamada al número indicado."

                />



                <FieldLabel text="Número telefónico" />



                <Input

                  value={callPhone}

                  setValue={setCallPhone}

                  placeholder="Ej: +56912345678"

                  type="tel"

                />

              </>

            )}



            {mode === "sms" && (

              <>

                <Badge text="SMS" />



                <Title

                  title="Crear enlace SMS"

                  description="Genera un QR que abre la aplicación de mensajes con el número y texto preparados."

                />



                <FieldLabel text="Número telefónico" />



                <Input

                  value={smsPhone}

                  setValue={setSmsPhone}

                  placeholder="Ej: +56912345678"

                  type="tel"

                />



                <FieldLabel text="Mensaje" />



                <Textarea

                  value={smsMessage}

                  setValue={setSmsMessage}

                  placeholder="Escribe el mensaje..."

                />

              </>

            )}



            {mode === "email" && (

              <>

                <Badge text="Email" />



                <Title

                  title="Crear enlace de correo"

                  description="Prepara destinatario, asunto y mensaje para abrirlos directamente en una aplicación de correo."

                />



                <FieldLabel text="Correo electrónico" />



                <Input

                  value={email}

                  setValue={setEmail}

                  placeholder="Ej: contacto@empresa.com"

                  type="email"

                />



                <FieldLabel text="Asunto" />



                <Input

                  value={subject}

                  setValue={setSubject}

                  placeholder="Ej: Solicitud de información"

                />



                <FieldLabel text="Mensaje" />



                <Textarea

                  value={emailMessage}

                  setValue={setEmailMessage}

                  placeholder="Escribe el mensaje..."

                />

              </>

            )}



            {mode === "text" && (

              <>

                <Badge text="Texto / QR" />



                <Title

                  title="Convertir texto en código QR"

                  description="El contenido quedará almacenado directamente dentro del código QR."

                />



                <FieldLabel text="Contenido" />



                <Textarea

                  value={freeText}

                  setValue={setFreeText}

                  placeholder="Escribe aquí cualquier texto, instrucción o información..."

                  rows={10}

                />



                <Info>

                  Este modo no necesita una página web. El QR contiene

                  directamente el texto que escribas.

                </Info>

              </>

            )}



            <button

              onClick={generateCurrent}

              className={`mt-6 w-full rounded-xl px-5 py-3 font-bold transition ${

                mode === "whatsapp"

                  ? "bg-emerald-500 hover:bg-emerald-400"

                  : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"

              }`}

            >

              {buttonLabel[mode]}

            </button>



            <button

              onClick={clearAll}

              className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"

            >

              Limpiar

            </button>

          </div>



          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            <h2 className="text-2xl font-bold">Resultado</h2>



            {!result ? (

              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">

                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-slate-700 text-4xl">

                  QR

                </div>



                <p className="font-semibold text-slate-300">

                  Tu código QR aparecerá aquí

                </p>



                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">

                  Selecciona una herramienta, completa los datos y genera tu

                  código.

                </p>

              </div>

            ) : (

              <div className="mt-6">

                <div className="mx-auto mb-6 w-fit rounded-2xl bg-white p-4">

                  <img

                    src={qr}

                    alt="Código QR generado por JEc LINK"

                    className="h-64 w-64"

                  />

                </div>



                <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">

                  <p className="font-bold text-emerald-400">

                    ✓ QR generado correctamente

                  </p>

                </div>



                <div className="grid gap-3 sm:grid-cols-2">

                  <button

                    onClick={copyResult}

                    className="rounded-xl border border-cyan-400 px-4 py-3 font-bold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950"

                  >

                    {copied

                      ? "✓ Copiado"

                      : mode === "text"

                        ? "Copiar texto"

                        : "Copiar enlace"}

                  </button>



                  <button

                    onClick={downloadQR}

                    className="rounded-xl bg-white px-4 py-3 font-bold text-slate-950 transition hover:bg-slate-200"

                  >

                    Descargar QR

                  </button>

                </div>



                {mode !== "text" && (

                  <a

                    href={result}

                    target={

                      mode === "web" || mode === "whatsapp"

                        ? "_blank"

                        : undefined

                    }

                    rel="noopener noreferrer"

                    className={`mt-3 block rounded-xl px-4 py-3 text-center font-bold transition ${

                      mode === "whatsapp"

                        ? "bg-emerald-500 hover:bg-emerald-400"

                        : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"

                    }`}

                  >

                    {openLabel[mode as Exclude<Mode, "text">]}

                  </a>

                )}



                <details className="mt-5">

                  <summary className="cursor-pointer text-center text-sm text-slate-500 hover:text-slate-300">

                    {mode === "text"

                      ? "Ver contenido"

                      : "Ver enlace completo"}

                  </summary>



                  <div className="mt-3 break-all rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-400">

                    {result}

                  </div>

                </details>

              </div>

            )}

          </div>

        </section>



        {mainView === "history" && isAuthenticated && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                  JEc LINK
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">Mis QR</h2>

                <p className="mt-2 text-sm text-slate-400">
                  Historial de proyectos creados. Los QR antiguos pueden aparecer sin nombre.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMainView("create")}
                  className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  + Crear nuevo
                </button>

                <button
                  onClick={handleAdminLogout}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-red-400 hover:text-red-400"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            <div className="mt-6">
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Buscar por nombre, destino, tipo o código..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </div>

            {historyLoading && (
              <div className="py-12 text-center text-slate-400">
                Cargando tus QR...
              </div>
            )}

            {historyError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && historyLinks.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">
                <p className="font-bold text-slate-300">Todavía no hay QR guardados.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Crea el primero desde la pestaña Crear.
                </p>
              </div>
            )}

            {!historyLoading && !historyError && historyLinks.length > 0 && (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {historyLinks
                  .filter((link) => {
                    const search = historySearch.trim().toLowerCase();
                    if (!search) return true;

                    return [
                      link.project_name,
                      link.type,
                      link.content,
                      link.generated_url,
                      link.slug,
                    ]
                      .filter(Boolean)
                      .some((value) => String(value).toLowerCase().includes(search));
                  })
                  .map((link) => (
                    <article
                      key={link.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
                            {typeLabel(link.type)}
                          </span>

                          <h3 className="mt-3 truncate text-xl font-black text-white">
                            {link.project_name || "Proyecto antiguo"}
                          </h3>

                          <p className="mt-2 break-all text-sm leading-6 text-slate-400">
                            {link.content || link.generated_url}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-2xl font-black text-cyan-400">
                            {link.slug ? projectStats[link.slug]?.validClicks ?? 0 : 0}
                          </p>
                          <p className="text-xs text-slate-500">clics válidos</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span>Creado: {new Date(link.created_at).toLocaleDateString("es-CL")}</span>
                        <span>Código: {link.slug || "Sin código"}</span>
                      </div>

                      {editingId === link.id && (
                        <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4">
                          <label className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                            Nombre del proyecto
                          </label>
                          <input
                            value={editingProjectName}
                            onChange={(event) =>
                              setEditingProjectName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !savingProjectName) {
                                void saveProjectName(link);
                              }
                            }}
                            maxLength={80}
                            autoFocus
                            placeholder="Ej: WhatsApp 4Life"
                            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                          />
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <button
                              onClick={() => saveProjectName(link)}
                              disabled={savingProjectName}
                              className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingProjectName ? "Guardando..." : "Guardar nombre"}
                            </button>
                            <button
                              onClick={cancelEditingProjectName}
                              disabled={savingProjectName}
                              className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => copyHistoryLink(link.slug)}
                          className="rounded-xl border border-cyan-400 px-3 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950"
                        >
                          Copiar enlace
                        </button>

                        <button
                          onClick={() => downloadHistoryQR(link)}
                          className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
                        >
                          Descargar QR
                        </button>

                        <button
                          onClick={() => startEditingProjectName(link)}
                          className="rounded-xl border border-amber-400/70 px-3 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950"
                        >
                          Editar nombre
                        </button>

                        <button
                          onClick={() => {
                            if (!link.slug) {
                              alert("Este registro antiguo no tiene código corto y no posee analítica por proyecto.");
                              return;
                            }

                            setSelectedAnalyticsSlug(link.slug);
                            setMainView("analytics");
                            setShowAnalytics(true);
                            setShowAdminLogin(false);
                          }}
                          disabled={!link.slug}
                          className="rounded-xl border border-violet-400/70 px-3 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {link.slug ? "Ver analítica" : "Sin analítica"}
                        </button>

                        {link.type !== "text" && (
                          <a
                            href={link.generated_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                          >
                            Abrir destino
                          </a>
                        )}

                        <button
                          onClick={() => deleteHistoryLink(link)}
                          disabled={deletingId === link.id}
                          className="rounded-xl border border-red-500/60 px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === link.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>
        )}

        {mainView === "analytics" && showAnalytics && (
          <section className="relative mt-8 rounded-2xl border border-cyan-500/30 bg-slate-900 p-6">
            <button
              onClick={handleAdminLogout}
              className="absolute right-6 top-6 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-red-400 hover:text-red-400"
            >
              🔒 Cerrar sesión
            </button>

            <div className="pr-28 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Analítica JEc LINK
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                {selectedAnalyticsSlug
                  ? selectedProjectName || `Proyecto ${selectedAnalyticsSlug}`
                  : "Resumen general"}
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                {selectedAnalyticsSlug
                  ? `Analítica individual · ${selectedProjectType ? typeLabel(selectedProjectType as Mode) : "QR"} · código ${selectedAnalyticsSlug}`
                  : "Vista general de todos tus proyectos y accesos registrados."}
              </p>
            </div>

            {selectedAnalyticsSlug && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <button
                  onClick={() => setSelectedAnalyticsSlug(null)}
                  className="rounded-xl border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950"
                >
                  ← Volver al resumen general
                </button>

                {selectedProjectUrl && selectedProjectType !== "text" && (
                  <a
                    href={selectedProjectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                  >
                    Abrir destino
                  </a>
                )}
              </div>
            )}

            {analyticsLoading && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
                Cargando analítica...
              </div>
            )}

            {analyticsError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {analyticsError}
              </div>
            )}

            {!analyticsLoading && !analyticsError && (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      {selectedAnalyticsSlug ? "QR activo" : "Enlaces creados"}
                    </p>
                    <p className={`mt-2 font-black text-cyan-400 ${
                      selectedAnalyticsSlug ? "text-3xl" : "text-4xl"
                    }`}>
                      {selectedAnalyticsSlug ?? totalLinks}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Clics registrados
                    </p>
                    <p className="mt-2 text-4xl font-black text-cyan-400">
                      {totalClicks}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Eventos históricos guardados
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Clics válidos
                    </p>
                    <p className="mt-2 text-4xl font-black text-cyan-400">
                      {validClicks}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Tráfico humano filtrado
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Clics válidos hoy
                    </p>
                    <p className="mt-2 text-4xl font-black text-cyan-400">
                      {validClicksToday}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      País principal
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {topCountry}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topCountryCount} clics válidos
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Ciudad principal
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {topCity}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topCityCount} clics válidos
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Dispositivo principal
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {topDevice}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topDeviceCount} clics válidos
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Sistema principal
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {topOS}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topOSCount} clics válidos
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <p className="text-sm font-semibold text-slate-400">
                      Navegador principal
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-400">
                      {topBrowser}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {topBrowserCount} clics válidos
                    </p>
                  </div>

                  {!selectedAnalyticsSlug && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                      <p className="text-sm font-semibold text-slate-400">
                        Enlace principal
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">
                        {topLinkType === "whatsapp" ? "WhatsApp" : topLinkType}
                      </p>
                      <p className="mt-1 text-3xl font-black text-cyan-400">
                        {topLink}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {topLinkCount} clics válidos
                      </p>
                    </div>
                  )}
                </div>

                {!selectedAnalyticsSlug && (
                  <div className="mt-8 border-t border-slate-800 pt-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-white">
                          Analítica por proyecto
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">
                          Selecciona un proyecto para ver únicamente sus datos.
                        </p>
                      </div>

                      <input
                        value={analyticsSearch}
                        onChange={(event) => setAnalyticsSearch(event.target.value)}
                        placeholder="Buscar proyecto..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 lg:max-w-sm"
                      />
                    </div>

                    {historyLoading && (
                      <div className="py-10 text-center text-slate-400">
                        Cargando proyectos...
                      </div>
                    )}

                    {!historyLoading && historyLinks.length === 0 && (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-slate-400">
                        No hay proyectos disponibles.
                      </div>
                    )}

                    {!historyLoading && historyLinks.length > 0 && (
                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {historyLinks
                          .filter((link) => {
                            const search = analyticsSearch.trim().toLowerCase();
                            if (!search) return true;

                            return [
                              link.project_name,
                              link.type,
                              link.content,
                              link.generated_url,
                              link.slug,
                            ]
                              .filter(Boolean)
                              .some((value) =>
                                String(value).toLowerCase().includes(search),
                              );
                          })
                          .sort((a, b) => ((b.slug ? projectStats[b.slug]?.validClicks : 0) ?? 0) - ((a.slug ? projectStats[a.slug]?.validClicks : 0) ?? 0))
                          .map((link) => (
                            <article
                              key={link.id}
                              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
                                    {typeLabel(link.type)}
                                  </span>
                                  <h4 className="mt-3 truncate text-lg font-black text-white">
                                    {link.project_name || "Proyecto antiguo"}
                                  </h4>
                                  <p className="mt-2 truncate text-sm text-slate-500">
                                    {link.content || link.generated_url}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-3xl font-black text-cyan-400">
                                    {link.slug ? projectStats[link.slug]?.validClicks ?? 0 : 0}
                                  </p>
                                  <p className="text-xs text-slate-500">clics válidos</p>
                                </div>
                              </div>

                              <div className="mt-5">
                                <button
                                  onClick={() => link.slug && setSelectedAnalyticsSlug(link.slug)}
                                  disabled={!link.slug}
                                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {link.slug ? "Ver analítica" : "Sin analítica"}
                                </button>
                              </div>
                            </article>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-center">

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">

            Próxima evolución

          </p>



          <p className="mt-2 text-sm text-slate-400">

            Contacto / vCard · Exportar reportes · Gestión avanzada de proyectos

          </p>

        </section>



        <footer className="mt-10 text-center text-xs text-slate-600">

          JEc LINK · Conecta. Comparte. Simplifica.

        </footer>

      </div>

    </main>

  );

}



function Badge({

  text,

  green = false,

}: {

  text: string;

  green?: boolean;

}) {

  return (

    <span

      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${

        green

          ? "bg-emerald-500/10 text-emerald-400"

          : "bg-cyan-400/10 text-cyan-400"

      }`}

    >

      {text}

    </span>

  );

}



function Title({

  title,

  description,

}: {

  title: string;

  description: string;

}) {

  return (

    <>

      <h2 className="mt-4 text-2xl font-bold">{title}</h2>



      <p className="mt-2 text-sm leading-6 text-slate-400">

        {description}

      </p>

    </>

  );

}



function FieldLabel({ text }: { text: string }) {

  return (

    <label className="mb-2 mt-5 block text-sm font-semibold text-slate-200">

      {text}

    </label>

  );

}



function Input({

  value,

  setValue,

  placeholder,

  type = "text",

}: {

  value: string;

  setValue: (value: string) => void;

  placeholder: string;

  type?: string;

}) {

  return (

    <input

      type={type}

      value={value}

      onChange={(event) => setValue(event.target.value)}

      placeholder={placeholder}

      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"

    />

  );

}



function Textarea({

  value,

  setValue,

  placeholder,

  rows = 6,

}: {

  value: string;

  setValue: (value: string) => void;

  placeholder: string;

  rows?: number;

}) {

  return (

    <textarea

      value={value}

      onChange={(event) => setValue(event.target.value)}

      placeholder={placeholder}

      rows={rows}

      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"

    />

  );

}



function Info({ children }: { children: ReactNode }) {

  return (

    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">

      {children}

    </div>

  );

}