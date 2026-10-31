import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

const INSTALLED_KEY = "karpanda_pwa_installed";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touchSmall =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches &&
    "ontouchstart" in window;
  return uaMobile || touchSmall;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaPrompt() {
  const [mobile, setMobile] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const deferredPrompt = useRef<any>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorker = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    const m = isMobileDevice();
    setMobile(m);
    const st = isStandalone();
    setInstalled(st || localStorage.getItem(INSTALLED_KEY) === "1");

    // Register service worker
    if ("serviceWorker" in navigator) {
      const doRegister = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            registrationRef.current = reg;

            // If a new worker is already waiting
            if (reg.waiting) {
              waitingWorker.current = reg.waiting;
              setUpdateAvailable(true);
            }

            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (!newWorker) return;
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  waitingWorker.current = newWorker;
                  setUpdateAvailable(true);
                }
              });
            });
          })
          .catch(() => {});

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      };

      if (document.readyState === "complete") {
        doRegister();
      } else {
        window.addEventListener("load", doRegister, { once: true });
      }
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      const alreadyInstalled =
        isStandalone() || localStorage.getItem(INSTALLED_KEY) === "1";
      if (m && !alreadyInstalled) {
        setShowInstall(true);
        setShowIosHint(false);
      }
    };

    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      setShowInstall(false);
      setShowIosHint(false);
      deferredPrompt.current = null;
    };

    // iOS Safari has no beforeinstallprompt: show manual instructions
    const isIosSafari =
      /iPhone|iPad|iPod/.test(navigator.userAgent) &&
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    if (m && isIosSafari && !st && localStorage.getItem(INSTALLED_KEY) !== "1") {
      const timer = window.setTimeout(() => {
        if (!deferredPrompt.current) setShowIosHint(true);
      }, 2500);
      // store cleanup? effect cleanup handles listeners only; timer cleared on unmount not tracked. Acceptable.
      void timer;
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Check for updates periodically (every 60 min) when installed/active
  useEffect(() => {
    if (!mobile) return;
    const id = window.setInterval(() => {
      registrationRef.current?.update().catch(() => {});
    }, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [mobile]);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result?.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setInstalled(true);
      setShowInstall(false);
    }
    deferredPrompt.current = null;
  };

  const handleUpdate = () => {
    const worker = waitingWorker.current || registrationRef.current?.waiting;
    if (worker) {
      worker.postMessage("SKIP_WAITING");
    } else {
      window.location.reload();
    }
  };

  const dismissInstall = () => setShowInstall(false);

  // Only show on mobile devices
  if (!mobile) return null;

  // Update banner takes priority
  if (updateAvailable) {
    return (
      <div className="pwa-prompt pwa-prompt-update" role="status" aria-live="polite">
        <div className="pwa-prompt-text">
          <strong>Nueva versión disponible</strong>
          <span>Actualiza Karpanda para obtener las últimas mejoras.</span>
        </div>
        <div className="pwa-prompt-actions">
          <button className="button pwa-prompt-btn" onClick={handleUpdate}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>
    );
  }

  // Already installed (standalone or previously installed): don't show install prompt
  if (installed || isStandalone()) return null;

  if (showIosHint) {
    return (
      <div className="pwa-prompt" role="dialog" aria-label="Instalar aplicación">
        <div className="pwa-prompt-text">
          <strong>Instala Karpanda</strong>
          <span>
            En Safari toca <em>Compartir</em> y luego “Agregar a pantalla de inicio”.
          </span>
        </div>
        <div className="pwa-prompt-actions">
          <button
            className="button-plain pwa-prompt-dismiss"
            aria-label="Cerrar"
            onClick={() => setShowIosHint(false)}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (!showInstall) return null;

  return (
    <div className="pwa-prompt" role="dialog" aria-label="Instalar aplicación">
      <div className="pwa-prompt-text">
        <strong>Instala Karpanda</strong>
        <span>Accede más rápido y úsala como app en tu teléfono.</span>
      </div>
      <div className="pwa-prompt-actions">
        <button className="button pwa-prompt-btn" onClick={handleInstall}>
          <Download size={16} /> Instalar
        </button>
        <button
          className="button-plain pwa-prompt-dismiss"
          aria-label="Cerrar"
          onClick={dismissInstall}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}