import styles from "./Contact.module.scss";
import { useForm } from "react-hook-form";

// Initializing a client

const Form = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => console.log(data);
  // console.log("env", process.env.REACT_APP_NOTION_WORKPLACE_ID);

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
    </section>
  );
};

export default Form;
