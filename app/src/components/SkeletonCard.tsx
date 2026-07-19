import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="block bg-slate-900/60 border border-slate-800 rounded-2xl p-5 animate-pulse">
            <div className="flex justify-between items-center gap-2 mb-5">
                <div className="h-3 w-24 bg-slate-800 rounded"></div>
                <div className="h-3 w-16 bg-slate-800 rounded"></div>
            </div>
            <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0"></div>
                    <div className="h-4 w-32 bg-slate-800 rounded"></div>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0"></div>
                    <div className="h-4 w-28 bg-slate-800 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
