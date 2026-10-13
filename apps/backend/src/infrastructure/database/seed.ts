import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { closeDatabaseConnections, getDrizzleDatabase } from './database.js';
import * as schema from './schema/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STANDARD_PERMISSIONS = [
  { name: 'sniper:arm', description: 'Arm high-speed trading engine' },
  { name: 'sniper:disarm', description: 'Disarm and emergency stop trading engine' },
  { name: 'sniper:fire_test', description: 'Fire manual test order shots' },
  { name: 'config:read', description: 'View bot configurations' },
  { name: 'config:write', description: 'Modify and save bot configurations' },
  { name: 'market:read', description: 'View live market data and quotes' },
  { name: 'market:watch', description: 'Add or remove tickers from watchlist' },
  { name: 'broker:manage', description: 'Manage broker accounts and credentials' },
  { name: 'user:manage', description: 'Manage system users and role assignments' },
  { name: 'audit:read', description: 'View security audit logs' },
];

export async function runDatabaseSeed() {
  console.log('--> Starting database seeding...');
  const db = getDrizzleDatabase();

  try {
    // 1. Seed Roles
    console.log('--> Seeding standard roles (admin, trader, viewer)...');
    const [adminRole] = await db
      .insert(schema.roles)
      .values({ name: 'admin', description: 'System Administrator with full access' })
      .onConflictDoUpdate({ target: schema.roles.name, set: { description: 'System Administrator with full access' } })
      .returning();

    const [traderRole] = await db
      .insert(schema.roles)
      .values({ name: 'trader', description: 'Standard Trader (Engine operation, Watchlist, Config)' })
      .onConflictDoUpdate({ target: schema.roles.name, set: { description: 'Standard Trader (Engine operation, Watchlist, Config)' } })
      .returning();

    const [viewerRole] = await db
      .insert(schema.roles)
      .values({ name: 'viewer', description: 'Read-only viewer (Monitoring only)' })
      .onConflictDoUpdate({ target: schema.roles.name, set: { description: 'Read-only viewer (Monitoring only)' } })
      .returning();

    // 2. Seed Permissions
    console.log('--> Seeding standard permissions...');
    const permissionRecords = [];
    for (const perm of STANDARD_PERMISSIONS) {
      const [inserted] = await db
        .insert(schema.permissions)
        .values(perm)
        .onConflictDoUpdate({ target: schema.permissions.name, set: { description: perm.description } })
        .returning();
      permissionRecords.push(inserted);
    }

    // 3. Assign Permissions to Roles
    console.log('--> Assigning permissions to roles...');
    // Admin gets all permissions
    for (const perm of permissionRecords) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: adminRole.id, permissionId: perm.id })
        .onConflictDoNothing();
    }

    // Trader gets all except user:manage and audit:read
    for (const perm of permissionRecords.filter((p) => p.name !== 'user:manage' && p.name !== 'audit:read')) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: traderRole.id, permissionId: perm.id })
        .onConflictDoNothing();
    }

    // Viewer gets only read permissions
    for (const perm of permissionRecords.filter((p) => p.name.includes(':read'))) {
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: viewerRole.id, permissionId: perm.id })
        .onConflictDoNothing();
    }

    // 4. Seed Symbols from data/symbols.json if symbols table is empty
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.symbols);
    if (count === 0) {
      const symbolsPath = path.resolve(__dirname, '../../../data/symbols.json');
      if (fs.existsSync(symbolsPath)) {
        console.log(`--> Seeding initial symbols from ${symbolsPath}...`);
        const raw = fs.readFileSync(symbolsPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const batchSize = 200;
          for (let i = 0; i < list.length; i += batchSize) {
            const chunk = list.slice(i, i + batchSize).map((item) => ({
              isin: item.isin,
              symbol: item.symbol?.trim(),
              name: item.name,
              insCode: item.insCode,
              market: item.market,
              groupName: item.group,
              basePrice: item.basePrice,
              closingPrice: item.closingPrice,
              yesterdayPrice: item.yesterdayPrice,
              pMax: item.pMax,
              pMin: item.pMin,
              baseVolume: item.baseVolume,
              volume: item.volume,
              value: item.value,
              tradesCount: item.tradesCount,
              eps: item.eps,
              pe: item.pe ? String(item.pe) : null,
              isIpo: Boolean(item.isIpo),
              ipoDetails: item.ipoDetails,
            })).filter((item) => item.isin && item.symbol);

            if (chunk.length > 0) {
              await db.insert(schema.symbols).values(chunk).onConflictDoNothing();
            }
          }
          console.log(`✓ Seeded ${list.length} symbols into PostgreSQL database.`);
        }
      }
    }

    console.log('✓ Database seeding completed successfully.');
  } catch (err: unknown) {
    console.error('::error::Seeding failed:', err);
    throw err;
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDatabaseSeed()
    .then(() => closeDatabaseConnections())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
