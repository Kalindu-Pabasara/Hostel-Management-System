/**
 * FEE MANAGEMENT TESTS
 * Tests: list structures, add/edit/delete fee, record payments,
 *         amount validation, billing periods
 */

// ── Inline mock fee DB ──
function createFeeDB() {
  const structures = [
    { id:1, name:'Accommodation - Single', category:'accommodation', amount:15000, billing_period:'monthly',  effective_from:'2024-01-01' },
    { id:2, name:'Mess Fee',               category:'meals',         amount:8000,  billing_period:'monthly',  effective_from:'2024-01-01' },
    { id:3, name:'Security Deposit',       category:'security',      amount:30000, billing_period:'one-time', effective_from:'2024-01-01' },
  ];
  const payments = [];
  let fSeq = 3, pSeq = 0;

  return {
    feeStructures: {
      all:      () => structures,
      findById: (id) => structures.find(f => f.id === id),
      create:   (f)  => { f.id = ++fSeq; structures.push(f); return f; },
      update:   (id, ch) => { const i = structures.findIndex(f => f.id === id); if (i > -1) Object.assign(structures[i], ch); },
      delete:   (id) => { const i = structures.findIndex(f => f.id === id); if (i > -1) structures.splice(i,1); },
    },
    payments: {
      all:      () => payments,
      create:   (p) => { p.id = ++pSeq; payments.push(p); return p; },
    },
  };
}

function addFeeStructure(db, { name, category, amount, billing_period = 'monthly', effective_from }) {
  if (!name || !category || amount === undefined || amount === null || amount === '' || !effective_from)
    throw new Error('Required fields missing.');
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) throw new Error('Amount must be a positive number.');
  return db.feeStructures.create({ name, category, amount: parseFloat(amount), billing_period, effective_from });
}

function recordPayment(db, { student_id, fee_type, amount, payment_method, payment_date, billing_month }) {
  if (!student_id || !fee_type || amount === undefined || amount === null || amount === '' || !payment_date || !billing_month)
    throw new Error('Required fields missing.');
  if (parseFloat(amount) <= 0) throw new Error('Amount must be positive.');
  return db.payments.create({ student_id, fee_type, amount: parseFloat(amount), payment_method: payment_method || 'cash', payment_date, billing_month, status: 'paid' });
}

// ══════════════════════════════════════════════
describe('Fee Structure Management', () => {
  let db;
  beforeEach(() => { db = createFeeDB(); });

  test('TC-F01: Get all fee structures returns correct count', () => {
    expect(db.feeStructures.all()).toHaveLength(3);
  });

  test('TC-F02: Add new fee structure with valid data', () => {
    const f = addFeeStructure(db, { name:'Laundry', category:'laundry', amount:1500, effective_from:'2024-01-01' });
    expect(f.id).toBe(4);
    expect(f.amount).toBe(1500);
    expect(db.feeStructures.all()).toHaveLength(4);
  });

  test('TC-F03: Fee structure with missing name is rejected', () => {
    expect(() => addFeeStructure(db, { name:'', category:'laundry', amount:1500, effective_from:'2024-01-01' }))
      .toThrow('Required fields missing.');
  });

  test('TC-F04: Fee structure with zero amount is rejected', () => {
    expect(() => addFeeStructure(db, { name:'Test Fee', category:'other', amount:0, effective_from:'2024-01-01' }))
      .toThrow('Amount must be a positive number.');
  });

  test('TC-F05: Fee structure with negative amount is rejected', () => {
    expect(() => addFeeStructure(db, { name:'Test Fee', category:'other', amount:-500, effective_from:'2024-01-01' }))
      .toThrow('Amount must be a positive number.');
  });

  test('TC-F06: Update fee structure amount', () => {
    db.feeStructures.update(1, { amount: 16000 });
    expect(db.feeStructures.findById(1).amount).toBe(16000);
  });

  test('TC-F07: Delete fee structure removes it from list', () => {
    db.feeStructures.delete(2);
    expect(db.feeStructures.all()).toHaveLength(2);
    expect(db.feeStructures.findById(2)).toBeUndefined();
  });

  test('TC-F08: Billing period one-time differ from monthly', () => {
    const oneTime = db.feeStructures.findById(3);
    expect(oneTime.billing_period).toBe('one-time');
    const monthly = db.feeStructures.findById(1);
    expect(monthly.billing_period).toBe('monthly');
  });
});

describe('Fee Payment Recording', () => {
  let db;
  beforeEach(() => { db = createFeeDB(); });

  test('TC-F09: Valid payment is recorded successfully', () => {
    const p = recordPayment(db, { student_id:2, fee_type:'accommodation', amount:15000, payment_date:'2025-03-01', billing_month:'2025-03' });
    expect(p.id).toBe(1);
    expect(p.status).toBe('paid');
  });

  test('TC-F10: Payment with zero amount is rejected', () => {
    expect(() => recordPayment(db, { student_id:2, fee_type:'meals', amount:0, payment_date:'2025-03-01', billing_month:'2025-03' }))
      .toThrow('Amount must be positive.');
  });

  test('TC-F11: Payment missing required fields is rejected', () => {
    expect(() => recordPayment(db, { student_id:2, fee_type:'', amount:8000, payment_date:'', billing_month:'' }))
      .toThrow('Required fields missing.');
  });

  test('TC-F12: Multiple payments for different students recorded correctly', () => {
    recordPayment(db, { student_id:2, fee_type:'accommodation', amount:15000, payment_date:'2025-03-01', billing_month:'2025-03' });
    recordPayment(db, { student_id:3, fee_type:'meals',         amount:8000,  payment_date:'2025-03-01', billing_month:'2025-03' });
    expect(db.payments.all()).toHaveLength(2);
  });
});
