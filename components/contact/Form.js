import styles from "./Contact.module.scss";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import Cross from "/svg/Cross";
import { gsap } from "gsap/dist/gsap";

// Initializing a client

const Form = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [toast, setToast] = useState(false);

  const toastRef = useRef(null);
  const toastTimer = useRef(null);
  // Time trap for bots: real visitors take more than a few seconds to fill the form.
  const startedAt = useRef(Date.now());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Goes through POST /api/contact (bot guard, honeypot, rate limit) instead of writing to Firestore directly.
  const setData = async (data) => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Chat-Client": "web" },
        body: JSON.stringify({ ...data, startedAt: startedAt.current }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't send right now. Please try again later.");
      }
      reset();
      startedAt.current = Date.now();
      setToast(true);
      gsap.to(toastRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power4.out",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (data) => {
    setData(data);
  };
  useEffect(() => {
    if (toast) {
      gsap.to(toastRef.current, {
        y: 500,
        opacity: 0.3,
        duration: 1,
        ease: "power4.out",
        delay: 5,
      });
      toastTimer.current = setTimeout(() => setToast(false), 6000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  const hideToast = () => {
    gsap.to(toastRef.current, {
      y: 500,
      opacity: 0.3,
      duration: 1,
      ease: "power4.out",
    });
    // Unmount once the 1s slide-out finishes, replacing the auto-hide timer.
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 1000);
  };

  return (
    <section className={styles.contactForm}>
      <div className={styles.container + " " + styles.commonPadding}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="Your Name"
              {...register("name", { required: true })}
              type="text"
            />
            <input
              className={styles.input}
              placeholder="Your Email"
              type="email"
              {...register("email", { required: true })}
            />
          </div>
          <textarea
            className={styles.input}
            placeholder="Your message .."
            {...register("message", { required: true })}
          ></textarea>
          {/* Honeypot: hidden from people, bots fill it in. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
            {...register("website")}
          />
          {error && (
            <p role="alert" style={{ color: "#b3261e", margin: "0.5rem 0" }}>
              {error}
            </p>
          )}
          <button className={styles.btn + " " + styles.formBtn} type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
      {toast && (
        <div className={styles.toast} ref={toastRef}>
          <p>Thank you for messaging. I&apos;ll reach to you soon.</p>
          <span className={styles.cross} onClick={() => hideToast()}>
            <Cross />
          </span>
        </div>
      )}
    </section>
  );
};

export default Form;
