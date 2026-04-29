/**
 * SECURITY TESTS
 * Tests: JWT validation, token expiry, role-based access control,
 *         SQL/NoSQL injection prevention, password hashing strength,
 *         missing auth header rejection
 */
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'hostelms_secret';

// ── Simulate auth middleware ──
function authenticate(token) {
  if (!token) throw new Error('No token provided. Access denied.');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new Error('Token expired. Please log in again.');
    throw new Error('Invalid token. Please log in.');
  }
}

function requireAdmin(decoded) {
  if (!decoded || decoded.role !== 'admin')
    throw new Error('Access denied. Admins only.');
}

function makeToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// ── Simulate input sanitisation ──
function sanitiseInput(value) {
  if (typeof value !== 'string') return value;
  // Basic: reject obvious injection patterns
  const dangerous = /(\$where|\$ne|\$gt|DROP\s+TABLE|SELECT\s+\*|INSERT\s+INTO|DELETE\s+FROM|<script)/i;
  if (dangerous.test(value)) throw new Error('Invalid input detected.');
  return value.trim();
}

// ══════════════════════════════════════════════
describe('Security — JWT Authentication', () => {

  test('TC-S01: Valid JWT token is accepted', () => {
    const token = makeToken({ id:1, email:'admin@hostel.lk', role:'admin' });
    const decoded = authenticate(token);
    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe('admin');
  });

  test('TC-S02: Request with no token is rejected', () => {
    expect(() => authenticate(null)).toThrow('No token provided. Access denied.');
    expect(() => authenticate('')).toThrow('No token provided. Access denied.');
  });

  test('TC-S03: Tampered/invalid token is rejected', () => {
    expect(() => authenticate('invalid.token.string')).toThrow('Invalid token. Please log in.');
  });

  test('TC-S04: Token signed with wrong secret is rejected', () => {
    const fakeToken = jwt.sign({ id:1, role:'admin' }, 'WRONG_SECRET', { expiresIn:'1h' });
    expect(() => authenticate(fakeToken)).toThrow('Invalid token. Please log in.');
  });

  test('TC-S05: Expired token is rejected', () => {
    const expiredToken = makeToken({ id:1, role:'admin' }, '-1s'); // already expired
    expect(() => authenticate(expiredToken)).toThrow('Token expired. Please log in again.');
  });

  test('TC-S06: JWT payload contains correct user data', () => {
    const token = makeToken({ id:5, email:'test@hostel.lk', role:'student' });
    const decoded = authenticate(token);
    expect(decoded.email).toBe('test@hostel.lk');
    expect(decoded.role).toBe('student');
  });
});

describe('Security — Role-Based Access Control', () => {

  test('TC-S07: Admin role passes admin-only check', () => {
    const decoded = { id:1, role:'admin' };
    expect(() => requireAdmin(decoded)).not.toThrow();
  });

  test('TC-S08: Student role is blocked from admin-only endpoints', () => {
    const decoded = { id:2, role:'student' };
    expect(() => requireAdmin(decoded)).toThrow('Access denied. Admins only.');
  });

  test('TC-S09: Null decoded payload is blocked from admin endpoints', () => {
    expect(() => requireAdmin(null)).toThrow('Access denied. Admins only.');
  });

  test('TC-S10: Full admin flow — valid token + admin role', () => {
    const token = makeToken({ id:1, email:'admin@hostel.lk', role:'admin' });
    const decoded = authenticate(token);
    expect(() => requireAdmin(decoded)).not.toThrow();
  });

  test('TC-S11: Student cannot access admin endpoint end-to-end', () => {
    const token = makeToken({ id:2, email:'stu@hostel.lk', role:'student' });
    const decoded = authenticate(token);
    expect(() => requireAdmin(decoded)).toThrow('Access denied. Admins only.');
  });
});

describe('Security — Password Hashing', () => {

  test('TC-S12: Passwords are stored as bcrypt hashes (not plain text)', async () => {
    const hash = await bcrypt.hash('Admin@1234', 12);
    expect(hash).not.toBe('Admin@1234');
    expect(hash.startsWith('$2a$')).toBe(true);
  });

  test('TC-S13: Correct password matches its hash', async () => {
    const hash = await bcrypt.hash('Admin@1234', 10);
    const match = await bcrypt.compare('Admin@1234', hash);
    expect(match).toBe(true);
  });

  test('TC-S14: Wrong password does not match hash', async () => {
    const hash = await bcrypt.hash('Admin@1234', 10);
    const match = await bcrypt.compare('WrongPass', hash);
    expect(match).toBe(false);
  });

  test('TC-S15: Two hashes of same password are different (salted)', async () => {
    const h1 = await bcrypt.hash('samepassword', 10);
    const h2 = await bcrypt.hash('samepassword', 10);
    expect(h1).not.toBe(h2); // bcrypt salt makes them unique
  });
});

describe('Security — Input Injection Prevention', () => {

  test('TC-S16: Normal input passes sanitisation', () => {
    expect(sanitiseInput('John Perera')).toBe('John Perera');
    expect(sanitiseInput('john@hostel.lk')).toBe('john@hostel.lk');
  });

  test('TC-S17: NoSQL injection patterns are rejected', () => {
    expect(() => sanitiseInput('{ $where: "1==1" }')).toThrow('Invalid input detected.');
    expect(() => sanitiseInput('value $ne null')).toThrow('Invalid input detected.');
  });

  test('TC-S18: SQL injection patterns are rejected', () => {
    expect(() => sanitiseInput("'; DROP TABLE users; --")).toThrow('Invalid input detected.');
    expect(() => sanitiseInput('SELECT * FROM users')).toThrow('Invalid input detected.');
  });

  test('TC-S19: XSS script tags are rejected', () => {
    expect(() => sanitiseInput('<script>alert("xss")</script>')).toThrow('Invalid input detected.');
  });

  test('TC-S20: Whitespace is trimmed from inputs', () => {
    expect(sanitiseInput('  john@hostel.lk  ')).toBe('john@hostel.lk');
  });
});
