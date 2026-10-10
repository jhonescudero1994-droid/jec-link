"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setHasSession(Boolean(session));
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function savePassword() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasSession) {
      setErrorMessage(
        "El enlace no tiene una sesión válida. Solicita un nuevo correo desde JEc LINK.",
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (error) {
      console.error("Error actualizando contraseña:", error);
      setErrorMessage("No se pudo guardar la contraseña. Solicita un nuevo enlace.");
      return;
    }

    setSuccessMessage("Contraseña guardada correctamente. Entrando a JEc LINK...");

    window.setTimeout(() => {
      router.replace("/");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-black tracking-[0.35em] text-cyan-400">
            JEC LINK
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Crear contraseña
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Define la contraseña que usarás para ingresar a tu cuenta.
          </p>
        </div>

        {checkingSession ? (
          <p className="mt-8 text-center text-sm text-slate-400">
            Validando enlace...
          </p>
        ) : !hasSession ? (
          <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
            Este enlace no tiene una sesión válida. Vuelve a JEc LINK y solicita
            un nuevo correo con “Crear / recuperar contraseña”.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contraseña"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />

            {errorMessage && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
                {successMessage}
              </p>
            )}

            <button
              type="button"
              onClick={savePassword}
              disabled={saving}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar contraseña"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
