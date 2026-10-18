import { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

const SIZE = 320;
const FRAME_SIZE = 240;
const FRAME_OFFSET = (SIZE - FRAME_SIZE) / 2;
const BLEED_SIZE = FRAME_SIZE + 32;
const BLEED_OFFSET = (SIZE - BLEED_SIZE) / 2;

const PhotoEditor = ({ src, onCancel, onSave }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const dragRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');

    const getBounds = () => {
        const image = imageRef.current;
        if (!image) return { x: 0, y: 0 };
        const baseScale = Math.max(FRAME_SIZE / image.width, FRAME_SIZE / image.height) * zoom;
        const quarterTurn = Math.abs(rotation % 180) === 90;
        const width = (quarterTurn ? image.height : image.width) * baseScale;
        const height = (quarterTurn ? image.width : image.height) * baseScale;
        return {
            x: Math.max(0, (width - FRAME_SIZE) / 2),
            y: Math.max(0, (height - FRAME_SIZE) / 2),
        };
    };

    const clampOffset = (next) => {
        const bounds = getBounds();
        return {
            x: Math.max(-bounds.x, Math.min(bounds.x, next.x)),
            y: Math.max(-bounds.y, Math.min(bounds.y, next.y)),
        };
    };

    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            imageRef.current = image;
            setReady(true);
        };
        image.onerror = () => setError('This image could not be edited. Please choose another image.');
        image.src = src;
    }, [src]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || !ready) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#101217';
        ctx.fillRect(0, 0, SIZE, SIZE);

        // The image is only visible inside the crop frame. The surrounding
        // shaded area is the bleed boundary and makes the final crop obvious.
        ctx.save();
        ctx.beginPath();
        ctx.rect(FRAME_OFFSET, FRAME_OFFSET, FRAME_SIZE, FRAME_SIZE);
        ctx.clip();
        ctx.translate(FRAME_OFFSET + FRAME_SIZE / 2 + offset.x, FRAME_OFFSET + FRAME_SIZE / 2 + offset.y);
        ctx.rotate((rotation * Math.PI) / 180);
        const coverScale = Math.max(FRAME_SIZE / image.width, FRAME_SIZE / image.height) * zoom;
        ctx.drawImage(image, -(image.width * coverScale) / 2, -(image.height * coverScale) / 2, image.width * coverScale, image.height * coverScale);
        ctx.restore();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
        ctx.fillRect(0, 0, SIZE, FRAME_OFFSET);
        ctx.fillRect(0, FRAME_OFFSET + FRAME_SIZE, SIZE, FRAME_OFFSET);
        ctx.fillRect(0, FRAME_OFFSET, FRAME_OFFSET, FRAME_SIZE);
        ctx.fillRect(FRAME_OFFSET + FRAME_SIZE, FRAME_OFFSET, FRAME_OFFSET, FRAME_SIZE);

        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(255, 178, 44, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(BLEED_OFFSET, BLEED_OFFSET, BLEED_SIZE, BLEED_SIZE);
        ctx.setLineDash([]);
        ctx.strokeStyle = '#FFB22C';
        ctx.lineWidth = 3;
        ctx.strokeRect(FRAME_OFFSET, FRAME_OFFSET, FRAME_SIZE, FRAME_SIZE);
        ctx.restore();
    }, [ready, zoom, rotation, offset]);

    useEffect(() => {
        setOffset((previous) => {
            const next = clampOffset(previous);
            return next.x === previous.x && next.y === previous.y ? previous : next;
        });
    }, [zoom, rotation, ready]);

    const startDrag = (event) => {
        event.preventDefault();
        const point = event.touches?.[0] || event;
        dragRef.current = { x: point.clientX, y: point.clientY, offset };
    };

    const moveDrag = (event) => {
        if (!dragRef.current) return;
        const point = event.touches?.[0] || event;
        setOffset(clampOffset({
            x: dragRef.current.offset.x + point.clientX - dragRef.current.x,
            y: dragRef.current.offset.y + point.clientY - dragRef.current.y,
        }));
    };

    const stopDrag = () => { dragRef.current = null; };

    const save = () => {
        const image = imageRef.current;
        if (!image || !ready) return;
        const output = document.createElement('canvas');
        output.width = FRAME_SIZE;
        output.height = FRAME_SIZE;
        const ctx = output.getContext('2d');
        ctx.fillStyle = '#101217';
        ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, FRAME_SIZE, FRAME_SIZE);
        ctx.clip();
        ctx.translate(FRAME_SIZE / 2 + offset.x, FRAME_SIZE / 2 + offset.y);
        ctx.rotate((rotation * Math.PI) / 180);
        const coverScale = Math.max(FRAME_SIZE / image.width, FRAME_SIZE / image.height) * zoom;
        ctx.drawImage(image, -(image.width * coverScale) / 2, -(image.height * coverScale) / 2, image.width * coverScale, image.height * coverScale);
        ctx.restore();
        output.toBlob((blob) => {
            if (!blob) return;
            const reader = new FileReader();
            reader.onload = () => onSave(reader.result);
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.88);
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
            <div className="w-full max-w-md bg-[var(--bg-card)] border-2 border-brand-yellow rounded-2xl p-5 shadow-[8px_8px_0px_#FFB22C]" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
                    <div>
                        <h2 className="font-black uppercase text-lg">Edit photo</h2>
                        <p className="text-xs text-[var(--text-secondary)]">Crop, rotate, resize and position</p>
                    </div>
                    <button type="button" onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex justify-center">
                    <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={SIZE}
                        height={SIZE}
                        onMouseDown={startDrag}
                        onMouseMove={moveDrag}
                        onMouseUp={stopDrag}
                        onMouseLeave={stopDrag}
                        onTouchStart={startDrag}
                        onTouchMove={moveDrag}
                        onTouchEnd={stopDrag}
                        className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl border-2 border-white/30 cursor-grab active:cursor-grabbing touch-none"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
                        <span className="rounded-full bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-brand-yellow">Crop frame · bleed outside</span>
                    </div>
                    </div>
                </div>

                {error && <p className="text-xs font-bold text-[var(--danger-color)] mt-3">{error}</p>}

                <div className="flex items-center justify-center gap-2 mt-4">
                    <button type="button" onClick={() => setRotation((value) => value - 90)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700" title="Rotate left"><RotateCcw className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setRotation((value) => value + 90)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700" title="Rotate right"><RotateCw className="w-4 h-4" /></button>
                    <ZoomOut className="w-4 h-4 text-[var(--text-secondary)] ml-3" />
                    <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-32 accent-brand-yellow" aria-label="Resize photo" />
                    <ZoomIn className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">Drag the image inside the crop box to position it.</p>

                <div className="flex justify-end gap-2 mt-5">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-black uppercase text-[var(--text-secondary)]">Cancel</button>
                    <button type="button" disabled={!ready} onClick={save} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] text-xs font-black uppercase disabled:opacity-50"><Check className="w-4 h-4" /> Use photo</button>
                </div>
            </div>
        </div>
    );
};

export default PhotoEditor;
