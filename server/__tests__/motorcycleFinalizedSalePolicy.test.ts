import { describe, expect, it } from "vitest";
import {
  combinedMotorcyclePricesFitVoucher,
  isActiveFinalizedSalesVoucher,
  isMotorcycleSaleEligible,
  linkedSaleCanBeReleased,
  motorcycleAndVoucherLocationsMatch,
  motorcyclePriceFitsVoucher,
  resolveFinalizedInvoiceCustomer,
  voucherCustomerMatchesSelection,
  warrantyDatesAreValid,
} from "../services/motorcycles/finalizedSalePolicy";

describe("motorcycle finalized sale policy", () => {
  it("only allows in-stock or reserved motorcycles to be sold", () => {
    expect(isMotorcycleSaleEligible("IN_STOCK")).toBe(true);
    expect(isMotorcycleSaleEligible("RESERVED")).toBe(true);
    expect(isMotorcycleSaleEligible("SOLD")).toBe(false);
    expect(isMotorcycleSaleEligible("IN_SERVICE")).toBe(false);
    expect(isMotorcycleSaleEligible("DAMAGED")).toBe(false);
  });

  it("accepts only active finalized Sales vouchers", () => {
    const activeSale = {
      voucherType: "Sales",
      optional: false,
      deletedAt: null,
      reversedAt: null,
      reversalOfVoucherId: null,
    };

    expect(isActiveFinalizedSalesVoucher(activeSale)).toBe(true);
    expect(isActiveFinalizedSalesVoucher({ ...activeSale, voucherType: "Receipt" })).toBe(false);
    expect(isActiveFinalizedSalesVoucher({ ...activeSale, optional: true })).toBe(false);
    expect(isActiveFinalizedSalesVoucher({ ...activeSale, deletedAt: new Date() })).toBe(false);
    expect(isActiveFinalizedSalesVoucher({ ...activeSale, reversedAt: new Date() })).toBe(false);
    expect(isActiveFinalizedSalesVoucher({ ...activeSale, reversalOfVoucherId: 41 })).toBe(false);
  });

  it("requires compatible locations when both records have a location", () => {
    expect(motorcycleAndVoucherLocationsMatch(7, 7)).toBe(true);
    expect(motorcycleAndVoucherLocationsMatch(7, 8)).toBe(false);
    expect(motorcycleAndVoucherLocationsMatch(null, 8)).toBe(true);
    expect(motorcycleAndVoucherLocationsMatch(7, null)).toBe(true);
  });

  it("prevents a motorcycle price from exceeding the finalized voucher total", () => {
    expect(motorcyclePriceFitsVoucher("4500.00", "5000.00")).toBe(true);
    expect(motorcyclePriceFitsVoucher("5000.00", "5000.00")).toBe(true);
    expect(motorcyclePriceFitsVoucher("5000.01", "5000.00")).toBe(false);
    expect(motorcyclePriceFitsVoucher("0", "5000.00")).toBe(false);
    expect(motorcyclePriceFitsVoucher("not-a-number", "5000.00")).toBe(false);
  });

  it("allows several motorcycles on one voucher without exceeding its total", () => {
    expect(combinedMotorcyclePricesFitVoucher("3000.00", "2000.00", "5000.00")).toBe(true);
    expect(combinedMotorcyclePricesFitVoucher("3000.00", "2000.01", "5000.00")).toBe(false);
    expect(combinedMotorcyclePricesFitVoucher("0", "5000.00", "5000.00")).toBe(true);
  });

  it("resolves and locks the finalized invoice customer", () => {
    expect(resolveFinalizedInvoiceCustomer(21, 22)).toBe(21);
    expect(resolveFinalizedInvoiceCustomer(null, 22)).toBe(22);
    expect(resolveFinalizedInvoiceCustomer(null, null)).toBeNull();

    expect(voucherCustomerMatchesSelection(21, 21)).toBe(true);
    expect(voucherCustomerMatchesSelection(21, 22)).toBe(false);
    expect(voucherCustomerMatchesSelection(21, null)).toBe(true);
    expect(voucherCustomerMatchesSelection(null, 22)).toBe(true);
  });

  it("validates warranty order and requires reversal before release", () => {
    expect(warrantyDatesAreValid("2026-07-26", "2027-07-26")).toBe(true);
    expect(warrantyDatesAreValid("2027-07-26", "2026-07-26")).toBe(false);
    expect(warrantyDatesAreValid("2026-07-26", null)).toBe(true);

    expect(linkedSaleCanBeReleased(new Date())).toBe(true);
    expect(linkedSaleCanBeReleased("2026-07-26T10:00:00Z")).toBe(true);
    expect(linkedSaleCanBeReleased(null)).toBe(false);
  });
});
