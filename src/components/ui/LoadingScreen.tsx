'use client';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a]">
            <div className="relative h-24 w-24">
                {/* Outer pulse */}
                <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"></div>
                {/* Spinner */}
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500"></div>
            </div>
            <div className="mt-8 text-center">
                <h1 className="text-xl font-semibold tracking-tight text-white animate-pulse">
                    Whatsappagent
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Chargement du Concierge Anticipatif...
                </p>
            </div>
        </div>
    );
}
