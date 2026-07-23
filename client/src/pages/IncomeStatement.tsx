import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, History, Calculator, Users, Wallet, Package, Ship, Building2 } from "lucide-react";
import { format } from "date-fns";

interface MonthData {
  [key: string]: number;
}

interface LineItem {
  name: string;
  data: MonthData;
}

interface IncomeStatementData {
  year: number;
  locationId: number | null;
  months: { key: string; name: string }[];
  revenue: LineItem[];
  cogs: LineItem[];
  operatingExpenses: LineItem[];
  governmentTaxes: LineItem[];
  dutiesAndCharges: LineItem[];
  moneyOut: MonthData;
  interestName: string;
  interest: MonthData;
}

interface LiquidationValueData {
  stockMotos: { value: number; quantity: number };
  stockParts: { value: number; quantity: number };
  containersOtw: { value: number; items: { name: string; value: number }[] };
  dutyAgents: { total: number; items: { name: string; balance: number }[] };
  transporters: { total: number; items: { name: string; balance: number }[] };
  suppliers: { total: number; items: { name: string; balance: number }[] };
  fixedAssets: { total: number; items: { name: string; balance: number }[] };
  loans: { total: number; items: { name: string; balance: number }[] };
  cashBank: { total: number; items: { name: string; balance: number }[] };
  summary: { totalAssets: number; totalLiabilities: number; liquidationValue: number };
}

interface LiquidationEntry {
  date: string;
  supplierBalances: { name: string; balance: number }[];
  stockValues: { name: string; value: number }[];
  cashPositions: { name: string; amount: number }[];
  moneyOut: number;
  inPocket: number;
  liquidationValue: number;
}

interface LiquidationHistoryData {
  entries: LiquidationEntry[];
  columns: {
    supplierNames: string[];
    stockGroupNames: string[];
    cashAccountNames: string[];
  };
}

interface Customer {
  id: number;
  legalName: string;
  code: string;
  balance: number;
  balanceSide: string;
}

interface CustomerTransaction {
  id: number;
  transactionDate: string;
  transactionType: string;
  description: string | null;
  debitAmount: string;
  creditAmount: string;
  balance: string;
}

const formatCurrency = (value: number): string => {
  if (value === 0) return "-";
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
};

function IncomeStatementTab({ 
  selectedYear, 
  selectedLocation, 
  locations 
}: { 
  selectedYear: string; 
  selectedLocation: string;
  locations: any[];
}) {
  const queryParams = new URLSearchParams();
  queryParams.append("year", selectedYear);
  if (selectedLocation !== "all") {
    queryParams.append("locationId", selectedLocation);
  }

  const { data, isLoading } = useQuery<IncomeStatementData>({
    queryKey: [`/api/stats/income-statement?${queryParams.toString()}`],
  });

  const calculateTotal = (monthData: MonthData, months: { key: string }[]): number => {
    return months.reduce((sum, m) => sum + (monthData[m.key] || 0), 0);
  };

  const calculateLineItemsTotal = (items: LineItem[], monthKey: string): number => {
    return items.reduce((sum, item) => sum + (item.data[monthKey] || 0), 0);
  };

  const calculateLineItemsGrandTotal = (items: LineItem[], months: { key: string }[]): number => {
    return months.reduce((sum, m) => sum + calculateLineItemsTotal(items, m.key), 0);
  };

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  const months = data?.months || [];
  const revenue = data?.revenue || [];
  const cogs = data?.cogs || [];
  const operatingExpenses = data?.operatingExpenses || [];
  const governmentTaxes = data?.governmentTaxes || [];
  const dutiesAndCharges = data?.dutiesAndCharges || [];
  const moneyOut = data?.moneyOut || {};
  const interestName = data?.interestName || "Interest";
  const interest = data?.interest || {};

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg">
          {selectedLocation !== "all"
            ? `Income Statement - ${locations.find((l: any) => l.id.toString() === selectedLocation)?.name || "Location"}`
            : "Income Statement - All Locations"}
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          JAN - DEC {selectedYear}
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="font-bold min-w-[200px]">Description</TableHead>
              {months.map((m) => (
                <TableHead key={m.key} className="text-right font-bold min-w-[100px]">
                  {m.name}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold min-w-[120px] bg-primary/20">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-green-500/10">
              <TableCell colSpan={months.length + 2} className="font-bold text-green-700 dark:text-green-400">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Revenue
                </div>
              </TableCell>
            </TableRow>

            {revenue.map((item, idx) => (
              <TableRow key={`rev-${idx}`}>
                <TableCell className="pl-6">{item.name}</TableCell>
                {months.map((m) => (
                  <TableCell key={m.key} className="text-right font-mono text-sm">
                    {formatCurrency(item.data[m.key] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-mono text-sm font-medium bg-muted/30">
                  {formatCurrency(calculateTotal(item.data, months))}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-green-500/20 font-bold">
              <TableCell className="pl-4">Net Sales</TableCell>
              {months.map((m) => (
                <TableCell key={m.key} className="text-right font-mono">
                  {formatCurrency(calculateLineItemsTotal(revenue, m.key))}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono bg-green-500/30">
                {formatCurrency(calculateLineItemsGrandTotal(revenue, months))}
              </TableCell>
            </TableRow>

            <TableRow className="bg-orange-500/10">
              <TableCell colSpan={months.length + 2} className="font-bold text-orange-700 dark:text-orange-400">
                Cost of Goods Sold
              </TableCell>
            </TableRow>

            {cogs.map((item, idx) => (
              <TableRow key={`cogs-${idx}`}>
                <TableCell className="pl-6">{item.name}</TableCell>
                {months.map((m) => (
                  <TableCell key={m.key} className="text-right font-mono text-sm">
                    {formatCurrency(item.data[m.key] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-mono text-sm font-medium bg-muted/30">
                  {formatCurrency(calculateTotal(item.data, months))}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-orange-500/20 font-bold">
              <TableCell className="pl-4">Total Cost of Goods Sold</TableCell>
              {months.map((m) => (
                <TableCell key={m.key} className="text-right font-mono">
                  {formatCurrency(calculateLineItemsTotal(cogs, m.key))}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono bg-orange-500/30">
                {formatCurrency(calculateLineItemsGrandTotal(cogs, months))}
              </TableCell>
            </TableRow>

            <TableRow className="bg-blue-500/20 font-bold text-lg">
              <TableCell className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Gross Profit
              </TableCell>
              {months.map((m) => {
                const grossProfit = calculateLineItemsTotal(revenue, m.key) - calculateLineItemsTotal(cogs, m.key);
                return (
                  <TableCell key={m.key} className={`text-right font-mono ${grossProfit < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(grossProfit)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-mono bg-blue-500/30">
                {formatCurrency(calculateLineItemsGrandTotal(revenue, months) - calculateLineItemsGrandTotal(cogs, months))}
              </TableCell>
            </TableRow>

            <TableRow className="bg-red-500/10">
              <TableCell colSpan={months.length + 2} className="font-bold text-red-700 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Operating Expenses
                </div>
              </TableCell>
            </TableRow>

            {operatingExpenses.map((item, idx) => (
              <TableRow key={`exp-${idx}`}>
                <TableCell className="pl-6">{item.name}</TableCell>
                {months.map((m) => (
                  <TableCell key={m.key} className="text-right font-mono text-sm">
                    {formatCurrency(item.data[m.key] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-mono text-sm font-medium bg-muted/30">
                  {formatCurrency(calculateTotal(item.data, months))}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="bg-red-500/20 font-bold">
              <TableCell className="pl-4">Total Operating Expenses</TableCell>
              {months.map((m) => (
                <TableCell key={m.key} className="text-right font-mono">
                  {formatCurrency(calculateLineItemsTotal(operatingExpenses, m.key))}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono bg-red-500/30">
                {formatCurrency(calculateLineItemsGrandTotal(operatingExpenses, months))}
              </TableCell>
            </TableRow>

            {governmentTaxes.length > 0 && (
              <>
                <TableRow className="bg-amber-500/10">
                  <TableCell colSpan={months.length + 2} className="font-bold text-amber-700 dark:text-amber-400">
                    Government Taxes
                  </TableCell>
                </TableRow>

                {governmentTaxes.map((item, idx) => (
                  <TableRow key={`tax-${idx}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    {months.map((m) => (
                      <TableCell key={m.key} className="text-right font-mono text-sm">
                        {formatCurrency(item.data[m.key] || 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-mono text-sm font-medium bg-muted/30">
                      {formatCurrency(calculateTotal(item.data, months))}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-amber-500/20 font-bold">
                  <TableCell className="pl-4">Total Government Taxes</TableCell>
                  {months.map((m) => (
                    <TableCell key={m.key} className="text-right font-mono">
                      {formatCurrency(calculateLineItemsTotal(governmentTaxes, m.key))}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-mono bg-amber-500/30">
                    {formatCurrency(calculateLineItemsGrandTotal(governmentTaxes, months))}
                  </TableCell>
                </TableRow>
              </>
            )}

            {dutiesAndCharges.length > 0 && (
              <>
                <TableRow className="bg-violet-500/10">
                  <TableCell colSpan={months.length + 2} className="font-bold text-violet-700 dark:text-violet-400">
                    Duties & Charges (FTPYT)
                  </TableCell>
                </TableRow>

                {dutiesAndCharges.map((item, idx) => (
                  <TableRow key={`duty-${idx}`}>
                    <TableCell className="pl-6">{item.name}</TableCell>
                    {months.map((m) => (
                      <TableCell key={m.key} className="text-right font-mono text-sm">
                        {formatCurrency(item.data[m.key] || 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-mono text-sm font-medium bg-muted/30">
                      {formatCurrency(calculateTotal(item.data, months))}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-violet-500/20 font-bold">
                  <TableCell className="pl-4">Total Duties & Charges</TableCell>
                  {months.map((m) => (
                    <TableCell key={m.key} className="text-right font-mono">
                      {formatCurrency(calculateLineItemsTotal(dutiesAndCharges, m.key))}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-mono bg-violet-500/30">
                    {formatCurrency(calculateLineItemsGrandTotal(dutiesAndCharges, months))}
                  </TableCell>
                </TableRow>
              </>
            )}

            <TableRow className="bg-primary/20 font-bold text-lg">
              <TableCell className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                NET PROFIT
              </TableCell>
              {months.map((m) => {
                const profit = calculateLineItemsTotal(revenue, m.key) - 
                  calculateLineItemsTotal(cogs, m.key) - 
                  calculateLineItemsTotal(operatingExpenses, m.key) -
                  calculateLineItemsTotal(governmentTaxes, m.key) -
                  calculateLineItemsTotal(dutiesAndCharges, m.key);
                return (
                  <TableCell key={m.key} className={`text-right font-mono ${profit < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(profit)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-mono bg-primary/30">
                {formatCurrency(
                  calculateLineItemsGrandTotal(revenue, months) -
                  calculateLineItemsGrandTotal(cogs, months) -
                  calculateLineItemsGrandTotal(operatingExpenses, months) -
                  calculateLineItemsGrandTotal(governmentTaxes, months) -
                  calculateLineItemsGrandTotal(dutiesAndCharges, months)
                )}
              </TableCell>
            </TableRow>

            <TableRow className="h-4">
              <TableCell colSpan={months.length + 2}></TableCell>
            </TableRow>

            <TableRow className="bg-gray-500/10">
              <TableCell className="font-semibold">MONEY OUT</TableCell>
              {months.map((m) => (
                <TableCell key={m.key} className="text-right font-mono text-sm">
                  {formatCurrency(moneyOut[m.key] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono font-medium bg-muted/30">
                {formatCurrency(calculateTotal(moneyOut, months))}
              </TableCell>
            </TableRow>

            <TableRow className="bg-gray-500/10">
              <TableCell className="font-semibold">{interestName.toUpperCase()}</TableCell>
              {months.map((m) => (
                <TableCell key={m.key} className="text-right font-mono text-sm">
                  {formatCurrency(interest[m.key] || 0)}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono font-medium bg-muted/30">
                {formatCurrency(calculateTotal(interest, months))}
              </TableCell>
            </TableRow>

            <TableRow className="bg-purple-500/20 font-bold text-lg">
              <TableCell>Profit After Money Retained</TableCell>
              {months.map((m) => {
                const profit = calculateLineItemsTotal(revenue, m.key) - 
                  calculateLineItemsTotal(cogs, m.key) - 
                  calculateLineItemsTotal(operatingExpenses, m.key) -
                  calculateLineItemsTotal(governmentTaxes, m.key) -
                  calculateLineItemsTotal(dutiesAndCharges, m.key);
                const retained = profit - (moneyOut[m.key] || 0) - (interest[m.key] || 0);
                return (
                  <TableCell key={m.key} className={`text-right font-mono ${retained < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(retained)}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-mono bg-purple-500/30">
                {formatCurrency(
                  calculateLineItemsGrandTotal(revenue, months) -
                  calculateLineItemsGrandTotal(cogs, months) -
                  calculateLineItemsGrandTotal(operatingExpenses, months) -
                  calculateLineItemsGrandTotal(governmentTaxes, months) -
                  calculateLineItemsGrandTotal(dutiesAndCharges, months) -
                  calculateTotal(moneyOut, months) -
                  calculateTotal(interest, months)
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CustomerAccountsTab() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers/stats"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CustomerTransaction[]>({
    queryKey: [`/api/customers/${selectedCustomerId}/statement`, selectedCustomerId],
    enabled: !!selectedCustomerId,
  });

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  const parseAmount = (val: string | number | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  };

  const totalCredit = transactions.reduce((sum, t) => sum + parseAmount(t.creditAmount), 0);
  const totalDebit = transactions.reduce((sum, t) => sum + parseAmount(t.debitAmount), 0);
  const finalBalance = transactions.length > 0
    ? parseAmount(transactions[transactions.length - 1].balance)
    : (selectedCustomer ? (selectedCustomer.balanceSide === "Cr" ? -selectedCustomer.balance : selectedCustomer.balance) : 0);

  if (customersLoading) return <Skeleton className="h-[600px] w-full" />;

  // — DETAIL VIEW: show transactions for selected customer —
  if (selectedCustomerId && selectedCustomer) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCustomerId("")}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
              >
                ← Back to list
              </button>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedCustomer.legalName}
                <span className="text-sm text-muted-foreground font-normal">({selectedCustomer.code})</span>
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-3 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Total Credit:</span>
              <span className="font-mono font-medium text-green-600">{formatCurrency(totalCredit)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Total Debit:</span>
              <span className="font-mono font-medium text-red-600">{formatCurrency(totalDebit)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Balance:</span>
              <span className={`font-mono font-bold ${finalBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {formatCurrency(Math.abs(finalBalance))} {finalBalance >= 0 ? "Dr" : "Cr"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {transactionsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transactions found for this customer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10">
                  <TableHead className="font-bold w-12">#</TableHead>
                  <TableHead className="font-bold min-w-[100px]">Date</TableHead>
                  <TableHead className="font-bold min-w-[200px]">Description</TableHead>
                  <TableHead className="text-right font-bold min-w-[120px]">Credit</TableHead>
                  <TableHead className="text-right font-bold min-w-[120px]">Debit</TableHead>
                  <TableHead className="text-right font-bold min-w-[120px]">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, idx) => {
                  const credit = parseAmount(t.creditAmount);
                  const debit = parseAmount(t.debitAmount);
                  const balance = parseAmount(t.balance);
                  return (
                    <TableRow key={t.id} className={idx % 2 === 0 ? "" : "bg-muted/30"}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>{format(new Date(t.transactionDate), "MM/dd/yy")}</TableCell>
                      <TableCell>{t.description || t.transactionType}</TableCell>
                      <TableCell className="text-right font-mono">{credit > 0 ? formatCurrency(credit) : "-"}</TableCell>
                      <TableCell className="text-right font-mono">{debit > 0 ? formatCurrency(debit) : "-"}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${balance >= 0 ? "" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(balance))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  // — LIST VIEW: show all customers —
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Accounts
        </CardTitle>
        <p className="text-sm text-muted-foreground">Click a customer to view their full transaction ledger</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No customers found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="font-bold">#</TableHead>
                <TableHead className="font-bold">Customer Name</TableHead>
                <TableHead className="font-bold">Code</TableHead>
                <TableHead className="text-right font-bold">Balance</TableHead>
                <TableHead className="font-bold">Side</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, idx) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => setSelectedCustomerId(customer.id.toString())}
                >
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-blue-600 hover:underline">{customer.legalName}</TableCell>
                  <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {customer.balance ? formatCurrency(customer.balance) : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${customer.balanceSide === "Dr" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                      {customer.balanceSide || "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function LiquidationHistoryTab({ 
  selectedYear, 
  selectedLocation 
}: { 
  selectedYear: string; 
  selectedLocation: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append("year", selectedYear);
  if (selectedLocation !== "all") {
    queryParams.append("locationId", selectedLocation);
  }

  const { data, isLoading } = useQuery<LiquidationHistoryData>({
    queryKey: [`/api/stats/liquidation-history?${queryParams.toString()}`],
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  const entries = data?.entries || [];
  const supplierNames = data?.columns?.supplierNames || [];
  const stockGroupNames = data?.columns?.stockGroupNames || [];
  const cashAccountNames = data?.columns?.cashAccountNames || [];

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No liquidation data available for {selectedYear}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
          <History className="h-5 w-5" />
          Liquidation Value History
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Daily business value tracking for {selectedYear}
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="font-bold min-w-[100px] sticky left-0 bg-background z-10">Date</TableHead>
              {supplierNames.map((name) => (
                <TableHead key={name} className="text-right font-bold min-w-[120px]">
                  {name}
                </TableHead>
              ))}
              {stockGroupNames.map((name) => (
                <TableHead key={name} className="text-right font-bold min-w-[120px]">
                  Stock {name}
                </TableHead>
              ))}
              {cashAccountNames.map((name) => (
                <TableHead key={name} className="text-right font-bold min-w-[120px]">
                  {name}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold min-w-[100px]">MONEY OUT</TableHead>
              <TableHead className="text-right font-bold min-w-[100px]">IN POCKET</TableHead>
              <TableHead className="text-right font-bold min-w-[130px] bg-green-500/20">Liquidation Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, idx) => (
              <TableRow key={idx} className={idx % 2 === 0 ? "" : "bg-muted/30"}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                </TableCell>
                {supplierNames.map((name) => {
                  const supplier = entry.supplierBalances.find(s => s.name === name);
                  return (
                    <TableCell key={name} className="text-right font-mono text-sm">
                      {formatCurrency(supplier?.balance || 0)}
                    </TableCell>
                  );
                })}
                {stockGroupNames.map((name) => {
                  const stock = entry.stockValues.find(s => s.name === name);
                  return (
                    <TableCell key={name} className="text-right font-mono text-sm">
                      {formatCurrency(stock?.value || 0)}
                    </TableCell>
                  );
                })}
                {cashAccountNames.map((name) => {
                  const cash = entry.cashPositions.find(c => c.name === name);
                  return (
                    <TableCell key={name} className="text-right font-mono text-sm">
                      {formatCurrency(cash?.amount || 0)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(entry.moneyOut)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatCurrency(entry.inPocket)}
                </TableCell>
                <TableCell className={`text-right font-mono font-bold bg-green-500/10 ${entry.liquidationValue < 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(entry.liquidationValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LiquidationValueTab() {
  const { data, isLoading } = useQuery<LiquidationValueData>({
    queryKey: ["/api/stats/liquidation-value"],
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground p-8">No data available</div>;
  }

  const formatValue = (value: number) => {
    if (value === 0) return "-";
    const formatted = Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Stock Motos on Ground</span>
              <span className="font-mono font-bold text-green-600">{formatValue(data.stockMotos.value)}</span>
            </div>
            <div className="text-sm text-muted-foreground pl-4">
              {data.stockMotos.quantity} units in inventory
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Stock Parts</span>
              <span className="font-mono font-bold text-green-600">{formatValue(data.stockParts.value)}</span>
            </div>
            <div className="text-sm text-muted-foreground pl-4">
              {data.stockParts.quantity} units in inventory
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium flex items-center gap-1">
                <Ship className="h-4 w-4" />
                Containers On The Way
              </span>
              <span className="font-mono font-bold text-blue-600">{formatValue(data.containersOtw.value)}</span>
            </div>
            {data.containersOtw.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Fixed Assets
              </span>
              <span className="font-mono font-bold text-green-600">{formatValue(data.fixedAssets.total)}</span>
            </div>
            {data.fixedAssets.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                Bank + Cash
              </span>
              <span className="font-mono font-bold text-green-600">{formatValue(data.cashBank.total)}</span>
            </div>
            {data.cashBank.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Assets</span>
              <span className="font-mono text-green-600">{formatValue(data.summary.totalAssets)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Liabilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Suppliers</span>
              <span className="font-mono font-bold text-red-600">{formatValue(data.suppliers.total)}</span>
            </div>
            {data.suppliers.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Duty Agents</span>
              <span className="font-mono font-bold text-red-600">{formatValue(data.dutyAgents.total)}</span>
            </div>
            {data.dutyAgents.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Transporters</span>
              <span className="font-mono font-bold text-red-600">{formatValue(data.transporters.total)}</span>
            </div>
            {data.transporters.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Loans</span>
              <span className="font-mono font-bold text-red-600">{formatValue(data.loans.total)}</span>
            </div>
            {data.loans.items.map((item, idx) => (
              <div key={idx} className="text-sm text-muted-foreground pl-4 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{formatValue(item.balance)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Liabilities</span>
              <span className="font-mono text-red-600">{formatValue(data.summary.totalLiabilities)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Liquidation Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
              <div className="text-2xl font-bold font-mono text-green-600">
                {formatValue(data.summary.totalAssets)}
              </div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Liabilities</div>
              <div className="text-2xl font-bold font-mono text-red-600">
                {formatValue(data.summary.totalLiabilities)}
              </div>
            </div>
            <div className="text-center p-4 bg-primary/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Net Liquidation Value</div>
              <div className={`text-2xl font-bold font-mono ${data.summary.liquidationValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatValue(data.summary.liquidationValue)}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            = Stock (Motos + Parts) + Containers OTW + Fixed Assets + Cash/Bank - Suppliers - Duty Agents - Transporters - Loans
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IncomeStatement() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("income");

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { data: locations = [], isLoading: locationsLoading } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  if (locationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Financial Reports</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]" data-testid="select-location">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc: any) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]" data-testid="select-year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="income" data-testid="tab-income-statement">
            <DollarSign className="h-4 w-4 mr-2" />
            Income Statement
          </TabsTrigger>
          <TabsTrigger value="liquidationValue" data-testid="tab-liquidation-value">
            <Calculator className="h-4 w-4 mr-2" />
            Liquidation Value
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customer-accounts">
            <Users className="h-4 w-4 mr-2" />
            Customer Accounts
          </TabsTrigger>
          <TabsTrigger value="liquidation" data-testid="tab-liquidation-history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="mt-4">
          <IncomeStatementTab 
            selectedYear={selectedYear} 
            selectedLocation={selectedLocation}
            locations={locations}
          />
        </TabsContent>
        <TabsContent value="liquidationValue" className="mt-4">
          <LiquidationValueTab />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomerAccountsTab />
        </TabsContent>
        <TabsContent value="liquidation" className="mt-4">
          <LiquidationHistoryTab 
            selectedYear={selectedYear}
            selectedLocation={selectedLocation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
