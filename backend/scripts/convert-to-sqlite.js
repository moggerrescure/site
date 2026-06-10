const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prismaDir = path.join(__dirname, '..', 'prisma');
const originalSchemaPath = path.join(prismaDir, 'schema.prisma');
const sqliteSchemaPath = path.join(prismaDir, 'schema.sqlite.prisma');

console.log('Converting PostgreSQL schema to SQLite...');

let schema = fs.readFileSync(originalSchemaPath, 'utf8');

// 1. Change datasource provider
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');

// 2. Find all enum names and their values
const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;
const enums = {};
let match;
while ((match = enumRegex.exec(schema)) !== null) {
  const enumName = match[1];
  const enumValues = match[2]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(val => val.split(' ')[0].trim());
  enums[enumName] = enumValues;
}

// 3. Remove enum declarations from the schema
schema = schema.replace(/enum\s+(\w+)\s*{[^}]+}/g, '');

// 4. Replace enum usages with String, and wrap @default(VALUE) with quotes @default("VALUE")
for (const [enumName, values] of Object.entries(enums)) {
  // Replace: field Name @default(VALUE) -> field String @default("VALUE")
  // Replace: field Name? -> field String?
  // Replace: field Name[] -> field String[] (Wait, SQLite doesn't support scalar lists, check if there are any array types of enums)
  
  // We match the type name followed by optional ? and optional default attribute
  // e.g. role UserRole @default(USER)
  const usageRegex = new RegExp(`\\b${enumName}(\\s*\\?)?(\\s+@default\\()([^)]+)(\\))`, 'g');
  schema = schema.replace(usageRegex, (m, opt, prefix, defVal, suffix) => {
    // If defVal is not already quoted, quote it
    const quotedVal = (defVal.startsWith('"') && defVal.endsWith('"')) ? defVal : `"${defVal}"`;
    return `String${opt || ''}${prefix}${quotedVal}${suffix}`;
  });

  // Replace remaining instances where there is no default value (e.g. "role UserRole" or "role UserRole?")
  const simpleUsageRegex = new RegExp(`\\b${enumName}(\\b|\\?)`, 'g');
  schema = schema.replace(simpleUsageRegex, 'String$1');
}

// 5. Remove PostgreSQL specific attributes like @db.Text, @db.Uuid, etc.
schema = schema.replace(/@db\.\w+/g, '');

// 6. Check for Unsupported types or scalar lists (SQLite does not support String[] type, check if they exist in schema.prisma)
// Let's replace any Unsupported or array of String if needed.
// (We will let prisma validate, but let's check)

fs.writeFileSync(sqliteSchemaPath, schema, 'utf8');
console.log('Successfully wrote SQLite schema to:', sqliteSchemaPath);
