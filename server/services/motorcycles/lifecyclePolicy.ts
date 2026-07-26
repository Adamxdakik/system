export interface AssemblyRegistrationState {
  completed: boolean;
  toStage: string | null;
  qtyChanged: number;
  linkedCount: number;
}

export function motorcycleBelongsToCustomer(
  motorcycleCustomerId: number | null,
  requestedCustomerId: number,
): boolean {
  return motorcycleCustomerId != null && motorcycleCustomerId === requestedCustomerId;
}

export function remainingAssemblyUnits(qtyChanged: number, linkedCount: number): number {
  if (!Number.isFinite(qtyChanged) || !Number.isFinite(linkedCount)) return 0;
  return Math.max(0, Math.trunc(Math.abs(qtyChanged)) - Math.max(0, Math.trunc(linkedCount)));
}

export function canRegisterAssemblyUnit(state: AssemblyRegistrationState): boolean {
  return (
    state.completed === true &&
    state.toStage === "Final Product" &&
    remainingAssemblyUnits(state.qtyChanged, state.linkedCount) > 0
  );
}

export function lifecycleNeedsAttention(input: {
  status: string;
  serviceCount: number;
  activeWarrantyCount: number;
  warrantyEndDate: string | null;
  today: string;
}): boolean {
  const inServiceWithoutRecord = input.status === "IN_SERVICE" && input.serviceCount === 0;
  const activeWarrantyPastRegistryEnd =
    input.activeWarrantyCount > 0 &&
    input.warrantyEndDate != null &&
    input.warrantyEndDate < input.today;
  return inServiceWithoutRecord || activeWarrantyPastRegistryEnd;
}
