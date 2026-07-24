import { useRef, useEffect } from "react";
import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, FileDown, ChevronDown, ArrowUpRight, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AccountAutocomplete } from "@/components/AccountAutocomplete";
import type { CombinedAccount } from "@/components/AccountAutocomplete";
import AccountSidebar, { Account } from "@/components/AccountSidebar";
import { VoucherEntriesTable } from "@/components/vouchers/VoucherEntriesTable";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { ExchangeRateInput } from "@/components/ExchangeRateInput";

interface PaymentVoucherTabProps {
  form: UseFormReturn<any>;
  fieldArray: UseFieldArrayReturn<any, "entries", "id">;
  entries: any[];
  total: number;
  paymentAccountId: number;
  paymentAccountType: string;
  paymentAccountName: string;
  accountBalance: number;
  allAccounts: CombinedAccount[];
  sidebarAccounts: Account[];
  filteredSidebarAccounts: Account[];
  sidebarSearchValue: string;
  setSidebarSearchValue: (value: string) => void;
  sidebarHighlightedIndex: number;
  setSidebarHighlightedIndex: (index: number) => void;
  selectedAccountId: number | null;
  selectedAccountType: string | null;
  handleSidebarAccountSelect: (account: Account) => void;
  handleAmountCommit: (rowIndex: number) => void;
  handlePrint: () => void;
  handleExportVoucher?: (detailed: boolean) => void;
  onSubmit: (values: any) => void;
  activeTab: "payment" | "receipt";
  activeRowIndex: number | null;
  setActiveRowIndex: (index: number | null) => void;
  onCreateAccount?: () => void;
  isFactoryCompany?: boolean;
  onAutoCreateAccount?: (name: string) => Promise<Account | null>;
  isAutoCreating?: boolean;
  isEditMode?: boolean;
  originalTotal?: number;
  sidebarIsLoading?: boolean;
  sidebarIsError?: boolean;
  sidebarErrorMessage?: string;
  sidebarOnRetry?: () => void;
  sidebarUsingFallback?: boolean;
  // Phase 8
  accountBrowserOpen: boolean;
  setAccountBrowserOpen: (open: boolean) => void;
  isMutationPending?: boolean;
  selectedCurrency?: string;
  transactionRate?: number | null;
  setTransactionRate?: (rate: number | null) => void;
  hideVoucherAmounts?: boolean;
}

export function PaymentVoucherTab({
  form,
  fieldArray,
  entries,
  total,
  paymentAccountId,
  paymentAccountType,
  paymentAccountName,
  accountBalance,
  allAccounts,
  sidebarAccounts,
  filteredSidebarAccounts,
  sidebarSearchValue,
  setSidebarSearchValue,
  sidebarHighlightedIndex,
  setSidebarHighlightedIndex,
  selectedAccountId,
  selectedAccountType,
  handleSidebarAccountSelect,
  handleAmountCommit,
  handlePrint,
  handleExportVoucher,
  onSubmit,
  activeRowIndex,
  setActiveRowIndex,
  onCreateAccount,
  isFactoryCompany = false,
  onAutoCreateAccount,
  isAutoCreating = false,
  isEditMode = false,
  originalTotal = 0,
  sidebarIsLoading = false,
  sidebarIsError = false,
  sidebarErrorMessage,
  sidebarOnRetry,
  sidebarUsingFallback = false,
  accountBrowserOpen,
  setAccountBrowserOpen,
  isMutationPending = false,
  selectedCurrency,
  transactionRate,
  setTransactionRate,
  hideVoucherAmounts = false,
}: PaymentVoucherTabProps) {
  const { formatAmount } = useCurrencyContext();

  const hasExport = Boolean(handleExportVoucher);
  const hasAnyEntry = entries.some((e) => (e?.accountId ?? 0) > 0);
  const canRunActions = paymentAccountId !== 0;
  const canPrint = canRunActions && hasAnyEntry;
  const canExport = canRunActions && hasAnyEntry && hasExport;

  const projectedBalance = isEditMode
    ? accountBalance + originalTotal - total
    : accountBalance - total;

  const balColor = (v: number) =>
    v < 0
      ? "text-red-600 dark:text-red-400"
      : v > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  // Focus sidebar search when dialog opens
  const dialogSearchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (accountBrowserOpen) {
      const t = setTimeout(() => {
        const input = document.querySelector(
          '[data-testid="input-search-account"]',
        ) as HTMLInputElement | null;
        input?.focus();
      }, 80);
      return () => clearTimeout(t);
    }
  }, [accountBrowserOpen]);

  // Select account from dialog: fill row then close
  const handleSelectAndClose = (account: Account) => {
    setAccountBrowserOpen(false);
    handleSidebarAccountSelect(account);
  };

  // Browse Accounts: activate first incomplete row, open dialog
  const handleBrowseAccounts = () => {
    const currentEntries = form.getValues("entries");
    const firstIncomplete = currentEntries.findIndex(
      (e: any) => (e.accountId ?? 0) === 0 || !e.accountName,
    );
    const targetIndex = firstIncomplete >= 0 ? firstIncomplete : currentEntries.length - 1;
    setActiveRowIndex(targetIndex);
    setSidebarSearchValue(currentEntries[targetIndex]?.accountName || "");
    setAccountBrowserOpen(true);
  };

  return (
    <>
      {/* Section heading */}
      <div className="flex items-start gap-3 mb-5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ArrowUpRight className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-tight">Pay Money</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record money paid to a supplier, expense, employee or other account.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            {/* ── Left column ── */}
            <div className="space-y-4">
              {/* Payment Details Card */}
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_12rem] gap-4 items-start">
                    {/* Pay From */}
                    <FormField
                      control={form.control}
                      name="paymentAccountId"
                      render={() => (
                        <FormItem className="min-w-0">
                          <FormLabel>Pay From</FormLabel>
                          <FormControl>
                            <div className="w-full min-w-0">
                              <AccountAutocomplete
                                value={
                                  paymentAccountId > 0
                                    ? {
                                        type: paymentAccountType,
                                        id: paymentAccountId,
                                        name: paymentAccountName,
                                      }
                                    : null
                                }
                                onChange={(type, id, name) => {
                                  form.setValue("paymentAccountType", type);
                                  form.setValue("paymentAccountId", id);
                                  form.setValue("paymentAccountName", name);
                                }}
                                allAccounts={allAccounts}
                                rowIndex={-1}
                                placeholder="Select cash, bank or account..."
                                testId="input-pay-from"
                              />
                            </div>
                          </FormControl>
                          {!hideVoucherAmounts && paymentAccountId > 0 && (
                            <p className="text-xs font-mono mt-1">
                              <span className="text-muted-foreground">Balance: </span>
                              <span className={cn(balColor(accountBalance))}>
                                {formatAmount(accountBalance)}
                              </span>
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date */}
                    <FormField
                      control={form.control}
                      name="voucherDate"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={
                                field.value instanceof Date
                                  ? format(field.value, "yyyy-MM-dd")
                                  : typeof field.value === "string"
                                    ? field.value
                                    : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value + "T00:00:00")
                                    : new Date(),
                                )
                              }
                              data-testid="input-date-picker"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Paid To section */}
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold">Paid To</h3>
                    <p className="text-xs text-muted-foreground">
                      Add the suppliers, expenses, employees or accounts being paid.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBrowseAccounts}
                    data-testid="button-browse-payment-accounts"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Browse Accounts
                  </Button>
                </div>
                <VoucherEntriesTable
                  form={form}
                  fieldArray={fieldArray}
                  entries={entries}
                  total={total}
                  mode="payment"
                  onAmountCommit={handleAmountCommit}
                  activeRow={activeRowIndex}
                  filteredSidebarAccounts={filteredSidebarAccounts}
                  sidebarHighlightedIndex={sidebarHighlightedIndex}
                  setSidebarHighlightedIndex={setSidebarHighlightedIndex}
                  setSidebarSearchValue={setSidebarSearchValue}
                  handleSidebarAccountSelect={handleSelectAndClose}
                  sidebarAccounts={sidebarAccounts}
                  onRowFocus={(rowIndex, fieldName) => {
                    if (fieldName === "account") {
                      setActiveRowIndex(rowIndex);
                      const currentAccountName = entries[rowIndex]?.accountName || "";
                      setSidebarSearchValue(currentAccountName);
                      setAccountBrowserOpen(true);
                    }
                  }}
                  onRowBlur={() => {}}
                  isFactoryCompany={isFactoryCompany}
                  onAutoCreateAccount={onAutoCreateAccount}
                  isAutoCreating={isAutoCreating}
                />
              </div>

              {/* More Details (collapsible) */}
              <details className="group rounded-md border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium hover:bg-muted/40 rounded-md">
                  <span>More Details</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="space-y-4 border-t p-4">
                  {/* CFA Transaction Rate */}
                  {selectedCurrency === "CFA" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Transaction Rate:</span>
                      <ExchangeRateInput
                        value={transactionRate ?? null}
                        onChange={setTransactionRate ?? (() => {})}
                        selectedCurrency={selectedCurrency}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Additional notes..."
                            rows={3}
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional */}
                  <FormField
                    control={form.control}
                    name="optional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-optional"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark as Optional</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Actions dropdown */}
                  <div className="flex items-center gap-2 pt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canRunActions}
                          data-testid="button-actions"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Actions
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={handlePrint}
                          disabled={!canPrint}
                          data-testid="action-print"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        {hasExport && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleExportVoucher?.(false)}
                              disabled={!canExport}
                              data-testid="export-summary"
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Export (Summary)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportVoucher?.(true)}
                              disabled={!canExport}
                              data-testid="export-detailed"
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Export (Detailed)
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </details>
            </div>

            {/* ── Right column: Payment Summary ── */}
            <div className="xl:sticky xl:top-4 h-fit">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  {/* Pay From */}
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Pay From</p>
                    {paymentAccountName ? (
                      <p className="text-sm font-medium">{paymentAccountName}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Select an account</p>
                    )}
                  </div>

                  {/* Current Balance */}
                  {!hideVoucherAmounts && paymentAccountId > 0 && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p
                        className={cn("text-sm font-mono font-semibold", balColor(accountBalance))}
                      >
                        {formatAmount(accountBalance)}
                      </p>
                    </div>
                  )}

                  {/* Payment Total */}
                  <div className="space-y-0.5 border-t pt-3">
                    <p className="text-xs text-muted-foreground">Payment Total</p>
                    <p className="text-sm font-mono font-semibold">{formatAmount(total)}</p>
                  </div>

                  {/* Balance After */}
                  {!hideVoucherAmounts && paymentAccountId > 0 && total > 0 && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Balance After</p>
                      <p
                        className={cn(
                          "text-sm font-mono font-semibold",
                          balColor(projectedBalance),
                        )}
                      >
                        {formatAmount(projectedBalance)}
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={paymentAccountId === 0 || total === 0 || isMutationPending}
                      data-testid="button-save-voucher"
                    >
                      {isMutationPending
                        ? isEditMode
                          ? "Updating..."
                          : "Recording..."
                        : isEditMode
                          ? "Update Payment"
                          : "Record Payment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Account Browser Dialog */}
      <Dialog open={accountBrowserOpen} onOpenChange={setAccountBrowserOpen}>
        <DialogContent
          className="w-[95vw] max-w-3xl max-h-[85vh] overflow-hidden p-0"
          ref={dialogSearchRef}
        >
          <DialogHeader className="p-5 pb-3 border-b">
            <DialogTitle>Choose Account</DialogTitle>
            <DialogDescription>Select who or what this payment is for.</DialogDescription>
          </DialogHeader>
          <AccountSidebar
            accounts={sidebarAccounts}
            filteredAccounts={filteredSidebarAccounts}
            onSelectAccount={handleSelectAndClose}
            searchValue={sidebarSearchValue}
            onSearchChange={setSidebarSearchValue}
            selectedAccountId={selectedAccountId}
            selectedAccountType={selectedAccountType}
            highlightedIndex={sidebarHighlightedIndex}
            onHighlightedIndexChange={setSidebarHighlightedIndex}
            entries={entries}
            mode="payment"
            paymentAccountId={paymentAccountId}
            paymentAccountType={paymentAccountType}
            voucherTotal={total}
            onCreateAccount={isFactoryCompany ? undefined : onCreateAccount}
            isFactoryCompany={isFactoryCompany}
            onAutoCreateAccount={onAutoCreateAccount}
            isAutoCreating={isAutoCreating}
            isLoading={sidebarIsLoading}
            isError={sidebarIsError}
            errorMessage={sidebarErrorMessage}
            onRetry={sidebarOnRetry}
            usingFallback={sidebarUsingFallback}
            dialogMode
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
