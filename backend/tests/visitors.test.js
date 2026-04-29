/**
 * VISITOR MANAGEMENT TESTS
 * Tests: register visitor, approve/reject, list by host,
 *         missing fields, status transitions, delete
 */

// ── Inline mock visitor DB ──
function createVisitorDB() {
  const visitors = [];
  let seq = 0;
  return {
    all:       () => visitors,
    byHost:    (hid) => visitors.filter(v => v.host_student_id === hid),
    findById:  (id)  => visitors.find(v => v.id === id),
    create:    (v)   => { v.id = ++seq; v.created_at = '2025-03-23'; visitors.push(v); return v; },
    setStatus: (id, s) => { const v = visitors.find(v => v.id === id); if (v) v.status = s; },
    delete:    (id)  => { const i = visitors.findIndex(v => v.id === id); if (i > -1) visitors.splice(i,1); },
  };
}

function registerVisitor(db, { visitor_name, visitor_nic, visitor_phone, host_student_id, visit_purpose, visit_date, num_visitors = 1 }) {
  if (!visitor_name || !visitor_nic || !visitor_phone || !visit_purpose || !visit_date)
    throw new Error('Required fields missing.');
  if (!host_student_id) throw new Error('Host student required.');
  if (num_visitors < 1) throw new Error('Number of visitors must be at least 1.');
  return db.create({ visitor_name, visitor_nic, visitor_phone, host_student_id, visit_purpose, visit_date, num_visitors, status: 'pending' });
}

// ══════════════════════════════════════════════
describe('Visitor Registration', () => {
  let db;
  beforeEach(() => { db = createVisitorDB(); });

  test('TC-V01: Valid visitor registration creates pending record', () => {
    const v = registerVisitor(db, { visitor_name:'Kamal Perera', visitor_nic:'631234567V', visitor_phone:'0771234500', host_student_id:2, visit_purpose:'personal', visit_date:'2025-04-01' });
    expect(v.id).toBeDefined();
    expect(v.status).toBe('pending');
  });

  test('TC-V02: Missing visitor name is rejected', () => {
    expect(() => registerVisitor(db, { visitor_name:'', visitor_nic:'631234567V', visitor_phone:'0771234500', host_student_id:2, visit_purpose:'personal', visit_date:'2025-04-01' }))
      .toThrow('Required fields missing.');
  });

  test('TC-V03: Missing visit purpose is rejected', () => {
    expect(() => registerVisitor(db, { visitor_name:'Kamal', visitor_nic:'631234567V', visitor_phone:'0771234500', host_student_id:2, visit_purpose:'', visit_date:'2025-04-01' }))
      .toThrow('Required fields missing.');
  });

  test('TC-V04: Missing host student is rejected', () => {
    expect(() => registerVisitor(db, { visitor_name:'Kamal', visitor_nic:'631234567V', visitor_phone:'0771234500', host_student_id:null, visit_purpose:'personal', visit_date:'2025-04-01' }))
      .toThrow('Host student required.');
  });

  test('TC-V05: Number of visitors less than 1 is rejected', () => {
    expect(() => registerVisitor(db, { visitor_name:'Kamal', visitor_nic:'631234567V', visitor_phone:'0771234500', host_student_id:2, visit_purpose:'personal', visit_date:'2025-04-01', num_visitors:0 }))
      .toThrow('Number of visitors must be at least 1.');
  });

  test('TC-V06: Multiple visitors can be registered with different host students', () => {
    registerVisitor(db, { visitor_name:'Siri Silva',   visitor_nic:'721234567V', visitor_phone:'0771234501', host_student_id:2, visit_purpose:'emergency', visit_date:'2025-04-01' });
    registerVisitor(db, { visitor_name:'Amali Fernando', visitor_nic:'811234567V', visitor_phone:'0771234502', host_student_id:3, visit_purpose:'pickup',   visit_date:'2025-04-02' });
    expect(db.all()).toHaveLength(2);
    expect(db.byHost(2)).toHaveLength(1);
    expect(db.byHost(3)).toHaveLength(1);
  });
});

describe('Visitor Approval Workflow', () => {
  let db;
  let visitor;
  beforeEach(() => {
    db = createVisitorDB();
    visitor = registerVisitor(db, { visitor_name:'Test Visitor', visitor_nic:'991234567V', visitor_phone:'0771234567', host_student_id:2, visit_purpose:'personal', visit_date:'2025-04-01' });
  });

  test('TC-V07: Admin can approve a pending visitor', () => {
    db.setStatus(visitor.id, 'approved');
    expect(db.findById(visitor.id).status).toBe('approved');
  });

  test('TC-V08: Admin can reject a pending visitor', () => {
    db.setStatus(visitor.id, 'rejected');
    expect(db.findById(visitor.id).status).toBe('rejected');
  });

  test('TC-V09: Visitor record can be deleted by admin', () => {
    db.delete(visitor.id);
    expect(db.all()).toHaveLength(0);
    expect(db.findById(visitor.id)).toBeUndefined();
  });

  test('TC-V10: Approved visitors are still in the list', () => {
    db.setStatus(visitor.id, 'approved');
    expect(db.all()).toHaveLength(1);
    expect(db.byHost(2)[0].status).toBe('approved');
  });

  test('TC-V11: New visitor starts as pending (not auto-approved)', () => {
    const v2 = registerVisitor(db, { visitor_name:'Another', visitor_nic:'551234567V', visitor_phone:'0771234503', host_student_id:3, visit_purpose:'delivery', visit_date:'2025-04-05' });
    expect(v2.status).toBe('pending');
  });
});
