const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const dbPath = path.join(__dirname, 'db.json');

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      console.warn('⚠️ db.json not found, returning empty database structure.');
      return { users: [], seller_profiles: [], products: [], orders: [], order_items: [], payments: [], reviews: [] };
    }
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db.json:', err);
    return { users: [], seller_profiles: [], products: [], orders: [], order_items: [], payments: [], reviews: [] };
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local db.json:', err);
  }
}

function getValue(obj, pathStr) {
  if (!obj) return undefined;
  return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function resolveRelations(tableName, record, db) {
  const result = { ...record };

  if (tableName === 'products') {
    const seller = db.seller_profiles.find(s => s.id === record.seller_id);
    if (seller) {
      result.seller = { ...seller };
    } else {
      result.seller = null;
    }
  }

  if (tableName === 'seller_profiles') {
    const user = db.users.find(u => u.id === record.user_id);
    if (user) {
      result.user = { id: user.id, name: user.name, email: user.email, phone: user.phone };
    } else {
      result.user = null;
    }
  }

  if (tableName === 'reviews') {
    const user = db.users.find(u => u.id === record.customer_id);
    if (user) {
      result.customer = { name: user.name };
    } else {
      result.customer = null;
    }
  }

  if (tableName === 'order_items') {
    const order = db.orders.find(o => o.id === record.order_id);
    const product = db.products.find(p => p.id === record.product_id);
    const seller = db.seller_profiles.find(s => s.id === record.seller_id);
    if (order) {
      result.order = { ...order };
    } else {
      result.order = null;
    }
    if (product) {
      result.product = { ...product };
    } else {
      result.product = null;
    }
    if (seller) {
      result.seller = { ...seller };
    } else {
      result.seller = null;
    }
  }

  return result;
}

function projectFields(tableName, record, selectStr) {
  if (!selectStr || selectStr === '*') return record;

  const fields = [];
  let bracketCount = 0;
  let currentField = '';
  for (let i = 0; i < selectStr.length; i++) {
    const char = selectStr[i];
    if (char === '(') bracketCount++;
    if (char === ')') bracketCount--;
    if (char === ',' && bracketCount === 0) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField.trim()) {
    fields.push(currentField.trim());
  }

  const hasWildcard = fields.some(f => f.startsWith('*'));

  if (hasWildcard) {
    const projected = { ...record };
    fields.forEach(field => {
      if (field.includes(':')) {
        const parts = field.split(':');
        const relName = parts[0].trim();
        const rest = parts[1].trim();
        const subSelectMatch = rest.match(/\(([^)]+)\)/);
        if (subSelectMatch && projected[relName]) {
          const subFieldsStr = subSelectMatch[1];
          projected[relName] = projectFields(relName, projected[relName], subFieldsStr);
        }
      }
    });
    return projected;
  } else {
    const projected = {};
    fields.forEach(field => {
      if (field.includes(':')) {
        const parts = field.split(':');
        const relName = parts[0].trim();
        const rest = parts[1].trim();
        const subSelectMatch = rest.match(/\(([^)]+)\)/);
        if (subSelectMatch && record[relName]) {
          const subFieldsStr = subSelectMatch[1];
          projected[relName] = projectFields(relName, record[relName], subFieldsStr);
        } else {
          projected[relName] = record[relName];
        }
      } else {
        projected[field] = record[field];
      }
    });
    return projected;
  }
}

class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.selectFields = '*';
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.isDelete = false;
    this.isInsert = false;
    this.isUpdate = false;
    this.insertData = null;
    this.updateData = null;
    this.limitVal = null;
    this.countOption = null;
  }

  select(fields = '*', options = {}) {
    this.selectFields = fields;
    if (options.count) {
      this.countOption = options.count;
    }
    return this;
  }

  insert(data) {
    this.isInsert = true;
    this.insertData = data;
    return this;
  }

  update(data) {
    this.isUpdate = true;
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(field, val) {
    this.filters.push({ type: 'eq', field, val });
    return this;
  }

  neq(field, val) {
    this.filters.push({ type: 'neq', field, val });
    return this;
  }

  gte(field, val) {
    this.filters.push({ type: 'gte', field, val });
    return this;
  }

  lte(field, val) {
    this.filters.push({ type: 'lte', field, val });
    return this;
  }

  or(conditionStr) {
    this.filters.push({ type: 'or', conditionStr });
    return this;
  }

  limit(n) {
    this.limitVal = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then(onfulfilled, onrejected) {
    try {
      const result = await this.execute();
      return onfulfilled(result);
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async execute() {
    const db = loadDb();
    let dataset = [];

    if (this.isInsert) {
      const tableData = db[this.tableName] || [];
      const rowsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const insertedRows = [];
      for (const row of rowsToInsert) {
        const newRow = {
          id: row.id || generateUUID(),
          created_at: row.created_at || new Date().toISOString(),
          ...row
        };
        tableData.push(newRow);
        insertedRows.push(newRow);
      }
      db[this.tableName] = tableData;
      saveDb(db);
      dataset = insertedRows;
    } else if (this.isUpdate) {
      const tableData = db[this.tableName] || [];
      const updatedRows = [];

      const resolvedTableData = tableData.map(row => resolveRelations(this.tableName, row, db));

      db[this.tableName] = tableData.map((row, index) => {
        const resolvedRow = resolvedTableData[index];
        const matchesFilters = this.filters.every(filter => {
          if (filter.type === 'eq') {
            return getValue(resolvedRow, filter.field) === filter.val;
          }
          if (filter.type === 'neq') {
            return getValue(resolvedRow, filter.field) !== filter.val;
          }
          if (filter.type === 'gte') {
            return getValue(resolvedRow, filter.field) >= filter.val;
          }
          if (filter.type === 'lte') {
            return getValue(resolvedRow, filter.field) <= filter.val;
          }
          return true;
        });

        if (matchesFilters) {
          const updatedRow = { ...row, ...this.updateData };
          updatedRows.push(updatedRow);
          return updatedRow;
        }
        return row;
      });
      saveDb(db);
      dataset = updatedRows;
    } else if (this.isDelete) {
      const tableData = db[this.tableName] || [];
      const remainingRows = [];
      const deletedRows = [];

      const resolvedTableData = tableData.map(row => resolveRelations(this.tableName, row, db));

      tableData.forEach((row, index) => {
        const resolvedRow = resolvedTableData[index];
        const matchesFilters = this.filters.every(filter => {
          if (filter.type === 'eq') {
            return getValue(resolvedRow, filter.field) === filter.val;
          }
          if (filter.type === 'neq') {
            return getValue(resolvedRow, filter.field) !== filter.val;
          }
          if (filter.type === 'gte') {
            return getValue(resolvedRow, filter.field) >= filter.val;
          }
          if (filter.type === 'lte') {
            return getValue(resolvedRow, filter.field) <= filter.val;
          }
          return true;
        });

        if (matchesFilters) {
          deletedRows.push(row);
        } else {
          remainingRows.push(row);
        }
      });
      db[this.tableName] = remainingRows;
      saveDb(db);
      dataset = deletedRows;
    } else {
      // SELECT
      dataset = [...(db[this.tableName] || [])];
    }

    // Resolve relations for output
    dataset = dataset.map(record => resolveRelations(this.tableName, record, db));

    // Apply filters for read operations
    if (!this.isInsert && !this.isUpdate && !this.isDelete) {
      dataset = dataset.filter(record => {
        return this.filters.every(filter => {
          if (filter.type === 'eq') {
            return getValue(record, filter.field) === filter.val;
          }
          if (filter.type === 'neq') {
            return getValue(record, filter.field) !== filter.val;
          }
          if (filter.type === 'gte') {
            return getValue(record, filter.field) >= filter.val;
          }
          if (filter.type === 'lte') {
            return getValue(record, filter.field) <= filter.val;
          }
          if (filter.type === 'or') {
            const parts = filter.conditionStr.split(',');
            return parts.some(part => {
              const match = part.match(/^([^.]+)\.ilike\.%([^%]+)%$/);
              if (match) {
                const field = match[1];
                const term = match[2].toLowerCase();
                const val = record[field];
                return val && typeof val === 'string' && val.toLowerCase().includes(term);
              }
              return false;
            });
          }
          return true;
        });
      });
    }

    const totalCount = dataset.length;

    if (this.limitVal !== null) {
      dataset = dataset.slice(0, this.limitVal);
    }

    // Apply projections
    dataset = dataset.map(record => projectFields(this.tableName, record, this.selectFields));

    let finalData = dataset;
    if (this.isSingle || this.isMaybeSingle) {
      finalData = dataset.length > 0 ? dataset[0] : null;
    }

    return {
      data: finalData,
      error: null,
      count: totalCount
    };
  }
}

const storage = {
  listBuckets: async () => {
    return { data: [{ name: 'products' }], error: null };
  },
  createBucket: async (name, options) => {
    return { data: { name }, error: null };
  },
  from: (bucketName) => {
    return {
      upload: async (filename, buffer, options) => {
        try {
          const uploadDir = path.join(__dirname, '../public/uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          return { data: { path: filename }, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      getPublicUrl: (filename) => {
        const port = process.env.PORT || 5000;
        return { data: { publicUrl: `http://localhost:${port}/uploads/${filename}` } };
      }
    };
  }
};

const supabase = {
  from: (tableName) => new QueryBuilder(tableName),
  storage
};

module.exports = supabase;
