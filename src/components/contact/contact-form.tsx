"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/components/i18n/locale-provider";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        school: formData.get("school"),
        phone: formData.get("phone"),
        message: formData.get("message"),
        turnstileToken
      })
    });

    if (!response.ok) {
      setState("error");
      setMessage(t("formFailed"));
      return;
    }

    form.reset();
    setTurnstileToken("");
    setState("success");
    setMessage(t("formSuccess"));
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" placeholder={t("formName")} required minLength={2} />
        <Input name="email" type="email" placeholder={t("formEmail")} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="school" placeholder={t("formSchool")} />
        <Input name="phone" placeholder={t("formPhone")} />
      </div>
      <Textarea name="message" placeholder={t("formMessage")} required minLength={10} />
      <TurnstileChallenge siteKey={siteKey} onVerify={setTurnstileToken} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={state === "submitting" || !turnstileToken}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {state === "submitting" ? t("formSubmitting") : t("formSendMessage")}
        </Button>
        {message ? (
          <p className={state === "error" ? "text-sm text-red-600 dark:text-red-400" : "text-sm text-primary"}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string;
        theme: "auto";
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
      }
    ) => string;
    remove: (widgetId: string) => void;
  };
};

function TurnstileChallenge({ siteKey, onVerify }: { siteKey?: string; onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let widgetId: string | undefined;
    let cancelled = false;
    const render = () => {
      const turnstile = (window as TurnstileWindow).turnstile;
      if (!turnstile || !containerRef.current || cancelled) return;
      widgetId = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: onVerify,
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify("")
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (existingScript) {
      if ((window as TurnstileWindow).turnstile) render();
      else existingScript.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = "true";
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId) (window as TurnstileWindow).turnstile?.remove(widgetId);
    };
  }, [onVerify, siteKey]);

  return <div ref={containerRef} aria-label="Human verification" />;
}
