import React, { useState, useEffect } from 'react';

export const MarketStatus: React.FC = () => {
  const getSessionStatus = (tz: string) => {
    const now = new Date();
    const day = now.getDay();
    const localTimeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12: false });
    const [h, m] = localTimeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;
    const openMinutes = 8 * 60;
    const closeMinutes = 17 * 60;

    let isOpen = false;
    let message = '';

    if (day === 0 || day === 6) {
        message = `Opens Mon 08:00`;
    } else {
        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            isOpen = true;
            const diff = closeMinutes - currentMinutes;
            const hrs = Math.floor(diff / 60);
            const mins = diff % 60;
            message = `Closes in ${hrs}h ${mins}m`;
        } else {
            let diff = 0;
            if (currentMinutes < openMinutes) {
                diff = openMinutes - currentMinutes;
            } else {
                diff = (24 * 60 - currentMinutes) + openMinutes;
            }
            const hrs = Math.floor(diff / 60);
            const mins = diff % 60;
            message = `Opens in ${hrs}h ${mins}m`;
        }
    }
    return { isOpen, message };
  };

  const MiniClock = ({ city, tz }: { city: string, tz: string }) => {
    const nowString = new Date().toLocaleTimeString('en-US', { timeZone: tz, hour12: false });
    const { isOpen, message } = getSessionStatus(tz);

    return (
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-slate-700">{city}</span>
        <span className="font-mono font-semibold text-lg text-slate-900">{nowString.substring(0, 5)}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          <span className="text-[10px] text-slate-500 font-semibold">{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 items-center p-2 rounded-lg bg-slate-200/50">
        <MiniClock city="LONDON" tz="Europe/London" />
        <div className="w-px h-10 bg-slate-300"></div>
        <MiniClock city="NEW YORK" tz="America/New_York" />
    </div>
  );
};