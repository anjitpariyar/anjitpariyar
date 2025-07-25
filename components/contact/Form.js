import styles from "./Contact.module.scss";
import { useForm } from "react-hook-form";
import { db } from "../../firebase/clientApp";
import { useEffect, useState, useRef } from "react";
import { collection, addDoc, onSnapshot, query } from "firebase/firestore";
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

  const setData = async (data) => {
    // e.preventDefault();
    await addDoc(collection(db, "data"), {
      ...data,
      date: new Date(Date.now()),
    }).then(() => {
      reset();
      setToast(true);
      gsap.to(toastRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power4.out",
      });
    });
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
      setTimeout(() => {
        setToast(false);
      }, 6000);
    }
    return () => {
      clearTimeout();
    };
  }, [toast]);

  const hideToast = () => {
    gsap.to(toastRef.current, {
      y: 500,
      opacity: 0.3,
      duration: 1,
      ease: "power4.out",
    });
    setTimeout(() => {
      setToast(false);
    }, 11000);
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
          <button className={styles.btn + " " + styles.formBtn} type="submit">
            Send
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
