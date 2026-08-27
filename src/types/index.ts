export type UserRole = 'ADMIN' | 'MANAGER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: string;
  name: string;
  phone?: string | null;
  status: EmployeeStatus;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM';
export type ShiftStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface Shift {
  id: string;
  employee_id: string;
  employee_name?: string;
  shift_date: string;
  shift_type: ShiftType;
  custom_shift_name?: string | null;
  status: ShiftStatus;
  notes?: string | null;
  entered_by: string;
  entered_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';

export interface ShiftPayment {
  id: string;
  shift_id: string;
  payment_method: PaymentMethod;
  amount: number;
  customer_id?: string | null;
  customer_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OtherSale {
  id: string;
  shift_id?: string | null;
  description: string;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type FuelType = 'PETROL' | 'DIESEL';

export interface FuelPrice {
  id: string;
  fuel_type: FuelType;
  price_per_litre: number;
  effective_from: string;
  effective_to?: string | null;
  updated_by: string;
  created_at: string;
}

export type StockTransactionType =
  | 'OPENING'
  | 'DELIVERY'
  | 'SALE'
  | 'TEST_USAGE'
  | 'GENERATOR_USAGE'
  | 'ADJUSTMENT';

export interface FuelStockTransaction {
  id: string;
  fuel_type: FuelType;
  transaction_type: StockTransactionType;
  quantity_litres: number;
  unit_cost?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  reason?: string | null;
  created_by: string;
  created_at: string;
}

export interface FuelDelivery {
  id: string;
  fuel_type: FuelType;
  quantity_litres: number;
  cost_per_litre: number;
  total_cost: number;
  supplier?: string | null;
  reference_number?: string | null;
  delivered_at: string;
  notes?: string | null;
  created_by: string;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type FuelUsageType = 'TEST' | 'GENERATOR';

export interface FuelUsage {
  id: string;
  fuel_type: FuelType;
  usage_type: FuelUsageType;
  quantity_litres: number;
  selling_price_snapshot?: number | null;
  calculated_value?: number | null;
  notes?: string | null;
  created_by: string;
  used_at: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreditCustomer {
  id: string;
  name: string;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string | null;
  outstanding_balance?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CreditTransactionType = 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED' | 'ADJUSTMENT';
export type CreditPaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export interface CreditTransaction {
  id: string;
  customer_id: string;
  transaction_type: CreditTransactionType;
  amount: number;
  payment_method?: CreditPaymentMethod | null;
  description?: string | null;
  transaction_at: string;
  created_by: string;
  created_at: string;
}

export type CashLedgerEntryType =
  | 'SHIFT_CASH'
  | 'CREDIT_CASH_PAYMENT'
  | 'OWNER_COLLECTION'
  | 'ADJUSTMENT';

export interface CashLedgerEntry {
  id: string;
  entry_type: CashLedgerEntryType;
  amount: number;
  reference_type?: string | null;
  reference_id?: string | null;
  occurred_at: string;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface OwnerCashCollection {
  id: string;
  amount: number;
  collected_at: string;
  notes?: string | null;
  recorded_by: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_role: UserRole;
  action: string;
  module: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  reason?: string | null;
  created_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
