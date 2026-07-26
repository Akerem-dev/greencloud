import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type FieldCopy = {
  label: string;
  hint?: string;
  error?: string;
};

function describedBy(id: string, hint?: string, error?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export const Gc2Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldCopy
>(function Gc2Input(
  { label, hint, error, id: providedId, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="gc2-field">
      <label className="gc2-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={cn("gc2-input", className)}
        {...props}
      />
      {hint ? (
        <p className="gc2-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="gc2-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const Gc2Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldCopy
>(function Gc2Select(
  {
    label,
    hint,
    error,
    id: providedId,
    className,
    required,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="gc2-field">
      <label className="gc2-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={cn("gc2-select", className)}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p className="gc2-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="gc2-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export const Gc2Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldCopy
>(function Gc2Textarea(
  { label, hint, error, id: providedId, className, required, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="gc2-field">
      <label className="gc2-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={cn("gc2-textarea", className)}
        {...props}
      />
      {hint ? (
        <p className="gc2-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="gc2-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
