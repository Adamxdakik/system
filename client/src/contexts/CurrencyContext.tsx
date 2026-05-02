import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type Currency = "USD" | "CFA";

interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate: number | null;
  isLoadingRate: boolean;
  isLoadingCompany: boolean;
  displayCurrency: string | null;
  isMultiCurrency: boolean;
  formatAmount: (amount: number | string, currency?: Currency) => string;
  convertToDisplay: (usdAmount: number) => number;
  convertToUSD: (displayAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { selectedCompany } = useCompany();

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem("selectedCurrency");
    return (stored === "USD" || stored === "CFA") ? stored : "USD";
  });

  const { data: userPrefs } = useQuery<any>({
    queryKey: ["/api/user-preferences"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const saveCurrencyMutation = useMutation({
    mutationFn: async (currency: Currency) => {
      await apiRequest("PUT", "/api/user-preferences", { preferredCurrency: currency });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
    },
  });

  useEffect(() => {
    if (userPrefs?.preferredCurrency) {
      const backendCurrency = userPrefs.preferredCurrency as Currency;
      if (backendCurrency === "USD" || backendCurrency === "CFA") {
        setSelectedCurrency(backendCurrency);
        localStorage.setItem("selectedCurrency", backendCurrency);
      }
    }
  }, [userPrefs?.preferredCurrency]);

  const { data: company, isLoading: isLoadingCompanyQuery } = useQuery<any>({
    queryKey: [`/api/companies/${selectedCompany?.id}`],
    enabled: !!selectedCompany?.id,
  });

  const isLoadingCompany = !selectedCompany?.id || isLoadingCompanyQuery || !company;

  const baseCurrency = company?.baseCurrency || "USD";
  const displayCurrency = company?.displayCurrency && company.displayCurrency !== "none" ? company.displayCurrency : null;
  const isMultiCurrency = !!displayCurrency;

  const { data: rateData, isLoading: isLoadingRate } = useQuery<any>({
    queryKey: ["/api/exchange-rates/latest", selectedCompany?.id, baseCurrency, displayCurrency],
    queryFn: async () => {
      if (!selectedCompany?.id || !displayCurrency || displayCurrency === "none") return null;
      const res = await fetch(
        `/api/exchange-rates/latest?companyId=${selectedCompany.id}&fromCurrency=${baseCurrency}&toCurrency=${displayCurrency}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedCompany?.id && !!displayCurrency,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const exchangeRate = rateData?.rate ? parseFloat(rateData.rate) : null;

  useEffect(() => {
    if (isMultiCurrency && !isLoadingRate && !exchangeRate) {
      console.warn("[Currency] Multi-currency company but no exchange rate found. Prices will display in base currency (USD). Set exchange rate in Settings.");
    }
  }, [isMultiCurrency, isLoadingRate, exchangeRate]);

  const setCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency);
    saveCurrencyMutation.mutate(currency);
  };

  const toggleCurrency = () => {
    const newCurrency = selectedCurrency === "USD" ? "CFA" : "USD";
    setCurrency(newCurrency);
  };

  const convertToDisplay = (usdAmount: number): number => {
    if (!exchangeRate || selectedCurrency === "USD") return usdAmount;
    return usdAmount * exchangeRate;
  };

  const convertToUSD = (displayAmount: number): number => {
    if (!exchangeRate) return displayAmount;
    return displayAmount / exchangeRate;
  };

  const formatAmount = (amount: number | string, currency?: Currency): string => {
    const curr = currency || selectedCurrency;
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "";

    let displayAmount = numAmount;
    if (curr === "CFA" && exchangeRate) {
      displayAmount = numAmount * exchangeRate;
    } else if (curr === "CFA" && !exchangeRate) {
      console.warn("[Currency] No exchange rate available, displaying in USD");
      const isWhole = Math.abs(numAmount) % 1 === 0;
      return `$ ${numAmount.toLocaleString(undefined, { minimumFractionDigits: isWhole ? 0 : 2, maximumFractionDigits: 2 })}`;
    }

    if (curr === "USD") {
      const isWhole = Math.abs(numAmount) % 1 === 0;
      return `$ ${numAmount.toLocaleString(undefined, { minimumFractionDigits: isWhole ? 0 : 2, maximumFractionDigits: 2 })}`;
    } else {
      return `CFA ${Math.round(displayAmount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setCurrency,
      toggleCurrency,
      exchangeRate,
      isLoadingRate,
      isLoadingCompany,
      displayCurrency,
      isMultiCurrency,
      formatAmount,
      convertToDisplay,
      convertToUSD
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrencyContext must be used within a CurrencyProvider");
  }
  return context;
}
