import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer = ({ endTime, onExpire, compact = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime).getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className={compact ? "text-xs text-red-400" : "text-sm text-red-400 font-semibold"}>
        Deal Expired
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-orange-400">
        <Clock className="w-3 h-3" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-orange-400" />
      <div className="flex gap-1">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center bg-gray-800 px-2 py-1 rounded">
            <span className="text-lg font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
            <span className="text-xs text-gray-400">Days</span>
          </div>
        )}
        <div className="flex flex-col items-center bg-gray-800 px-2 py-1 rounded">
          <span className="text-lg font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs text-gray-400">Hours</span>
        </div>
        <div className="flex flex-col items-center bg-gray-800 px-2 py-1 rounded">
          <span className="text-lg font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-gray-400">Mins</span>
        </div>
        <div className="flex flex-col items-center bg-gray-800 px-2 py-1 rounded">
          <span className="text-lg font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-gray-400">Secs</span>
        </div>
      </div>
    </div>
  );
};
