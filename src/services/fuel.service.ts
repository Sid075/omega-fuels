import { createClient } from '@/lib/supabase/server';
import { FuelPrice, FuelStockTransaction, FuelType, FuelTransactionType, FuelTank } from '@/types';
import { calculateFuelStock } from '@/lib/calculations/stock';
import { logAuditAction } from './audit.service';
import { getCurrentUser } from './auth.service';

export interface FuelStockItemWithMeta extends FuelStockTransaction {
  creator_name?: string;
}

// In-memory fallback stores for demo & offline persistence
let localTanks: FuelTank[] = [
  {
    id: 'tank_petrol_01',
    name: 'MS Main Underground Tank 1',
    fuel_type: 'PETROL',
    capacity_litres: 15000,
    current_stock_litres: 9450.5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tank_diesel_01',
    name: 'HSD Main Underground Tank 2',
    fuel_type: 'DIESEL',
    capacity_litres: 20000,
    current_stock_litres: 14200.0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let localPrices: FuelPrice[] = [
  {
    id: 'fp_ms_latest',
    fuel_type: 'PETROL',
    price_per_litre: 102.5,
    effective_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    recorded_by: 'usr_admin_001',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: 'fp_hsd_latest',
    fuel_type: 'DIESEL',
    price_per_litre: 89.8,
    effective_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    recorded_by: 'usr_admin_001',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

let localTransactions: FuelStockItemWithMeta[] = [
  {
    id: 'ftx_01',
    fuel_type: 'PETROL',
    tank_id: 'tank_petrol_01',
    transaction_type: 'OPENING',
    quantity_litres: 10000,
    reference_id: null,
    notes: 'Initial tank opening calibration stock',
    created_by: 'usr_admin_001',
    creator_name: 'Station Admin',
    created_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'ftx_02',
    fuel_type: 'DIESEL',
    tank_id: 'tank_diesel_01',
    transaction_type: 'OPENING',
    quantity_litres: 15000,
    reference_id: null,
    notes: 'Initial tank opening calibration stock',
    created_by: 'usr_admin_001',
    creator_name: 'Station Admin',
    created_at: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
  },
  {
    id: 'ftx_03',
    fuel_type: 'PETROL',
    tank_id: 'tank_petrol_01',
    transaction_type: 'DELIVERY',
    quantity_litres: 4000,
    reference_id: 'del_001',
    notes: 'Tanker Delivery IOCL #TK-9884 (Challan #CH-8841)',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
  {
    id: 'ftx_04',
    fuel_type: 'PETROL',
    tank_id: 'tank_petrol_01',
    transaction_type: 'SALE',
    quantity_litres: -4549.5,
    reference_id: 'shift_01',
    notes: 'Morning Shift Dispenser Pump Sales',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ftx_05',
    fuel_type: 'DIESEL',
    tank_id: 'tank_diesel_01',
    transaction_type: 'GENERATOR_USAGE',
    quantity_litres: -30,
    reference_id: null,
    notes: 'Emergency Backup Generator fuel usage (2.5 hrs outage)',
    created_by: 'usr_manager_001',
    creator_name: 'Station Manager',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

/**
 * Get active fuel prices for Petrol and Diesel
 */
export async function getLatestFuelPrices(): Promise<{ PETROL: number; DIESEL: number }> {
  let petrolPrice = 102.5;
  let dieselPrice = 89.8;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();

      const { data: petrolData } = await supabase
        .from('fuel_prices')
        .select('price_per_litre')
        .eq('fuel_type', 'PETROL')
        .order('effective_at', { ascending: false })
        .limit(1);

      if (petrolData && petrolData[0]) petrolPrice = Number(petrolData[0].price_per_litre);

      const { data: dieselData } = await supabase
        .from('fuel_prices')
        .select('price_per_litre')
        .eq('fuel_type', 'DIESEL')
        .order('effective_at', { ascending: false })
        .limit(1);

      if (dieselData && dieselData[0]) dieselPrice = Number(dieselData[0].price_per_litre);
    } catch {
      // Fallback to local
    }
  } else {
    const latestP = localPrices.filter((p) => p.fuel_type === 'PETROL').sort((a, b) => new Date(b.effective_at).getTime() - new Date(a.effective_at).getTime())[0];
    const latestD = localPrices.filter((p) => p.fuel_type === 'DIESEL').sort((a, b) => new Date(b.effective_at).getTime() - new Date(a.effective_at).getTime())[0];
    if (latestP) petrolPrice = latestP.price_per_litre;
    if (latestD) dieselPrice = latestD.price_per_litre;
  }

  return { PETROL: petrolPrice, DIESEL: dieselPrice };
}

/**
 * Get complete fuel price history timeline
 */
export async function getFuelPriceHistory(): Promise<FuelPrice[]> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('fuel_prices')
        .select('*')
        .order('effective_at', { ascending: false });
      if (!error && data) return data.map((d: any) => ({ ...d, price_per_litre: Number(d.price_per_litre) }));
    } catch {
      // Fallback
    }
  }
  return [...localPrices].sort((a, b) => new Date(b.effective_at).getTime() - new Date(a.effective_at).getTime());
}

/**
 * Update rate per litre for a fuel type
 */
export async function updateFuelPrice(fuelType: FuelType, newPrice: number, effectiveAt?: string): Promise<FuelPrice> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_admin_001';
  const userRole = currentUser?.role || 'ADMIN';
  const timestamp = effectiveAt || new Date().toISOString();
  const priceId = `fp_${fuelType.toLowerCase()}_${Date.now()}`;

  const priceRecord: FuelPrice = {
    id: priceId,
    fuel_type: fuelType,
    price_per_litre: Number(newPrice),
    effective_at: timestamp,
    recorded_by: userId,
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('fuel_prices').insert({
        id: priceId,
        fuel_type: fuelType,
        price_per_litre: Number(newPrice),
        effective_at: timestamp,
        recorded_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'FUEL_PRICE_UPDATED',
        module: 'FUEL_INVENTORY',
        entityType: 'FUEL_PRICE',
        entityId: priceId,
        newValues: { fuel_type: fuelType, price_per_litre: newPrice, effective_at: timestamp },
        reason: `${fuelType} rate updated to ₹${newPrice}/L`,
      });

      return priceRecord;
    } catch {
      // Fallback
    }
  }

  localPrices.unshift(priceRecord);

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'FUEL_PRICE_UPDATED',
    module: 'FUEL_INVENTORY',
    entityType: 'FUEL_PRICE',
    entityId: priceId,
    newValues: { fuel_type: fuelType, price_per_litre: newPrice, effective_at: timestamp },
    reason: `${fuelType} rate updated to ₹${newPrice}/L`,
  });

  return priceRecord;
}

/**
 * Record Tanker Fuel Delivery
 */
export interface RecordDeliveryInput {
  fuel_type: FuelType;
  tank_id?: string;
  quantity_litres: number;
  buying_price_per_litre?: number;
  supplier_name?: string;
  invoice_number?: string;
  tanker_truck_number?: string;
  density_at_15c?: number;
  delivery_date?: string;
  notes?: string;
}

export async function recordFuelDelivery(input: RecordDeliveryInput): Promise<FuelStockItemWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const litres = Math.abs(Number(input.quantity_litres));
  const timestamp = input.delivery_date || new Date().toISOString();
  const ftxId = `ftx_del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tankId = input.tank_id || (input.fuel_type === 'PETROL' ? 'tank_petrol_01' : 'tank_diesel_01');

  const notesDetails = [
    `Tanker Delivery (${input.supplier_name || 'Oil PSU'})`,
    input.invoice_number ? `Inv #${input.invoice_number}` : '',
    input.tanker_truck_number ? `Truck #${input.tanker_truck_number}` : '',
    input.density_at_15c ? `Density: ${input.density_at_15c} kg/m³` : '',
    input.notes ? input.notes : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const transactionRecord: FuelStockItemWithMeta = {
    id: ftxId,
    fuel_type: input.fuel_type,
    tank_id: tankId,
    transaction_type: 'DELIVERY',
    quantity_litres: litres, // Positive volume addition
    reference_id: input.invoice_number || null,
    notes: notesDetails,
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    created_at: timestamp,
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();

      // Insert delivery record into deliveries table
      const delId = `del_${Date.now()}`;
      await supabase.from('fuel_deliveries').insert({
        id: delId,
        fuel_type: input.fuel_type,
        tank_id: tankId,
        quantity_litres: litres,
        cost_per_litre: input.buying_price_per_litre || null,
        total_cost: input.buying_price_per_litre ? input.buying_price_per_litre * litres : null,
        supplier: input.supplier_name || 'Oil Company',
        invoice_number: input.invoice_number || null,
        tanker_number: input.tanker_truck_number || null,
        density_at_15c: input.density_at_15c || null,
        delivered_at: timestamp,
        created_by: userId,
      });

      // Insert stock ledger transaction
      await supabase.from('fuel_stock_transactions').insert({
        id: ftxId,
        fuel_type: input.fuel_type,
        tank_id: tankId,
        transaction_type: 'DELIVERY',
        quantity_litres: litres,
        reference_id: delId,
        notes: notesDetails,
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'FUEL_DELIVERY_RECORDED',
        module: 'FUEL_INVENTORY',
        entityType: 'FUEL_DELIVERY',
        entityId: delId,
        newValues: { fuel_type: input.fuel_type, quantity_litres: litres, supplier: input.supplier_name, invoice: input.invoice_number },
        reason: `Received ${litres}L of ${input.fuel_type} from ${input.supplier_name || 'Oil PSU'}`,
      });

      return transactionRecord;
    } catch {
      // Fallback
    }
  }

  localTransactions.unshift(transactionRecord);

  // Update local tank stock
  const tank = localTanks.find((t) => t.id === tankId);
  if (tank) tank.current_stock_litres += litres;

  await logAuditAction({
    actorUserId: userId,
    actorRole: userRole,
    action: 'FUEL_DELIVERY_RECORDED',
    module: 'FUEL_INVENTORY',
    entityType: 'FUEL_DELIVERY',
    entityId: ftxId,
    newValues: { fuel_type: input.fuel_type, quantity_litres: litres, supplier: input.supplier_name, invoice: input.invoice_number },
    reason: `Received ${litres}L of ${input.fuel_type} from ${input.supplier_name || 'Oil PSU'}`,
  });

  return transactionRecord;
}

/**
 * Record Test / Nozzle Calibration Fuel Usage
 */
export async function recordTestFuelUsage(fuelType: FuelType, litres: number, notes?: string): Promise<FuelStockItemWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const volume = Math.abs(Number(litres));
  const ftxId = `ftx_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tankId = fuelType === 'PETROL' ? 'tank_petrol_01' : 'tank_diesel_01';

  const transactionRecord: FuelStockItemWithMeta = {
    id: ftxId,
    fuel_type: fuelType,
    tank_id: tankId,
    transaction_type: 'TEST_USAGE',
    quantity_litres: -volume, // Deduction from stock
    reference_id: null,
    notes: notes?.trim() || `Nozzle calibration testing volume (${volume}L)`,
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('fuel_stock_transactions').insert({
        id: ftxId,
        fuel_type: fuelType,
        tank_id: tankId,
        transaction_type: 'TEST_USAGE',
        quantity_litres: -volume,
        notes: notes?.trim() || `Nozzle calibration testing volume (${volume}L)`,
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'TEST_FUEL_LOGGED',
        module: 'FUEL_INVENTORY',
        entityType: 'FUEL_TRANSACTION',
        entityId: ftxId,
        newValues: { fuel_type: fuelType, quantity_litres: volume, notes },
        reason: `Logged ${volume}L test fuel usage for ${fuelType}`,
      });

      return transactionRecord;
    } catch {
      // Fallback
    }
  }

  localTransactions.unshift(transactionRecord);
  const tank = localTanks.find((t) => t.id === tankId);
  if (tank) tank.current_stock_litres -= volume;

  return transactionRecord;
}

/**
 * Record Backup Generator Fuel Consumption
 */
export async function recordGeneratorFuelUsage(litres: number, notes?: string): Promise<FuelStockItemWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const volume = Math.abs(Number(litres));
  const ftxId = `ftx_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tankId = 'tank_diesel_01'; // Generator uses Diesel (HSD)

  const transactionRecord: FuelStockItemWithMeta = {
    id: ftxId,
    fuel_type: 'DIESEL',
    tank_id: tankId,
    transaction_type: 'GENERATOR_USAGE',
    quantity_litres: -volume, // Deduction from stock
    reference_id: null,
    notes: notes?.trim() || `Station backup generator fuel consumption (${volume}L)`,
    created_by: userId,
    creator_name: currentUser?.name || 'Station Manager',
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('fuel_stock_transactions').insert({
        id: ftxId,
        fuel_type: 'DIESEL',
        tank_id: tankId,
        transaction_type: 'GENERATOR_USAGE',
        quantity_litres: -volume,
        notes: notes?.trim() || `Station backup generator fuel consumption (${volume}L)`,
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'GENERATOR_FUEL_LOGGED',
        module: 'FUEL_INVENTORY',
        entityType: 'FUEL_TRANSACTION',
        entityId: ftxId,
        newValues: { fuel_type: 'DIESEL', quantity_litres: volume, notes },
        reason: `Logged ${volume}L generator fuel usage`,
      });

      return transactionRecord;
    } catch {
      // Fallback
    }
  }

  localTransactions.unshift(transactionRecord);
  const tank = localTanks.find((t) => t.id === tankId);
  if (tank) tank.current_stock_litres -= volume;

  return transactionRecord;
}

/**
 * Record Manual Stock Adjustment
 */
export async function recordStockAdjustment(fuelType: FuelType, quantityLitres: number, reason: string): Promise<FuelStockItemWithMeta> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 'usr_manager_001';
  const userRole = currentUser?.role || 'MANAGER';
  const volume = Number(quantityLitres);
  const ftxId = `ftx_adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tankId = fuelType === 'PETROL' ? 'tank_petrol_01' : 'tank_diesel_01';

  const transactionRecord: FuelStockItemWithMeta = {
    id: ftxId,
    fuel_type: fuelType,
    tank_id: tankId,
    transaction_type: 'ADJUSTMENT',
    quantity_litres: volume,
    reference_id: null,
    notes: reason.trim(),
    created_by: userId,
    creator_name: currentUser?.name || 'Staff',
    created_at: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      await supabase.from('fuel_stock_transactions').insert({
        id: ftxId,
        fuel_type: fuelType,
        tank_id: tankId,
        transaction_type: 'ADJUSTMENT',
        quantity_litres: volume,
        notes: reason.trim(),
        created_by: userId,
      });

      await logAuditAction({
        actorUserId: userId,
        actorRole: userRole,
        action: 'FUEL_STOCK_ADJUSTMENT',
        module: 'FUEL_INVENTORY',
        entityType: 'FUEL_TRANSACTION',
        entityId: ftxId,
        newValues: { fuel_type: fuelType, quantity_litres: volume, reason },
        reason: `Adjusted ${fuelType} stock by ${volume >= 0 ? '+' : ''}${volume}L: ${reason}`,
      });

      return transactionRecord;
    } catch {
      // Fallback
    }
  }

  localTransactions.unshift(transactionRecord);
  const tank = localTanks.find((t) => t.id === tankId);
  if (tank) tank.current_stock_litres += volume;

  return transactionRecord;
}

/**
 * Get overall fuel stock overview, tank levels, active rates & movement history
 */
export async function getFuelStockOverview(fuelTypeFilter?: FuelType, typeFilter?: FuelTransactionType) {
  const prices = await getLatestFuelPrices();
  let transactions: FuelStockItemWithMeta[] = [...localTransactions];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('fuel_stock_transactions')
        .select(`
          *,
          profile:created_by(name)
        `)
        .order('created_at', { ascending: false });

      if (fuelTypeFilter) query = query.eq('fuel_type', fuelTypeFilter);
      if (typeFilter) query = query.eq('transaction_type', typeFilter);

      const { data, error } = await query;
      if (!error && data) {
        transactions = data.map((d: any) => ({
          ...d,
          quantity_litres: Number(d.quantity_litres),
          creator_name: d.profile?.name || 'Staff',
        }));
      }
    } catch {
      // Fallback
    }
  } else {
    if (fuelTypeFilter) {
      transactions = transactions.filter((t) => t.fuel_type === fuelTypeFilter);
    }
    if (typeFilter) {
      transactions = transactions.filter((t) => t.transaction_type === typeFilter);
    }
  }

  const stockSummary = calculateFuelStock(localTransactions);

  const tanksWithLevels = localTanks.map((tank) => {
    const currentStock = tank.fuel_type === 'PETROL' ? stockSummary.petrolStock : stockSummary.dieselStock;
    const capacity = tank.capacity_litres;
    const percentage = Math.min(100, Math.round((currentStock / capacity) * 100));
    const pricePerLitre = tank.fuel_type === 'PETROL' ? prices.PETROL : prices.DIESEL;
    const stockValuation = currentStock * pricePerLitre;

    return {
      ...tank,
      current_stock_litres: currentStock,
      capacity_percentage: percentage,
      price_per_litre: pricePerLitre,
      stock_valuation: stockValuation,
    };
  });

  return {
    prices,
    summary: stockSummary,
    tanks: tanksWithLevels,
    transactions,
  };
}
