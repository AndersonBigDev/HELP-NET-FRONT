const baseInput =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent disabled:opacity-50";

function Label({ label, required, htmlFor }) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text-muted">
      {label}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}

function Error({ error }) {
  if (!error) return null;
  return <p className="mt-1.5 text-xs text-danger">{error}</p>;
}

export function Input({ label, error, required, id, className = "", ...props }) {
  return (
    <div>
      <Label label={label} required={required} htmlFor={id} />
      <input id={id} className={`${baseInput} ${className}`} required={required} {...props} />
      <Error error={error} />
    </div>
  );
}

export function TextArea({ label, error, required, id, rows = 4, className = "", ...props }) {
  return (
    <div>
      <Label label={label} required={required} htmlFor={id} />
      <textarea id={id} rows={rows} className={`${baseInput} resize-none ${className}`} required={required} {...props} />
      <Error error={error} />
    </div>
  );
}

export function Select({ label, error, required, id, options, placeholder, className = "", ...props }) {
  return (
    <div>
      <Label label={label} required={required} htmlFor={id} />
      <select id={id} className={`${baseInput} ${className}`} required={required} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Error error={error} />
    </div>
  );
}
