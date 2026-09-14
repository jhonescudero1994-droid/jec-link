"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
type Mode = "whatsapp" | "web" | "phone" | "sms" | "email" | "text";

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
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics");

        if (!response.ok) {
          throw new Error("No se pudo cargar la analítica.");
        }

        const data = await response.json();

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
      } catch (error) {
        console.error("Error cargando analítica:", error);
      }
    }

    loadAnalytics();
  }, []);
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

async function saveToSupabase(value: string) {
  const slug = generateSlug();

  const { error } = await supabase.from("links").insert({
    type: mode,
    content: getOriginalContent(),
    generated_url: value,
    message: getMessageContent(),
    slug,
    clicks: 0,
  });

  if (error) {
    console.error("Error guardando en Supabase:", error);
    return null;
  }

  console.log("JEc LINK guardado correctamente en Supabase.");
  console.log("Slug generado:", slug);

  return slug;
}

async function createQR(value: string) {
  try {
    const slug = await saveToSupabase(value);

    if (!slug) {
      alert("No se pudo crear el enlace corto.");
      return;
    }

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
      new URL(cleanURL);
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

  function clearResult() {
    setResult("");
    setQr("");
    setCopied(false);
  }

 function changeMode(newMode: Mode) {
  setShowAnalytics(false);
  setMode(newMode);
  clearResult();
}
  function clearAll() {
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

        <section className="mb-7">
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
            <button
  onClick={() => setShowAnalytics(true)}
  className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
    showAnalytics
      ? "bg-cyan-400 text-slate-950"
      : "text-slate-400 hover:bg-slate-800"
  }`}
>
  📊 Analítica
</button>
          </div>
        </section>

        <section
  className={`grid gap-6 lg:grid-cols-2 ${
    showAnalytics ? "hidden" : ""
  }`}
>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
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

        {showAnalytics && (
          <section className="mt-8 rounded-2xl border border-cyan-500/30 bg-slate-900 p-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Analítica JEc LINK
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                Panel de estadísticas
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                Resumen general de tus enlaces y clics registrados.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm font-semibold text-slate-400">
                  Enlaces creados
                </p>
                <p className="mt-2 text-4xl font-black text-cyan-400">
                  {totalLinks}
                </p>
              </div>

             <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
  <p className="text-sm font-semibold text-slate-400">
    Clics registrados
  </p>
  <p className="mt-2 text-4xl font-black text-cyan-400">
    {totalClicks}
  </p>
</div>

<div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
  <p className="text-sm font-semibold text-slate-400">
    Clics válidos
  </p>
  <p className="mt-2 text-4xl font-black text-cyan-400">
    {validClicks}
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

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <p className="text-sm font-semibold text-slate-400">
                  País principal
                </p>
                <p className="mt-2 text-2xl font-black text-cyan-400">
                  {topCountry}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {topCountryCount} clics
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
                  {topCityCount} clics
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
                  {topDeviceCount} clics
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            Próxima evolución
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Contacto / vCard · Mis QR · Enlaces cortos JEc LINK
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