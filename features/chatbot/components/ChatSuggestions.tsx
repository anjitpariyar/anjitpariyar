import styles from "./Chat.module.scss";

type Props = {
  items: { label: string; message: string }[];
  onSelect: (message: string) => void;
  disabled?: boolean;
  label: string;
  variant?: "chips" | "list";
};

export default function ChatSuggestions({ items, onSelect, disabled, label, variant = "chips" }: Props) {
  if (!items.length) return null;
  return (
    <ul className={variant === "list" ? styles.suggestionList : styles.chips} aria-label={label}>
      {items.map((s) => (
        <li key={s.message}>
          <button type="button" onClick={() => onSelect(s.message)} disabled={disabled}>
            {s.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
