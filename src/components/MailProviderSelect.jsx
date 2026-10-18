// Reusable mail-provider dropdown shared by every admin mailer.
export default function MailProviderSelect({ value, onChange, className = '' }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-black border-2 border-zinc-700 p-3 rounded-lg text-white font-bold focus:border-brand-yellow outline-none uppercase text-sm ${className}`}
        >
            <option value="zeptomail">Zoho ZeptoMail</option>
            <option value="bridge1">Bridge 1 (CIIE)</option>
            <option value="bridge2">Bridge 2 (E-Cell)</option>
        </select>
    );
}
