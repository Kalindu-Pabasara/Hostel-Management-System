/**
 * ROOM ALLOCATION TESTS
 * Tests: list rooms, filter available, allocate, prevent double allocation,
 *         deallocate, status transitions
 */

// ── Inline mock DB (mirrors db.js logic) ──
function createMockDB() {
  const rooms = [
    { id:1, room_number:'A101', type:'Single', floor:1, capacity:1, price:15000, status:'available' },
    { id:2, room_number:'A102', type:'Single', floor:1, capacity:1, price:15000, status:'occupied'  },
    { id:3, room_number:'B201', type:'Double', floor:2, capacity:2, price:22000, status:'available' },
    { id:4, room_number:'C301', type:'Suite',  floor:3, capacity:1, price:35000, status:'maintenance'},
  ];
  const allocations = [];
  let seq = 0;

  return {
    rooms: {
      all:       () => rooms,
      available: () => rooms.filter(r => r.status === 'available'),
      findById:  (id) => rooms.find(r => r.id === id),
      setStatus: (id, s) => { const r = rooms.find(r => r.id === id); if (r) r.status = s; },
    },
    allocations: {
      all:      () => allocations,
      findById: (id) => allocations.find(a => a.id === id),
      create:   (a) => { a.id = ++seq; allocations.push(a); return a; },
      delete:   (id) => { const i = allocations.findIndex(a => a.id === id); if (i > -1) allocations.splice(i,1); },
    },
  };
}

function allocateRoom(db, { student_id, room_id, start_date, end_date, notes = null }) {
  if (!student_id || !room_id || !start_date || !end_date)
    throw new Error('All fields required.');
  const room = db.rooms.findById(room_id);
  if (!room) throw new Error('Room not found.');
  if (room.status !== 'available') throw new Error('Room not available.');
  const alloc = db.allocations.create({ student_id, room_id, start_date, end_date, notes, is_active: 1 });
  db.rooms.setStatus(room_id, 'occupied');
  return alloc;
}

function deallocateRoom(db, alloc_id) {
  const alloc = db.allocations.findById(alloc_id);
  if (!alloc) throw new Error('Allocation not found.');
  db.rooms.setStatus(alloc.room_id, 'available');
  db.allocations.delete(alloc_id);
  return true;
}

// ══════════════════════════════════════════════
describe('Room Management', () => {
  let db;
  beforeEach(() => { db = createMockDB(); });

  test('TC-R01: Get all rooms returns complete list', () => {
    expect(db.rooms.all()).toHaveLength(4);
  });

  test('TC-R02: Available rooms filter works correctly', () => {
    const avail = db.rooms.available();
    expect(avail).toHaveLength(2);
    avail.forEach(r => expect(r.status).toBe('available'));
  });

  test('TC-R03: Maintenance rooms are not in available list', () => {
    const avail = db.rooms.available();
    const maintenance = avail.find(r => r.status === 'maintenance');
    expect(maintenance).toBeUndefined();
  });

  test('TC-R04: Occupied rooms are not in available list', () => {
    const avail = db.rooms.available();
    const occupied = avail.find(r => r.room_number === 'A102');
    expect(occupied).toBeUndefined();
  });
});

describe('Room Allocation', () => {
  let db;
  beforeEach(() => { db = createMockDB(); });

  test('TC-R05: Valid allocation succeeds and room becomes occupied', () => {
    const alloc = allocateRoom(db, { student_id:2, room_id:1, start_date:'2025-01-01', end_date:'2025-12-31' });
    expect(alloc.id).toBeDefined();
    expect(db.rooms.findById(1).status).toBe('occupied');
  });

  test('TC-R06: Cannot allocate already-occupied room', () => {
    expect(() => allocateRoom(db, { student_id:3, room_id:2, start_date:'2025-01-01', end_date:'2025-12-31' }))
      .toThrow('Room not available.');
  });

  test('TC-R07: Cannot allocate maintenance room', () => {
    expect(() => allocateRoom(db, { student_id:3, room_id:4, start_date:'2025-01-01', end_date:'2025-12-31' }))
      .toThrow('Room not available.');
  });

  test('TC-R08: Allocation with missing fields is rejected', () => {
    expect(() => allocateRoom(db, { student_id:2, room_id:1, start_date:'', end_date:'' }))
      .toThrow('All fields required.');
  });

  test('TC-R09: Deallocating restores room to available', () => {
    const alloc = allocateRoom(db, { student_id:2, room_id:1, start_date:'2025-01-01', end_date:'2025-12-31' });
    expect(db.rooms.findById(1).status).toBe('occupied');
    deallocateRoom(db, alloc.id);
    expect(db.rooms.findById(1).status).toBe('available');
    expect(db.allocations.all()).toHaveLength(0);
  });

  test('TC-R10: Deallocating non-existent allocation throws error', () => {
    expect(() => deallocateRoom(db, 999)).toThrow('Allocation not found.');
  });

  test('TC-R11: Same room can be re-allocated after deallocation', () => {
    const a1 = allocateRoom(db, { student_id:2, room_id:1, start_date:'2025-01-01', end_date:'2025-06-30' });
    deallocateRoom(db, a1.id);
    const a2 = allocateRoom(db, { student_id:3, room_id:1, start_date:'2025-07-01', end_date:'2025-12-31' });
    expect(a2.student_id).toBe(3);
  });
});
