// Reusable "mail bridge" dropdown, matching the provider selector already used in
// CertificateManager.jsx, so every mailer in the admin panel offers the same options.
export default function MailProviderSelect({ value, onChange, className = '' }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-black border-2 border-zinc-700 p-3 rounded-lg text-white font-bold focus:border-brand-yellow outline-none uppercase text-sm ${className}`}
        >
            <option value="zeptomail">Zoho ZeptoMail</option>
            <option value="resend">Default (Resend)</option>
            <option value="bridge1">Bridge 1 (CIIE)</option>
            <option value="bridge2">Bridge 2 (E-Cell)</option>
        </select>
    );
}
