import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CurrencyMode,
  FormatOptions,
  formatDual,
  formatINR,
  formatMoney,
  formatUSD,
  getMoneyParts,
  INR_TO_USD_RATE,
} from '../utils/currency';

interface CurrencyContextType {
  mode: CurrencyMode;
  setMode: (mode: CurrencyMode) => void;
  format: (amountInINR: number, options?: FormatOptions) => string;
  formatINR: (amount: number, showDecimals?: boolean) => string;
  formatUSD: (amountInINR: number, showDecimals?: boolean) => string;
  formatDual: (amountInINR: number, options?: FormatOptions) => string;
  getParts: (amountInINR: number, showDecimals?: boolean) => { inr: string; usd: string; usdValue: number };
  rate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<CurrencyMode>(() => {
    try {
      const saved = localStorage.getItem('dh_currency_mode');
      if (saved === 'dual' || saved === 'inr' || saved === 'usd') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dual'; // Default to Dual Currency (INR & USD)
  });

  const setMode = (newMode: CurrencyMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('dh_currency_mode', newMode);
    } catch {
      // ignore
    }
  };

  const format = (amountInINR: number, options?: FormatOptions) => {
    return formatMoney(amountInINR, mode, options);
  };

  return (
    <CurrencyContext.Provider
      value={{
        mode,
        setMode,
        format,
        formatINR,
        formatUSD,
        formatDual,
        getParts: getMoneyParts,
        rate: INR_TO_USD_RATE,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      mode: 'dual',
      setMode: () => {},
      format: (amt, opt) => formatMoney(amt, 'dual', opt),
      formatINR,
      formatUSD,
      formatDual,
      getParts: getMoneyParts,
      rate: INR_TO_USD_RATE,
    };
  }
  return context;
};

/**
 * Money Component for rich aesthetic rendering of monetary figures
 */
export const Money: React.FC<{
  amount: number;
  className?: string;
  usdClassName?: string;
  showDecimals?: boolean;
  inline?: boolean;
  prefix?: string;
  suffix?: string;
}> = ({
  amount,
  className = 'font-bold font-mono text-slate-900',
  usdClassName = 'text-slate-500 font-sans text-[0.82em] font-normal ml-1.5',
  showDecimals = false,
  inline = true,
  prefix = '',
  suffix = '',
}) => {
  const { mode, getParts } = useCurrency();
  const parts = getParts(amount, showDecimals);

  if (mode === 'inr') {
    return (
      <span className={className}>
        {prefix}{parts.inr}{suffix}
      </span>
    );
  }

  if (mode === 'usd') {
    return (
      <span className={className}>
        {prefix}{parts.usd}{suffix}
      </span>
    );
  }

  // Dual display
  if (!inline) {
    return (
      <span className="inline-flex flex-col">
        <span className={className}>
          {prefix}{parts.inr}{suffix}
        </span>
        <span className={usdClassName}>
          ({parts.usd})
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline">
      <span className={className}>
        {prefix}{parts.inr}{suffix}
      </span>
      <span className={usdClassName}>
        ({parts.usd})
      </span>
    </span>
  );
};
