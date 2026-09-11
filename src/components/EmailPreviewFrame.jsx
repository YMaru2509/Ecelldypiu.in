import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

// Renders an email's HTML in an iframe with a Desktop/Mobile viewport toggle, so admins
// can check both layouts before sending — most email clients render very differently
// on a ~375px mobile width vs a ~600px desktop reading pane.
export default function EmailPreviewFrame({ srcDoc, title = 'Email Rendered Preview', desktopHeight = 450, mobileHeight = 600 }) {
    const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
    const isMobile = device === 'mobile';

    return (
        <div>
            <div className="flex items-center justify-center gap-2 bg-black p-1.5 rounded-xl border border-zinc-800 mb-3 w-fit mx-auto">
                <button
                    type="button"
                    onClick={() => setDevice('desktop')}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 ${
                        !isMobile ? 'bg-brand-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                    type="button"
                    onClick={() => setDevice('mobile')}
                    className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 ${
                        isMobile ? 'bg-brand-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
            </div>

            <div className="flex justify-center bg-black rounded-xl border-2 border-zinc-700 p-3 overflow-x-auto">
                <div
                    className={isMobile ? 'border-4 border-zinc-700 rounded-[28px] overflow-hidden bg-black' : 'w-full'}
                    style={isMobile ? { width: 375 } : undefined}
                >
                    <iframe
                        srcDoc={srcDoc}
                        title={title}
                        className={`w-full border-none bg-black ${isMobile ? '' : 'rounded-lg'}`}
                        style={{ height: isMobile ? mobileHeight : desktopHeight }}
                    />
                </div>
            </div>
        </div>
    );
}
