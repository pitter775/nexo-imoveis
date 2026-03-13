import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "database.sqlite");
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    is_premium INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price REAL,
    location TEXT,
    type TEXT,
    sqft INTEGER,
    beds INTEGER,
    baths INTEGER,
    image_url TEXT,
    is_premium INTEGER DEFAULT 0,
    cap_rate REAL,
    roi REAL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    property_id INTEGER,
    amount REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(property_id) REFERENCES properties(id)
  );
`);

// Seed data if empty
const propertyCount = db.prepare("SELECT count(*) as count FROM properties").get() as { count: number };
if (propertyCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO properties (title, description, price, location, type, sqft, beds, baths, image_url, is_premium, cap_rate, roi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run("Mansão das Colinas", "Vila de luxo em Beverly Hills", 4250000, "Beverly Hills, CA", "Residencial", 5800, 5, 6, "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000", 1, 6.2, 12.4);
  insert.run("Cobertura Skyline", "Cobertura moderna em Manhattan", 1120000, "Manhattan, NY", "Comercial", 1850, 2, 2, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000", 0, 7.8, 15.2);
  insert.run("Vila Azure Heights", "Mansão à beira-mar em Malibu", 2450000, "Malibu, CA", "Residencial", 4200, 4, 4, "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1000", 1, 5.5, 10.8);
  insert.run("Fazenda Oak Ridge", "Casa de família tradicional em Austin", 895000, "Austin, TX", "Residencial", 6500, 6, 5, "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000", 0, 8.5, 14.0);
}

export default db;
