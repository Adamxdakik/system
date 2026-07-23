import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface Company {
  id: number;
  code: string;
  name: string;
  active: boolean;
  companyType?: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  selectCompany: (company: Company) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  // Track the last company ID we successfully synced to the server session
  const syncedCompanyIdRef = useRef<number | null>(null);

  // Fetch user's companies with roles
  const { data: userCompanies = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/companies"],
  });

  // Extract unique companies from user's company roles
  const companies: Company[] = userCompanies
    .map((uc) => ({
      id: uc.companyId,
      code: uc.companyCode,
      name: uc.companyName,
      active: uc.companyActive,
      companyType: uc.companyType,
    }))
    .filter((company, index, self) =>
      index === self.findIndex((c) => c.id === company.id)
    );

  // Restore selected company from localStorage on mount, or auto-select first company
  useEffect(() => {
    if (companies.length === 0) return;
    if (selectedCompany) return; // already set

    const savedCompanyId = localStorage.getItem("selectedCompanyId");
    const restored = savedCompanyId
      ? companies.find((c) => c.id === parseInt(savedCompanyId))
      : null;

    setSelectedCompany(restored ?? companies[0]);
  }, [companies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever selectedCompany changes, sync the company to the server session.
  // This covers: auto-select, localStorage restore, and manual selectCompany calls.
  useEffect(() => {
    if (!selectedCompany) return;
    if (syncedCompanyIdRef.current === selectedCompany.id) return; // already synced

    fetch("/api/auth/set-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ companyId: selectedCompany.id }),
    }).then((res) => {
      if (res.ok) {
        syncedCompanyIdRef.current = selectedCompany.id;
        // Refresh all data queries for the newly active company
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return !(
              typeof key === "string" &&
              (key.includes("/api/auth") || key.includes("/api/user/companies"))
            );
          },
        });
      }
    }).catch(() => {
      // Network error — will retry on next company change
    });
  }, [selectedCompany]);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    localStorage.setItem("selectedCompanyId", company.id.toString());
  };

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        companies,
        isLoading,
        selectCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
