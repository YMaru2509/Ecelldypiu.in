
import React from 'react';

const FunkyMarquee = ({ text, direction = 'left', speed = 45, className = "" }) => {
    return (
        <div className={`theme-marquee relative flex overflow-hidden py-4 group ${className}`}>
            <div
                className={`flex whitespace-nowrap group-hover:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'}`}
                style={{ animationDuration: `${speed}s` }}
            >
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-6xl md:text-8xl font-black mx-8 uppercase tracking-tighter">
                        {text} <span className="text-brand-yellow">•</span>
                    </span>
                ))}
            </div>
            <div
                className={`flex whitespace-nowrap group-hover:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'} absolute top-4 left-0`}
                style={{ animationDuration: `${speed}s` }}
            >
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-6xl md:text-8xl font-black mx-8 uppercase tracking-tighter">
                        {text} <span className="text-brand-yellow">•</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FunkyMarquee;
