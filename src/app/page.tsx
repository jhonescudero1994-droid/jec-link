"use client";



import { useEffect, useState } from "react";

import type { ReactNode } from "react";

import QRCode from "qrcode";

import { supabase } from "@/lib/supabase";

type Mode = "whatsapp" | "web" | "phone" | "sms" | "email" | "text";

type MainView = "create" | "history" | "projects" | "analytics";

type LinkRecord = {
  id: number;
  project_id: string | null;
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

type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  archived: boolean;
};

type ProjectAnalyticsStats = {
  totalClicks: number;
  validClicks: number;
  validClicksToday: number;
};


type AnalyticsRange = "7" | "30" | "all";

function getChileDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getRecentChileDateKeys(days: number) {
  const keys: string[] = [];
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    keys.push(getChileDateKey(date));
  }

  return Array.from(new Set(keys));
}

function formatChartDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  });
}

const PUBLIC_APP_URL = "https://jec-link.vercel.app";

function getShortLink(slug: string) {
  return `${PUBLIC_APP_URL}/l/${slug}`;
}

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

const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
const [editingMessage, setEditingMessage] = useState("");
const [savingMessage, setSavingMessage] = useState(false);

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
const [projectDailyStats, setProjectDailyStats] = useState<Record<string, Record<string, number>>>({});
const [projectAnalyticsRange, setProjectAnalyticsRange] = useState<AnalyticsRange>("7");
const [projects, setProjects] = useState<ProjectRecord[]>([]);
const [projectsLoading, setProjectsLoading] = useState(false);
const [projectsError, setProjectsError] = useState("");
const [newProjectName, setNewProjectName] = useState("");
const [creatingProject, setCreatingProject] = useState(false);
const [selectedProjectId, setSelectedProjectId] = useState("");
const [selectedProjectDetailId, setSelectedProjectDetailId] = useState<string | null>(null);
const [selectedProjectAnalyticsId, setSelectedProjectAnalyticsId] = useState<string | null>(null);
const [updatingProjectLinkId, setUpdatingProjectLinkId] = useState<number | null>(null);
const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
const [editingProjectTitle, setEditingProjectTitle] = useState("");
const [savingProjectEditId, setSavingProjectEditId] = useState<string | null>(null);
const [archivingProjectId, setArchivingProjectId] = useState<string | null>(null);
const [restoringProjectId, setRestoringProjectId] = useState<string | null>(null);
const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);

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
    async function loadProjects() {
      if (!isAuthenticated) {
        setProjects([]);
        return;
      }

      setProjectsLoading(true);
      setProjectsError("");

      const { data, error } = await supabase
        .from("projects")
        .select("id,name,description,created_at,archived")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando proyectos:", error);
        setProjectsError(
          "No se pudieron cargar los proyectos. Verifica que hayas ejecutado la migración de Supabase.",
        );
        setProjects([]);
      } else {
        setProjects((data ?? []) as ProjectRecord[]);
      }

      setProjectsLoading(false);
    }

    loadProjects();
  }, [isAuthenticated]);

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

        if (
          data.dailyClicksBySlug &&
          typeof data.dailyClicksBySlug === "object"
        ) {
          setProjectDailyStats(data.dailyClicksBySlug);
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
      if (!isAuthenticated || (mainView !== "history" && mainView !== "projects")) {
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

        if (
          data.dailyClicksBySlug &&
          typeof data.dailyClicksBySlug === "object"
        ) {
          setProjectDailyStats(data.dailyClicksBySlug);
        }
      } catch (error) {
        console.error("Error cargando métricas de proyectos:", error);
      }
    }

    loadProjectStatsForHistory();
  }, [isAuthenticated, mainView]);
useEffect(() => {
  async function loadHistory() {
    if ((mainView !== "history" && mainView !== "analytics" && mainView !== "projects") || !isAuthenticated) {
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    const { data, error } = await supabase
      .from("links")
      .select(
        "id,project_id,project_name,type,content,generated_url,message,slug,clicks,created_at,archived",
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
  const [previewQrId, setPreviewQrId] = useState<number | null>(null);
  const [previewQrImage, setPreviewQrImage] = useState("");



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
  | { status: "error" };

async function saveToSupabase(value: string): Promise<SaveLinkResult> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = generateSlug();

    const { error } = await supabase.from("links").insert({
      project_id: selectedProjectId || null,
      project_name: projectName.trim(),
      type: mode,
      content: getOriginalContent(),
      generated_url: value,
      message: getMessageContent(),
      slug,
      clicks: 0,
    });

    if (!error) {
      console.log("JEc LINK guardado correctamente en Supabase.");
      console.log("Slug generado:", slug);

      return { status: "created", slug };
    }

    if (error.code === "23505") {
      console.warn(
        "Colisión de código corto detectada. Generando un nuevo slug...",
      );
      continue;
    }

    console.error("Error guardando en Supabase:", error);
    return { status: "error" };
  }

  console.error(
    "No se pudo generar un slug único después de varios intentos.",
  );

  return { status: "error" };
}


async function createQR(value: string) {

  try {

    if (!projectName.trim()) {
      alert("Escribe un nombre para este proyecto.");
      return;
    }

    const saveResult = await saveToSupabase(value);

    if (saveResult.status === "error") {
      alert("No se pudo crear el enlace corto.");
      return;
    }

    const slug = saveResult.slug;

    const shortLink = getShortLink(slug);



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

    const shortLink = getShortLink(slug);

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
      const shortLink = getShortLink(link.slug);
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

  async function previewHistoryQR(link: LinkRecord) {
    if (!link.slug) {
      alert("Este registro antiguo no tiene código corto para previsualizar.");
      return;
    }

    if (previewQrId === link.id) {
      setPreviewQrId(null);
      setPreviewQrImage("");
      return;
    }

    try {
      const shortLink = getShortLink(link.slug);
      const qrImage = await QRCode.toDataURL(shortLink, {
        width: 700,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setPreviewQrId(link.id);
      setPreviewQrImage(qrImage);
    } catch (error) {
      console.error("Error previsualizando QR:", error);
      alert("No se pudo generar la previsualización del QR.");
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

  function startEditingMessage(link: LinkRecord) {
    setEditingMessageId(link.id);
    setEditingMessage(link.message || "");
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditingMessage("");
  }

  function previewWhatsAppMessage(link: LinkRecord) {
    if (link.type !== "whatsapp") {
      return;
    }

    const cleanPhone = (link.content || "").replace(/\D/g, "");

    if (!cleanPhone) {
      alert("Este QR no tiene un número de WhatsApp válido.");
      return;
    }

    const cleanMessage = editingMessage.trim();

    const previewUrl =
      `https://wa.me/${cleanPhone}` +
      (cleanMessage ? `?text=${encodeURIComponent(cleanMessage)}` : "");

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  async function saveWhatsAppMessage(link: LinkRecord) {
    if (link.type !== "whatsapp") {
      return;
    }

    const cleanPhone = (link.content || "").replace(/\D/g, "");

    if (!cleanPhone) {
      alert("Este QR no tiene un número de WhatsApp válido.");
      return;
    }

    const cleanMessage = editingMessage.trim();

    const newGeneratedUrl =
      `https://wa.me/${cleanPhone}` +
      (cleanMessage ? `?text=${encodeURIComponent(cleanMessage)}` : "");

    setSavingMessage(true);

    const { error } = await supabase
      .from("links")
      .update({
        message: cleanMessage || null,
        generated_url: newGeneratedUrl,
      })
      .eq("id", link.id);

    if (error) {
      console.error("Error actualizando mensaje de WhatsApp:", error);
      alert(
        "No se pudo actualizar el mensaje. Revisa los permisos de Supabase.",
      );
      setSavingMessage(false);
      return;
    }

    setHistoryLinks((current) =>
      current.map((item) =>
        item.id === link.id
          ? {
              ...item,
              message: cleanMessage || null,
              generated_url: newGeneratedUrl,
            }
          : item,
      ),
    );

    if (link.slug && selectedAnalyticsSlug === link.slug) {
      setSelectedProjectUrl(newGeneratedUrl);
    }

    setEditingMessageId(null);
    setEditingMessage("");
    setSavingMessage(false);

    alert("Mensaje de WhatsApp actualizado correctamente.");
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

  function startEditingProject(project: ProjectRecord) {
    setEditingProjectId(project.id);
    setEditingProjectTitle(project.name);
  }

  function cancelEditingProject() {
    setEditingProjectId(null);
    setEditingProjectTitle("");
  }

  async function saveProjectTitle(project: ProjectRecord) {
    const cleanName = editingProjectTitle.trim();

    if (!cleanName) {
      alert("Escribe un nombre para el proyecto.");
      return;
    }

    setSavingProjectEditId(project.id);

    const { error } = await supabase
      .from("projects")
      .update({ name: cleanName })
      .eq("id", project.id);

    if (error) {
      console.error("Error actualizando proyecto:", error);

      if (error.code === "23505") {
        alert("Ya existe otro proyecto activo con ese nombre.");
      } else {
        alert("No se pudo actualizar el proyecto.");
      }

      setSavingProjectEditId(null);
      return;
    }

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, name: cleanName } : item,
      ),
    );

    setEditingProjectId(null);
    setEditingProjectTitle("");
    setSavingProjectEditId(null);
  }

  async function archiveProject(project: ProjectRecord) {
    const linkedQrCount = historyLinks.filter(
      (link) => link.project_id === project.id,
    ).length;

    const confirmed = window.confirm(
      `¿Archivar "${project.name}"?\n\nSus ${linkedQrCount} QR/campañas seguirán activos y conservarán sus datos y analítica. El proyecto dejará de aparecer entre los proyectos activos hasta que lo restaures.`,
    );

    if (!confirmed) {
      return;
    }

    setArchivingProjectId(project.id);

    const { error } = await supabase
      .from("projects")
      .update({ archived: true })
      .eq("id", project.id);

    if (error) {
      console.error("Error archivando proyecto:", error);
      alert("No se pudo archivar el proyecto.");
      setArchivingProjectId(null);
      return;
    }

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, archived: true } : item,
      ),
    );

    if (selectedProjectDetailId === project.id) {
      setSelectedProjectDetailId(null);
    }

    if (selectedProjectAnalyticsId === project.id) {
      setSelectedProjectAnalyticsId(null);
    }

    if (selectedProjectId === project.id) {
      setSelectedProjectId("");
    }

    setArchivingProjectId(null);
  }

  async function restoreProject(project: ProjectRecord) {
    setRestoringProjectId(project.id);

    const { error } = await supabase
      .from("projects")
      .update({ archived: false })
      .eq("id", project.id);

    if (error) {
      console.error("Error restaurando proyecto:", error);

      if (error.code === "23505") {
        alert(
          "No se puede restaurar porque ya existe un proyecto activo con el mismo nombre.",
        );
      } else {
        alert("No se pudo restaurar el proyecto.");
      }

      setRestoringProjectId(null);
      return;
    }

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, archived: false } : item,
      ),
    );

    setRestoringProjectId(null);
  }

  async function exportProjectReport(
    project: ProjectRecord,
    campaigns: LinkRecord[],
  ) {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      alert(
        "El navegador bloqueó la ventana del reporte. Permite ventanas emergentes para JEc LINK e inténtalo nuevamente.",
      );
      return;
    }

    reportWindow.document.write(
      "<!doctype html><html><head><title>Generando reporte...</title></head><body style='font-family:Arial,sans-serif;padding:40px'>Generando reporte de JEc LINK...</body></html>",
    );
    reportWindow.document.close();

    setExportingProjectId(project.id);

    try {
      const rangeDates =
        projectAnalyticsRange === "all"
          ? Array.from(
              new Set(
                campaigns.flatMap((campaign) =>
                  campaign.slug
                    ? Object.keys(projectDailyStats[campaign.slug] ?? {})
                    : [],
                ),
              ),
            ).sort()
          : getRecentChileDateKeys(Number(projectAnalyticsRange));

      const periodLabel =
        projectAnalyticsRange === "7"
          ? "Últimos 7 días"
          : projectAnalyticsRange === "30"
            ? "Últimos 30 días"
            : "Todo el período";

      const campaignRows = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = campaign.slug
            ? projectStats[campaign.slug]
            : undefined;

          const daily = campaign.slug
            ? projectDailyStats[campaign.slug] ?? {}
            : {};

          const periodClicks = rangeDates.reduce(
            (total, date) => total + (daily[date] ?? 0),
            0,
          );

          let qrImage = "";

          if (campaign.slug) {
            try {
              qrImage = await QRCode.toDataURL(
                getShortLink(campaign.slug),
                {
                  width: 260,
                  margin: 2,
                  errorCorrectionLevel: "H",
                },
              );
            } catch (error) {
              console.error(
                "No se pudo generar un QR para el reporte:",
                error,
              );
            }
          }

          return {
            campaign,
            totalClicks: stats?.totalClicks ?? 0,
            validClicks: stats?.validClicks ?? 0,
            periodClicks,
            qrImage,
          };
        }),
      );

      const totalClicks = campaignRows.reduce(
        (total, item) => total + item.totalClicks,
        0,
      );

      const totalValidClicks = campaignRows.reduce(
        (total, item) => total + item.validClicks,
        0,
      );

      const periodValidClicks = campaignRows.reduce(
        (total, item) => total + item.periodClicks,
        0,
      );

      const dailyTotals: Record<string, number> = {};

      for (const date of rangeDates) {
        dailyTotals[date] = campaignRows.reduce((total, item) => {
          const daily = item.campaign.slug
            ? projectDailyStats[item.campaign.slug] ?? {}
            : {};

          return total + (daily[date] ?? 0);
        }, 0);
      }

      const maxPeriodClicks = Math.max(
        0,
        ...campaignRows.map((item) => item.periodClicks),
      );

      const leaders =
        maxPeriodClicks > 0
          ? campaignRows.filter(
              (item) => item.periodClicks === maxPeriodClicks,
            )
          : [];

      const escapeHtml = (value: string) =>
        value
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");

      const campaignHtml = campaignRows
        .sort((a, b) => b.periodClicks - a.periodClicks)
        .map((item) => {
          const share =
            periodValidClicks > 0
              ? Math.round(
                  (item.periodClicks / periodValidClicks) * 100,
                )
              : 0;

          return `
            <tr>
              <td>
                <strong>${escapeHtml(item.campaign.project_name || "Campaña sin nombre")}</strong><br/>
                <span class="muted">${escapeHtml(item.campaign.slug || "Sin código")}</span>
              </td>
              <td>${escapeHtml(typeLabel(item.campaign.type))}</td>
              <td>${item.totalClicks}</td>
              <td>${item.validClicks}</td>
              <td>${item.periodClicks}</td>
              <td>${share}%</td>
              <td>
                ${
                  item.qrImage
                    ? `<img src="${item.qrImage}" alt="QR" class="qr"/>`
                    : "Sin QR"
                }
              </td>
            </tr>
          `;
        })
        .join("");

      const dailyHtml =
        rangeDates.length > 0
          ? rangeDates
              .map(
                (date) => `
                  <tr>
                    <td>${escapeHtml(formatChartDate(date))}</td>
                    <td>${dailyTotals[date] ?? 0}</td>
                  </tr>
                `,
              )
              .join("")
          : `<tr><td colspan="2">Sin datos diarios para el período.</td></tr>`;

      const leadersText =
        leaders.length === 0
          ? "Sin datos suficientes"
          : leaders.length === 1
            ? `${leaders[0].campaign.project_name || "Campaña sin nombre"} (${maxPeriodClicks} clics válidos)`
            : `${leaders.length} campañas empatadas con ${maxPeriodClicks} clics válidos cada una: ${leaders
                .map(
                  (item) =>
                    item.campaign.project_name || "Campaña sin nombre",
                )
                .join(", ")}`;

      const reportDate = new Date().toLocaleString("es-CL");

      const reportHtml = `
        <!doctype html>
        <html lang="es">
          <head>
            <meta charset="utf-8"/>
            <title>Reporte JEc LINK - ${escapeHtml(project.name)}</title>
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 22px;
                font-family: Arial, Helvetica, sans-serif;
                color: #0f172a;
                background: #fff;
              }
              h1, h2, h3, p { margin-top: 0; }
              .header {
                border-bottom: 3px solid #06b6d4;
                padding-bottom: 12px;
                margin-bottom: 16px;
              }
              .brand {
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 3px;
                color: #0891b2;
                text-transform: uppercase;
              }
              .title {
                font-size: 27px;
                margin: 6px 0 3px;
              }
              .muted { color: #64748b; font-size: 12px; }
              .cards {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin: 14px 0 18px;
              }
              .card {
                border: 1px solid #cbd5e1;
                border-radius: 10px;
                padding: 10px;
              }
              .card .label {
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: 700;
              }
              .card .value {
                margin-top: 4px;
                font-size: 22px;
                font-weight: 800;
              }
              .section {
                margin-top: 18px;
              }
              .highlight {
                border: 1px solid #c4b5fd;
                background: #f5f3ff;
                border-radius: 10px;
                padding: 10px 12px;
                margin-top: 8px;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
                font-size: 11px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 6px 7px;
                text-align: left;
                vertical-align: middle;
              }
              th {
                background: #f1f5f9;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .qr { width: 48px; height: 48px; object-fit: contain; }
              .footer {
                margin-top: 16px;
                padding-top: 8px;
                border-top: 1px solid #cbd5e1;
                color: #64748b;
                font-size: 9px;
                text-align: center;
              }
              .no-print {
                position: sticky;
                top: 0;
                display: flex;
                justify-content: flex-end;
                margin-bottom: 16px;
              }
              .print-button {
                border: 0;
                border-radius: 8px;
                background: #06b6d4;
                color: #083344;
                font-weight: 800;
                padding: 10px 16px;
                cursor: pointer;
              }
              @media print {
                body {
                  padding: 0;
                  font-size: 10px;
                }
                h2 {
                  font-size: 18px;
                  margin-bottom: 6px;
                }
                .no-print { display: none; }
                .header { break-inside: avoid; }
                .cards { break-inside: avoid; }
                .highlight { break-inside: avoid; }
                table { break-inside: auto; }
                tr { break-inside: avoid; break-after: auto; }
                thead { display: table-header-group; }
                @page { size: A4 portrait; margin: 8mm; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="align-items:center; gap:12px;">
              <span style="font-size:12px;color:#64748b;">
                Para un PDF limpio, desactiva “Encabezados y pies de página” en la ventana de impresión.
              </span>
              <button class="print-button" onclick="window.print()">
                Guardar / imprimir PDF
              </button>
            </div>

            <div class="header">
              <div class="brand">JEc LINK</div>
              <h1 class="title">${escapeHtml(project.name)}</h1>
              <p class="muted">
                Reporte de analítica · ${escapeHtml(periodLabel)} · Generado ${escapeHtml(reportDate)}
              </p>
            </div>

            <div class="cards">
              <div class="card">
                <div class="label">Campañas / QR</div>
                <div class="value">${campaignRows.length}</div>
              </div>
              <div class="card">
                <div class="label">Clics registrados</div>
                <div class="value">${totalClicks}</div>
              </div>
              <div class="card">
                <div class="label">Válidos históricos</div>
                <div class="value">${totalValidClicks}</div>
              </div>
              <div class="card">
                <div class="label">Válidos del período</div>
                <div class="value">${periodValidClicks}</div>
              </div>
            </div>

            <div class="section">
              <h2>Campaña con mayor tráfico</h2>
              <div class="highlight">${escapeHtml(leadersText)}</div>
            </div>

            <div class="section">
              <h2>Comparación de campañas</h2>
              <table>
                <thead>
                  <tr>
                    <th>Campaña</th>
                    <th>Tipo</th>
                    <th>Total</th>
                    <th>Válidos</th>
                    <th>Período</th>
                    <th>Participación</th>
                    <th>QR</th>
                  </tr>
                </thead>
                <tbody>
                  ${campaignHtml}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Evolución diaria</h2>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Clics válidos</th>
                  </tr>
                </thead>
                <tbody>
                  ${dailyHtml}
                </tbody>
              </table>
            </div>

            <div class="footer">
              JEc LINK · Conecta. Comparte. Simplifica.
            </div>
          </body>
        </html>
      `;

      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
      reportWindow.focus();
    } catch (error) {
      console.error("Error generando reporte del proyecto:", error);

      reportWindow.document.open();
      reportWindow.document.write(
        "<!doctype html><html><body style='font-family:Arial,sans-serif;padding:40px'><h2>No se pudo generar el reporte.</h2><p>Vuelve a JEc LINK e inténtalo nuevamente.</p></body></html>",
      );
      reportWindow.document.close();

      alert("No se pudo generar el reporte del proyecto.");
    } finally {
      setExportingProjectId(null);
    }
  }

  async function createProject() {
    const cleanName = newProjectName.trim();

    if (!cleanName) {
      alert("Escribe un nombre para el proyecto.");
      return;
    }

    setCreatingProject(true);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: cleanName,
        archived: false,
      })
      .select("id,name,description,created_at,archived")
      .single();

    if (error) {
      console.error("Error creando proyecto:", error);

      if (error.code === "23505") {
        alert("Ya existe un proyecto activo con ese nombre.");
      } else {
        alert("No se pudo crear el proyecto.");
      }

      setCreatingProject(false);
      return;
    }

    const created = data as ProjectRecord;

    setProjects((current) => [created, ...current]);
    setSelectedProjectDetailId(created.id);
    setNewProjectName("");
    setCreatingProject(false);
  }

  async function updateLinkProject(link: LinkRecord, projectId: string) {
    setUpdatingProjectLinkId(link.id);

    const value = projectId || null;

    const { error } = await supabase
      .from("links")
      .update({ project_id: value })
      .eq("id", link.id);

    if (error) {
      console.error("Error vinculando QR al proyecto:", error);
      alert("No se pudo cambiar el proyecto de este QR.");
      setUpdatingProjectLinkId(null);
      return;
    }

    setHistoryLinks((current) =>
      current.map((item) =>
        item.id === link.id ? { ...item, project_id: value } : item,
      ),
    );

    setUpdatingProjectLinkId(null);
  }

  function startCampaignForProject(project: ProjectRecord) {
    setSelectedProjectId(project.id);
    setProjectName("");
    setResult("");
    setQr("");
    setMainView("create");
    setShowAnalytics(false);
    setShowAdminLogin(false);
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
    setSelectedProjectId("");

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
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:grid-cols-4">
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
                setMainView("projects");
                setShowAnalytics(false);

                if (isAuthenticated) {
                  setShowAdminLogin(false);
                } else {
                  setShowAdminLogin(true);
                  setLoginError("");
                }
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mainView === "projects"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              Proyectos
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

        {(mainView === "analytics" || mainView === "history" || mainView === "projects") &&
          showAdminLogin &&
          !isAuthenticated && (

  <section className="mb-7 rounded-2xl border border-slate-800 bg-slate-900 p-6">

    <div className="mx-auto max-w-md">

      <div className="text-center">

        <p className="text-3xl">🔐</p>



        <h2 className="mt-3 text-2xl font-black text-white">

          {mainView === "history" ? "Acceso a Mis QR" : mainView === "projects" ? "Acceso a Proyectos" : "Acceso a Analítica"}

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
              {isAuthenticated && (
                <>
                  <FieldLabel text="Proyecto (opcional)" />
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="">Sin proyecto / QR independiente</option>
                    {projects
                      .filter((project) => !project.archived)
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>

                  {projects.filter((project) => !project.archived).length === 0 &&
                    !projectsLoading && (
                    <p className="mt-2 text-xs leading-5 text-amber-300">
                      Aún no tienes proyectos. Puedes crear uno desde la pestaña Proyectos.
                    </p>
                  )}
                </>
              )}

              <FieldLabel text="Nombre de campaña / QR" />
              <Input
                value={projectName}
                setValue={setProjectName}
                placeholder="Ej: Flyer A · Vitrina · Bolsas"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Este nombre identifica la campaña. Un mismo proyecto puede tener varios QR con el mismo destino y cada uno conservará su propio código y analítica.
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



                <FieldLabel text="Mensaje que enviará el cliente" />



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



        {mainView === "projects" && isAuthenticated && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                  JEc LINK
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">Proyectos</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Agrupa varias campañas y QR de un mismo negocio o cliente.
                </p>
              </div>

              <button
                onClick={handleAdminLogout}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-red-400 hover:text-red-400"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-black text-white">Crear proyecto</p>
              <p className="mt-1 text-xs text-slate-500">
                Ejemplo: Librería Jade. Después podrás crear Flyer A, Flyer B, Vitrina o Bolsas dentro del mismo proyecto.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !creatingProject) {
                      void createProject();
                    }
                  }}
                  maxLength={100}
                  placeholder="Ej: Librería Jade"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />

                <button
                  onClick={createProject}
                  disabled={creatingProject}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingProject ? "Creando..." : "+ Crear proyecto"}
                </button>
              </div>
            </div>

            {projectsLoading && (
              <div className="py-12 text-center text-slate-400">
                Cargando proyectos...
              </div>
            )}

            {projectsError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {projectsError}
              </div>
            )}

            {!projectsLoading &&
              !projectsError &&
              projects.filter((project) => !project.archived).length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">
                <p className="font-bold text-slate-300">
                  Todavía no hay proyectos.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Crea Librería Jade como primer proyecto.
                </p>
              </div>
            )}

            {!projectsLoading &&
              !projectsError &&
              projects.filter((project) => !project.archived).length > 0 && (
              <div className="mt-6 space-y-4">
                {projects
                  .filter((project) => !project.archived)
                  .map((project) => {
                  const campaigns = historyLinks.filter(
                    (link) => link.project_id === project.id,
                  );

                  const projectTotalClicks = campaigns.reduce(
                    (total, link) =>
                      total +
                      (link.slug
                        ? projectStats[link.slug]?.totalClicks ?? 0
                        : 0),
                    0,
                  );

                  const projectValidClicks = campaigns.reduce(
                    (total, link) =>
                      total +
                      (link.slug
                        ? projectStats[link.slug]?.validClicks ?? 0
                        : 0),
                    0,
                  );

                  const projectValidClicksToday = campaigns.reduce(
                    (total, link) =>
                      total +
                      (link.slug
                        ? projectStats[link.slug]?.validClicksToday ?? 0
                        : 0),
                    0,
                  );

                  const rankedCampaigns = [...campaigns].sort(
                    (a, b) =>
                      ((b.slug
                        ? projectStats[b.slug]?.validClicks
                        : 0) ?? 0) -
                      ((a.slug
                        ? projectStats[a.slug]?.validClicks
                        : 0) ?? 0),
                  );

                  const maxValidClicks = rankedCampaigns.reduce(
                    (max, link) => {
                      const clicks = link.slug
                        ? projectStats[link.slug]?.validClicks ?? 0
                        : 0;

                      return Math.max(max, clicks);
                    },
                    0,
                  );

                  const topCampaigns =
                    maxValidClicks > 0
                      ? rankedCampaigns.filter((link) => {
                          const clicks = link.slug
                            ? projectStats[link.slug]?.validClicks ?? 0
                            : 0;

                          return clicks === maxValidClicks;
                        })
                      : [];

                  const dailyTotals: Record<string, number> = {};

                  for (const campaign of campaigns) {
                    if (!campaign.slug) {
                      continue;
                    }

                    const campaignDaily =
                      projectDailyStats[campaign.slug] ?? {};

                    for (const [date, clicks] of Object.entries(
                      campaignDaily,
                    )) {
                      dailyTotals[date] =
                        (dailyTotals[date] ?? 0) + clicks;
                    }
                  }

                  const chartDates =
                    projectAnalyticsRange === "all"
                      ? Object.keys(dailyTotals).sort()
                      : getRecentChileDateKeys(
                          Number(projectAnalyticsRange),
                        );

                  const projectDailySeries = chartDates.map((date) => ({
                    date,
                    clicks: dailyTotals[date] ?? 0,
                  }));

                  const maxDailyClicks = Math.max(
                    1,
                    ...projectDailySeries.map((item) => item.clicks),
                  );

                  const campaignPeriodStats = campaigns
                    .map((link) => {
                      const daily = link.slug
                        ? projectDailyStats[link.slug] ?? {}
                        : {};

                      const periodClicks = chartDates.reduce(
                        (total, date) => total + (daily[date] ?? 0),
                        0,
                      );

                      return {
                        link,
                        periodClicks,
                      };
                    })
                    .sort((a, b) => b.periodClicks - a.periodClicks);

                  const maxCampaignPeriodClicks = Math.max(
                    1,
                    ...campaignPeriodStats.map(
                      (item) => item.periodClicks,
                    ),
                  );

                  const projectPeriodClicks = campaignPeriodStats.reduce(
                    (total, item) => total + item.periodClicks,
                    0,
                  );

                  const maxPeriodClicks = Math.max(
                    0,
                    ...campaignPeriodStats.map(
                      (item) => item.periodClicks,
                    ),
                  );

                  const periodLeaders =
                    maxPeriodClicks > 0
                      ? campaignPeriodStats.filter(
                          (item) =>
                            item.periodClicks === maxPeriodClicks,
                        )
                      : [];

                  const periodLabel =
                    projectAnalyticsRange === "7"
                      ? "últimos 7 días"
                      : projectAnalyticsRange === "30"
                        ? "últimos 30 días"
                        : "todo el período";

                  const isOpen = selectedProjectDetailId === project.id;
                  const isAnalyticsOpen =
                    selectedProjectAnalyticsId === project.id;

                  return (
                    <article
                      key={project.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-white">
                            {project.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span>{campaigns.length} QR / campañas</span>
                            <span>{projectValidClicks} clics válidos</span>
                            <span>
                              Creado:{" "}
                              {new Date(project.created_at).toLocaleDateString(
                                "es-CL",
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelectedProjectDetailId(
                                isOpen ? null : project.id,
                              )
                            }
                            className="rounded-xl border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400 hover:text-slate-950"
                          >
                            {isOpen ? "Ocultar campañas" : "Ver campañas"}
                          </button>

                          <button
                            onClick={() =>
                              setSelectedProjectAnalyticsId(
                                isAnalyticsOpen ? null : project.id,
                              )
                            }
                            className="rounded-xl border border-violet-400/70 px-4 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-400 hover:text-slate-950"
                          >
                            {isAnalyticsOpen
                              ? "Ocultar analítica"
                              : "Analítica del proyecto"}
                          </button>

                          <button
                            onClick={() =>
                              exportProjectReport(project, campaigns)
                            }
                            disabled={exportingProjectId === project.id}
                            className="rounded-xl border border-emerald-400/70 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {exportingProjectId === project.id
                              ? "Generando..."
                              : "Exportar reporte"}
                          </button>

                          <button
                            onClick={() => startEditingProject(project)}
                            className="rounded-xl border border-amber-400/70 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950"
                          >
                            Editar proyecto
                          </button>

                          <button
                            onClick={() => archiveProject(project)}
                            disabled={archivingProjectId === project.id}
                            className="rounded-xl border border-red-500/60 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {archivingProjectId === project.id
                              ? "Archivando..."
                              : "Archivar"}
                          </button>

                          <button
                            onClick={() => startCampaignForProject(project)}
                            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                          >
                            + Nueva campaña
                          </button>
                        </div>
                      </div>

                      {editingProjectId === project.id && (
                        <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
                          <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            Nombre del proyecto
                          </label>

                          <input
                            value={editingProjectTitle}
                            onChange={(event) =>
                              setEditingProjectTitle(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" &&
                                savingProjectEditId !== project.id
                              ) {
                                void saveProjectTitle(project);
                              }
                            }}
                            maxLength={100}
                            autoFocus
                            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-400"
                          />

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <button
                              onClick={() => saveProjectTitle(project)}
                              disabled={savingProjectEditId === project.id}
                              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingProjectEditId === project.id
                                ? "Guardando..."
                                : "Guardar nombre"}
                            </button>

                            <button
                              onClick={cancelEditingProject}
                              disabled={savingProjectEditId === project.id}
                              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {isAnalyticsOpen && (
                        <div className="mt-5 border-t border-slate-800 pt-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
                                Analítica consolidada
                              </p>
                              <h4 className="mt-1 text-xl font-black text-white">
                                {project.name}
                              </h4>
                            </div>

                            <p className="text-xs text-slate-500">
                              Suma de todas las campañas vinculadas al proyecto.
                            </p>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                              <p className="text-xs font-semibold text-slate-500">
                                Campañas / QR
                              </p>
                              <p className="mt-1 text-3xl font-black text-cyan-400">
                                {campaigns.length}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                              <p className="text-xs font-semibold text-slate-500">
                                Clics registrados
                              </p>
                              <p className="mt-1 text-3xl font-black text-cyan-400">
                                {projectTotalClicks}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                              <p className="text-xs font-semibold text-slate-500">
                                Clics válidos
                              </p>
                              <p className="mt-1 text-3xl font-black text-cyan-400">
                                {projectValidClicks}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                              <p className="text-xs font-semibold text-slate-500">
                                Clics válidos hoy
                              </p>
                              <p className="mt-1 text-3xl font-black text-cyan-400">
                                {projectValidClicksToday}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                              Campaña con más clics válidos
                            </p>
                            <p className="mt-2 text-lg font-black text-white">
                              {topCampaigns.length === 1
                                ? topCampaigns[0].project_name ||
                                  "Campaña sin nombre"
                                : topCampaigns.length > 1
                                  ? `${topCampaigns.length} campañas empatadas`
                                  : "Aún sin datos suficientes"}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {topCampaigns.length === 1
                                ? `${maxValidClicks} clics válidos`
                                : topCampaigns.length > 1
                                  ? `${topCampaigns
                                      .map(
                                        (link) =>
                                          link.project_name ||
                                          "Campaña sin nombre",
                                      )
                                      .join(" · ")} · ${maxValidClicks} clics válidos cada una`
                                  : "Cuando haya clics válidos, JEc LINK mostrará aquí la campaña principal."}
                            </p>
                          </div>

                          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Evolución diaria
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                  Clics válidos de todas las campañas del proyecto.
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {([
                                  ["7", "7 días"],
                                  ["30", "30 días"],
                                  ["all", "Todo"],
                                ] as const).map(([value, label]) => (
                                  <button
                                    key={value}
                                    onClick={() =>
                                      setProjectAnalyticsRange(value)
                                    }
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                      projectAnalyticsRange === value
                                        ? "bg-cyan-400 text-slate-950"
                                        : "border border-slate-700 text-slate-400 hover:bg-slate-800"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {projectDailySeries.length === 0 ? (
                              <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                                Aún no hay datos diarios para mostrar.
                              </div>
                            ) : (
                              <div className="mt-5 overflow-x-auto pb-2">
                                <div
                                  className="flex h-52 min-w-max items-end gap-3 border-b border-slate-700 px-2"
                                  aria-label="Gráfica de clics válidos por día"
                                >
                                  {projectDailySeries.map((item) => {
                                    const height =
                                      item.clicks === 0
                                        ? 4
                                        : Math.max(
                                            12,
                                            Math.round(
                                              (item.clicks /
                                                maxDailyClicks) *
                                                150,
                                            ),
                                          );

                                    return (
                                      <div
                                        key={item.date}
                                        className="flex w-12 shrink-0 flex-col items-center justify-end"
                                      >
                                        <span className="mb-2 text-xs font-black text-cyan-300">
                                          {item.clicks}
                                        </span>

                                        <div
                                          className="w-7 rounded-t-md bg-cyan-400 transition-all"
                                          style={{ height: `${height}px` }}
                                          title={`${formatChartDate(item.date)}: ${item.clicks} clics válidos`}
                                        />

                                        <span className="mt-2 whitespace-nowrap text-[10px] text-slate-500">
                                          {formatChartDate(item.date)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {campaigns.length > 0 && (
                            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Comparación por campaña
                                  </p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    Rendimiento durante {periodLabel}.
                                  </p>
                                </div>

                                <div className="text-left sm:text-right">
                                  <p className="text-2xl font-black text-cyan-400">
                                    {projectPeriodClicks}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    clics válidos del proyecto
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 space-y-4">
                                {campaignPeriodStats.map(
                                  ({ link, periodClicks }, index) => {
                                    const width =
                                      periodClicks === 0
                                        ? 0
                                        : Math.max(
                                            6,
                                            Math.round(
                                              (periodClicks /
                                                maxCampaignPeriodClicks) *
                                                100,
                                            ),
                                          );

                                    const share =
                                      projectPeriodClicks > 0
                                        ? Math.round(
                                            (periodClicks /
                                              projectPeriodClicks) *
                                              100,
                                          )
                                        : 0;

                                    return (
                                      <div
                                        key={link.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="truncate font-black text-white">
                                                {link.project_name ||
                                                  "Campaña sin nombre"}
                                              </p>

                                              {periodClicks > 0 &&
                                                periodClicks ===
                                                  maxPeriodClicks && (
                                                  <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                                                    {periodLeaders.length > 1
                                                      ? "Empate mayor tráfico"
                                                      : "Mayor tráfico"}
                                                  </span>
                                                )}
                                            </div>

                                            <p className="mt-1 text-xs text-slate-500">
                                              Código:{" "}
                                              {link.slug || "Sin código"}
                                            </p>
                                          </div>

                                          <div className="shrink-0 text-right">
                                            <p className="text-2xl font-black text-cyan-400">
                                              {periodClicks}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {share}% del proyecto
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                                          <div
                                            className="h-full rounded-full bg-cyan-400 transition-all"
                                            style={{
                                              width: `${width}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}

                          {campaigns.length > 0 && (
                            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
                              <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <span>Campaña</span>
                                <span>Total</span>
                                <span>Válidos</span>
                              </div>

                              {rankedCampaigns.map((link) => {
                                const stats = link.slug
                                  ? projectStats[link.slug]
                                  : undefined;

                                return (
                                  <div
                                    key={link.id}
                                    className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-slate-800 px-4 py-3 text-sm"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-bold text-slate-200">
                                        {link.project_name || "Campaña sin nombre"}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {link.slug || "Sin código"}
                                      </p>
                                    </div>

                                    <span className="font-bold text-slate-300">
                                      {stats?.totalClicks ?? 0}
                                    </span>

                                    <span className="font-black text-cyan-400">
                                      {stats?.validClicks ?? 0}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {isOpen && (
                        <div className="mt-5 border-t border-slate-800 pt-5">
                          {campaigns.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                              <p className="font-semibold text-slate-300">
                                Este proyecto todavía no tiene campañas vinculadas.
                              </p>
                              <p className="mt-2 text-xs text-slate-500">
                                Puedes crear una nueva o vincular un QR existente desde Mis QR.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                              {campaigns.map((link) => (
                                <div
                                  key={link.id}
                                  className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <span className="inline-flex rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                        {typeLabel(link.type)}
                                      </span>
                                      <p className="mt-2 truncate font-black text-white">
                                        {link.project_name || "Campaña sin nombre"}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Código: {link.slug || "Sin código"}
                                      </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                      <p className="text-2xl font-black text-cyan-400">
                                        {link.slug
                                          ? projectStats[link.slug]?.validClicks ?? 0
                                          : 0}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        clics válidos
                                      </p>
                                    </div>
                                  </div>

                                  {link.slug && (
                                    <button
                                      onClick={() => {
                                        setSelectedAnalyticsSlug(link.slug);
                                        setMainView("analytics");
                                        setShowAnalytics(true);
                                      }}
                                      className="mt-4 w-full rounded-xl border border-violet-400/70 px-3 py-2 text-sm font-bold text-violet-300 transition hover:bg-violet-400 hover:text-slate-950"
                                    >
                                      Ver analítica
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {projects.some((project) => project.archived) && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <h3 className="text-xl font-black text-white">
                  Proyectos archivados
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Sus QR siguen activos. Puedes restaurar el proyecto cuando quieras.
                </p>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {projects
                    .filter((project) => project.archived)
                    .map((project) => {
                      const linkedQrCount = historyLinks.filter(
                        (link) => link.project_id === project.id,
                      ).length;

                      return (
                        <div
                          key={project.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-black text-slate-300">
                                {project.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {linkedQrCount} QR / campañas vinculadas
                              </p>
                            </div>

                            <button
                              onClick={() => restoreProject(project)}
                              disabled={restoringProjectId === project.id}
                              className="rounded-xl border border-emerald-400/70 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {restoringProjectId === project.id
                                ? "Restaurando..."
                                : "Restaurar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </section>
        )}

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

                      <div className="mt-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Proyecto
                        </label>
                        <select
                          value={link.project_id || ""}
                          onChange={(event) =>
                            void updateLinkProject(link, event.target.value)
                          }
                          disabled={updatingProjectLinkId === link.id}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Sin proyecto</option>
                          {projects
                            .filter(
                              (project) =>
                                !project.archived ||
                                project.id === link.project_id,
                            )
                            .map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                                {project.archived ? " (archivado)" : ""}
                              </option>
                            ))}
                        </select>
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

                      {link.type === "whatsapp" &&
                        editingMessageId === link.id && (
                          <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                              Mensaje de WhatsApp
                            </label>

                            <textarea
                              value={editingMessage}
                              onChange={(event) =>
                                setEditingMessage(event.target.value)
                              }
                              rows={5}
                              placeholder="Ej: Hola 👋 Vi el QR de Librería Jade y quisiera hacer una consulta."
                              className="mt-3 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
                            />

                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                El cliente enviará
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                                {editingMessage || "Sin mensaje predeterminado"}
                              </p>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <button
                                onClick={() => previewWhatsAppMessage(link)}
                                disabled={savingMessage}
                                className="rounded-xl border border-emerald-400/70 px-3 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previsualizar
                              </button>

                              <button
                                onClick={() => saveWhatsAppMessage(link)}
                                disabled={savingMessage}
                                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {savingMessage
                                  ? "Guardando..."
                                  : "Guardar mensaje"}
                              </button>

                              <button
                                onClick={cancelEditingMessage}
                                disabled={savingMessage}
                                className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                      {previewQrId === link.id && previewQrImage && (
                        <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-slate-900 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">
                                Previsualización del QR
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Código: {link.slug || "Sin código"}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setPreviewQrId(null);
                                setPreviewQrImage("");
                              }}
                              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800"
                            >
                              Cerrar
                            </button>
                          </div>

                          <div className="mt-4 flex justify-center">
                            <div className="rounded-2xl bg-white p-4">
                              <img
                                src={previewQrImage}
                                alt={`QR de ${link.project_name || "JEc LINK"}`}
                                className="h-56 w-56"
                              />
                            </div>
                          </div>

                          <p className="mt-3 break-all text-center text-xs text-slate-500">
                            {link.slug ? getShortLink(link.slug) : ""}
                          </p>
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
                          onClick={() => previewHistoryQR(link)}
                          disabled={!link.slug}
                          className="rounded-xl border border-cyan-400/70 px-3 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {previewQrId === link.id ? "Ocultar QR" : "Previsualizar QR"}
                        </button>

                        <button
                          onClick={() => startEditingProjectName(link)}
                          className="rounded-xl border border-amber-400/70 px-3 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950"
                        >
                          Editar nombre
                        </button>

                        {link.type === "whatsapp" && (
                          <button
                            onClick={() => startEditingMessage(link)}
                            className="rounded-xl border border-emerald-400/70 px-3 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                          >
                            Editar mensaje
                          </button>
                        )}

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

            Contacto / vCard · Exportar reportes · Integración con Gestor Comercial

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