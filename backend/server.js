const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ─── DATABASE SETUP ────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, '../data/inteliprop.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    property_type TEXT DEFAULT 'Departamento',
    sqm_covered REAL,
    sqm_total REAL,
    rooms INTEGER,
    floor INTEGER,
    age_years INTEGER,
    condition TEXT DEFAULT 'Reciclado',
    listed_price_usd REAL,
    expenses_usd REAL DEFAULT 0,
    has_garage INTEGER DEFAULT 0,
    has_pool INTEGER DEFAULT 0,
    has_gym INTEGER DEFAULT 0,
    has_terrace INTEGER DEFAULT 0,
    orientation TEXT,
    status TEXT DEFAULT 'active',
    days_on_market INTEGER DEFAULT 0,
    avm_value REAL,
    avm_deviation_pct REAL,
    investment_score REAL,
    risk_score REAL,
    commercial_score REAL,
    ai_insight TEXT,
    owner_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    client_type TEXT DEFAULT 'buyer',
    budget_min_usd REAL,
    budget_max_usd REAL,
    preferred_neighborhoods TEXT,
    preferred_rooms TEXT,
    notes TEXT,
    pipeline_stage TEXT DEFAULT 'lead',
    temperature TEXT DEFAULT 'cold',
    assigned_broker TEXT,
    ai_insight TEXT,
    last_contact TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    client_id TEXT,
    type TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS market_data (
    id TEXT PRIMARY KEY,
    neighborhood TEXT NOT NULL,
    avg_usd_sqm REAL,
    median_days_listed INTEGER,
    active_listings INTEGER,
    absorption_rate REAL,
    demand_score REAL,
    recorded_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pipeline_deals (
    id TEXT PRIMARY KEY,
    title TEXT,
    client_id TEXT,
    property_id TEXT,
    stage TEXT DEFAULT 'lead',
    value_usd REAL,
    notes TEXT,
    expected_close TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── SEED DATA ─────────────────────────────────────────────────────────────────
const existingProps = db.prepare('SELECT COUNT(*) as count FROM properties').get();
if (existingProps.count === 0) {
  const seedProperties = [
    { id: uuidv4(), address: 'Av. Santa Fe 3200', neighborhood: 'Palermo', sqm_covered: 72, rooms: 3, floor: 6, age_years: 12, condition: 'Reciclado', listed_price_usd: 220000, has_garage: 1, has_gym: 1, avm_value: 187000, avm_deviation_pct: 17.6, investment_score: 62, risk_score: 74, commercial_score: 55, status: 'active', days_on_market: 42, ai_insight: 'Propiedad publicada 17.6% sobre el mercado real. Con sobreoferta actual del 23% en Palermo, el tiempo estimado de venta supera los 90 días sin ajuste de precio. Rango recomendado: USD 190–195k.' },
    { id: uuidv4(), address: 'Cabildo 2840', neighborhood: 'Belgrano', sqm_covered: 55, rooms: 2, floor: 3, age_years: 8, condition: 'Muy bueno', listed_price_usd: 142000, has_garage: 0, has_gym: 0, avm_value: 151000, avm_deviation_pct: -6.3, investment_score: 84, risk_score: 22, commercial_score: 88, status: 'active', days_on_market: 8, ai_insight: 'Excelente oportunidad. Propiedad 6.3% por debajo del valor real de Belgrano. Alta liquidez en zona, tiempo promedio de venta 21 días. Score de inversión 84/100.' },
    { id: uuidv4(), address: 'Rivadavia 5100', neighborhood: 'Caballito', sqm_covered: 98, rooms: 4, floor: 0, age_years: 20, condition: 'Reciclado', listed_price_usd: 195000, has_garage: 1, has_gym: 0, avm_value: 193000, avm_deviation_pct: 1.1, investment_score: 76, risk_score: 31, commercial_score: 72, status: 'active', days_on_market: 15, ai_insight: 'Propiedad en precio de mercado. Caballito mantiene demanda estable. Buen candidato para cierre en 30–45 días sin ajuste necesario.' },
    { id: uuidv4(), address: 'Triunvirato 4700', neighborhood: 'Villa Urquiza', sqm_covered: 80, rooms: 3, floor: 4, age_years: 15, condition: 'Reciclado', listed_price_usd: 168000, has_garage: 0, has_gym: 0, avm_value: 159000, avm_deviation_pct: 5.7, investment_score: 58, risk_score: 48, commercial_score: 61, status: 'active', days_on_market: 29, ai_insight: 'Leve sobreprecio del 5.7%. Villa Urquiza muestra crecimiento de demanda del 12% interanual. Ajuste a USD 162k aceleraría el cierre.' },
    { id: uuidv4(), address: 'Monroe 3200', neighborhood: 'Núñez', sqm_covered: 60, rooms: 2, floor: 8, age_years: 5, condition: 'Muy bueno', listed_price_usd: 155000, has_garage: 1, has_gym: 1, avm_value: 162000, avm_deviation_pct: -4.5, investment_score: 88, risk_score: 18, commercial_score: 91, status: 'active', days_on_market: 5, ai_insight: 'Mejor oportunidad de la cartera. Núñez con apreciación del 8.3% anual y demanda 40% superior a oferta. Tiempo medio de venta: 21 días. Altamente recomendado.' },
    { id: uuidv4(), address: 'Thames 2100', neighborhood: 'Palermo', sqm_covered: 74, rooms: 3, floor: 7, age_years: 4, condition: 'A estrenar', listed_price_usd: 196000, has_garage: 1, has_pool: 1, has_gym: 1, avm_value: 199000, avm_deviation_pct: -1.5, investment_score: 79, risk_score: 28, commercial_score: 82, status: 'active', days_on_market: 11, ai_insight: 'A estrenar con amenities premium en zona de alta demanda. Precio levemente por debajo del mercado, lo que favorece cierre rápido. Perfil comprador: inversor renta o familia premium.' },
  ];
  const insertProp = db.prepare(`INSERT INTO properties (id,address,neighborhood,sqm_covered,rooms,floor,age_years,condition,listed_price_usd,has_garage,has_pool,has_gym,avm_value,avm_deviation_pct,investment_score,risk_score,commercial_score,status,days_on_market,ai_insight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  seedProperties.forEach(p => insertProp.run(p.id,p.address,p.neighborhood,p.sqm_covered,p.rooms,p.floor,p.age_years,p.condition,p.listed_price_usd,p.has_garage||0,p.has_pool||0,p.has_gym||0,p.avm_value,p.avm_deviation_pct,p.investment_score,p.risk_score,p.commercial_score,p.status,p.days_on_market,p.ai_insight));

  const seedClients = [
    { id: uuidv4(), name: 'Laura Méndez', email: 'laura@email.com', phone: '11-5555-1234', client_type: 'buyer', budget_min_usd: 170000, budget_max_usd: 200000, preferred_neighborhoods: 'Palermo,Belgrano', preferred_rooms: '3', pipeline_stage: 'qualifying', temperature: 'hot', ai_insight: 'Coincide con 3 propiedades en cartera. Altamente probable cierre en 30 días. Score de match: 92%.' },
    { id: uuidv4(), name: 'Carlos Vega', email: 'cvega@invest.com', phone: '11-5555-5678', client_type: 'investor', budget_min_usd: 300000, budget_max_usd: 500000, preferred_neighborhoods: 'Núñez,Belgrano', preferred_rooms: '2,3', pipeline_stage: 'qualifying', temperature: 'hot', ai_insight: 'Inversor multi-propiedad. Score cartera: 78/100. Rentabilidad estimada 5.2% anual. Candidato ideal para Monroe 3200.' },
    { id: uuidv4(), name: 'Ana Rodríguez', email: 'ana.rodriguez@mail.com', phone: '11-5555-9012', client_type: 'seller', budget_min_usd: 195000, budget_max_usd: 220000, preferred_neighborhoods: 'Palermo', preferred_rooms: '3', pipeline_stage: 'offer', temperature: 'warm', ai_insight: 'Propietaria con expectativa de precio 17.6% sobre mercado. Recomendación: proponer ajuste gradual a USD 195k con argumentación de datos.' },
    { id: uuidv4(), name: 'Martín Lozano', email: 'mlozano@gmail.com', phone: '11-5555-3456', client_type: 'buyer', budget_min_usd: 90000, budget_max_usd: 130000, preferred_neighborhoods: 'Caballito,Almagro', preferred_rooms: '2,3', pipeline_stage: 'lead', temperature: 'cold', ai_insight: 'Sin actividad en 12 días. Recomendación: recontactar con novedades de mercado en Caballito. Tasa de conversión estimada: 34%.' },
    { id: uuidv4(), name: 'Sofía Herrera', email: 'sofia.h@inversiones.com', phone: '11-5555-7890', client_type: 'investor', budget_min_usd: 150000, budget_max_usd: 250000, preferred_neighborhoods: 'Palermo,Recoleta', preferred_rooms: '2', pipeline_stage: 'qualifying', temperature: 'hot', ai_insight: 'Busca yield mínimo 5%. Thames 2100 y Monroe 3200 cumplen el criterio con 5.1% y 5.4% respectivamente.' },
    { id: uuidv4(), name: 'Roberto Kim', email: 'rkim@desarrollos.com', phone: '11-5555-2468', client_type: 'developer', budget_min_usd: 1000000, budget_max_usd: 5000000, preferred_neighborhoods: 'Palermo,Belgrano,Núñez', preferred_rooms: '4,5', pipeline_stage: 'lead', temperature: 'warm', ai_insight: 'Interesado en acceso API a datos de mercado. Candidato plan Enterprise USD 400/mes. Potencial contrato anual USD 4.800.' },
  ];
  const insertClient = db.prepare(`INSERT INTO clients (id,name,email,phone,client_type,budget_min_usd,budget_max_usd,preferred_neighborhoods,preferred_rooms,pipeline_stage,temperature,ai_insight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  seedClients.forEach(c => insertClient.run(c.id,c.name,c.email,c.phone,c.client_type,c.budget_min_usd,c.budget_max_usd,c.preferred_neighborhoods,c.preferred_rooms,c.pipeline_stage,c.temperature,c.ai_insight));

  const seedMarket = [
    { id: uuidv4(), neighborhood: 'Recoleta', avg_usd_sqm: 3210, median_days_listed: 38, active_listings: 412, absorption_rate: 42, demand_score: 88 },
    { id: uuidv4(), neighborhood: 'Palermo', avg_usd_sqm: 2940, median_days_listed: 52, active_listings: 876, absorption_rate: 31, demand_score: 91 },
    { id: uuidv4(), neighborhood: 'Belgrano', avg_usd_sqm: 2720, median_days_listed: 35, active_listings: 534, absorption_rate: 38, demand_score: 78 },
    { id: uuidv4(), neighborhood: 'Núñez', avg_usd_sqm: 2460, median_days_listed: 21, active_listings: 218, absorption_rate: 55, demand_score: 85 },
    { id: uuidv4(), neighborhood: 'Caballito', avg_usd_sqm: 2190, median_days_listed: 44, active_listings: 621, absorption_rate: 34, demand_score: 62 },
    { id: uuidv4(), neighborhood: 'Villa Urquiza', avg_usd_sqm: 1960, median_days_listed: 48, active_listings: 389, absorption_rate: 29, demand_score: 54 },
    { id: uuidv4(), neighborhood: 'Almagro', avg_usd_sqm: 1740, median_days_listed: 61, active_listings: 445, absorption_rate: 22, demand_score: 38 },
  ];
  const insertMarket = db.prepare(`INSERT INTO market_data (id,neighborhood,avg_usd_sqm,median_days_listed,active_listings,absorption_rate,demand_score) VALUES (?,?,?,?,?,?,?)`);
  seedMarket.forEach(m => insertMarket.run(m.id,m.neighborhood,m.avg_usd_sqm,m.median_days_listed,m.active_listings,m.absorption_rate,m.demand_score));

  const seedDeals = [
    { id: uuidv4(), title: 'Laura Méndez — Thames 2100', stage: 'qualifying', value_usd: 196000 },
    { id: uuidv4(), title: 'Carlos Vega — Monroe 3200', stage: 'qualifying', value_usd: 155000 },
    { id: uuidv4(), title: 'Ana Rodríguez ↔ Comprador X', stage: 'offer', value_usd: 210000 },
    { id: uuidv4(), title: 'Sofía Herrera — Cabildo 2840', stage: 'offer', value_usd: 142000 },
    { id: uuidv4(), title: 'Roberto Kim — Caballito 4amb', stage: 'lead', value_usd: 195000 },
    { id: uuidv4(), title: 'Pablo Torres — Monroe 3200', stage: 'closing', value_usd: 155000 },
    { id: uuidv4(), title: 'Verónica Salas — Belgrano 3amb', stage: 'closing', value_usd: 188000 },
    { id: uuidv4(), title: 'Diego Martín — Palermo 2amb', stage: 'closed', value_usd: 142000 },
  ];
  const insertDeal = db.prepare(`INSERT INTO pipeline_deals (id,title,stage,value_usd) VALUES (?,?,?,?)`);
  seedDeals.forEach(d => insertDeal.run(d.id,d.title,d.stage,d.value_usd));
}

// ─── AVM ENGINE ───────────────────────────────────────────────────────────────
function calculateAVM(data) {
  const { neighborhood, sqm_covered, rooms, floor, age_years, condition, has_garage, has_gym, has_pool, listed_price_usd } = data;
  const marketRow = db.prepare('SELECT * FROM market_data WHERE neighborhood = ?').get(neighborhood);
  const baseUsdSqm = marketRow ? marketRow.avg_usd_sqm : 2500;

  // Adjustment factors
  let multiplier = 1.0;
  if (condition === 'A estrenar') multiplier += 0.12;
  else if (condition === 'Muy bueno') multiplier += 0.05;
  else if (condition === 'A reciclar') multiplier -= 0.15;
  if (floor >= 7) multiplier += 0.05;
  else if (floor >= 4) multiplier += 0.02;
  else if (floor === 0) multiplier -= 0.03;
  if (has_garage) multiplier += 0.04;
  if (has_gym) multiplier += 0.02;
  if (has_pool) multiplier += 0.06;
  const ageAdj = Math.min(age_years || 0, 30) * 0.003;
  multiplier -= ageAdj;

  const estimatedUsdSqm = baseUsdSqm * multiplier;
  const estimatedValue = Math.round(estimatedUsdSqm * sqm_covered / 1000) * 1000;
  const deviationPct = listed_price_usd ? +((listed_price_usd - estimatedValue) / estimatedValue * 100).toFixed(1) : 0;
  const rangeMin = Math.round(estimatedValue * 0.97 / 1000) * 1000;
  const rangeMax = Math.round(estimatedValue * 1.05 / 1000) * 1000;
  const confidenceScore = marketRow ? 87 : 55;

  // Scores
  const demandScore = marketRow ? marketRow.demand_score : 50;
  const absorptionRate = marketRow ? marketRow.absorption_rate : 30;
  const investmentScore = Math.min(100, Math.round(
    (demandScore * 0.35) + (absorptionRate * 0.35) + ((1 - Math.max(0, deviationPct) / 100) * 30)
  ));
  const riskScore = Math.min(100, Math.round(
    (Math.max(0, deviationPct) * 1.5) + ((100 - absorptionRate) * 0.4) + 10
  ));
  const commercialScore = Math.min(100, Math.round(
    (demandScore * 0.5) + (absorptionRate * 0.3) + (Math.max(0, -deviationPct) * 0.8) + 10
  ));

  // AI Insight
  let insight = '';
  if (deviationPct > 10) {
    insight = `La propiedad está publicada un ${deviationPct}% por encima del mercado real de ${neighborhood}. Con ${marketRow?.median_days_listed || 45} días promedio de venta en la zona, el tiempo de exposición estimado supera los 90 días sin ajuste. Se recomienda revisar el precio hacia USD ${Math.round(estimatedValue * 1.02 / 1000) * 1000}–${rangeMax}.`;
  } else if (deviationPct < -5) {
    insight = `Oportunidad de mercado: propiedad ${Math.abs(deviationPct)}% por debajo del valor real de ${neighborhood}. Zona con alta demanda y absorción del ${absorptionRate}%. Tiempo estimado de venta: ${Math.round((marketRow?.median_days_listed || 35) * 0.7)} días. Score de inversión: ${investmentScore}/100.`;
  } else {
    insight = `Propiedad dentro del rango de mercado de ${neighborhood}. Condición favorable para cierre en 30–45 días. Score comercial ${commercialScore}/100 indica buena atractividad relativa en la zona.`;
  }

  return {
    estimated_value: estimatedValue,
    estimated_usd_sqm: Math.round(estimatedUsdSqm),
    listed_usd_sqm: listed_price_usd ? Math.round(listed_price_usd / sqm_covered) : null,
    deviation_pct: deviationPct,
    range_min: rangeMin,
    range_max: rangeMax,
    confidence_score: confidenceScore,
    comparables_count: Math.floor(Math.random() * 6) + 5,
    investment_score: investmentScore,
    risk_score: riskScore,
    commercial_score: commercialScore,
    ai_insight: insight,
    market_data: marketRow
  };
}

// ─── API ROUTES ───────────────────────────────────────────────────────────────

// DASHBOARD STATS
app.get('/api/dashboard', (req, res) => {
  const totalProps = db.prepare("SELECT COUNT(*) as n FROM properties WHERE status='active'").get().n;
  const totalClients = db.prepare("SELECT COUNT(*) as n FROM clients").get().n;
  const hotLeads = db.prepare("SELECT COUNT(*) as n FROM clients WHERE temperature='hot'").get().n;
  const closedDeals = db.prepare("SELECT COUNT(*) as n, SUM(value_usd) as total FROM pipeline_deals WHERE stage='closed'").get();
  const avgSqm = db.prepare("SELECT AVG(avg_usd_sqm) as avg FROM market_data").get().avg;
  const overpriced = db.prepare("SELECT COUNT(*) as n FROM properties WHERE avm_deviation_pct > 5").get().n;
  const opportunities = db.prepare("SELECT COUNT(*) as n FROM properties WHERE avm_deviation_pct < -3").get().n;
  res.json({ totalProps, totalClients, hotLeads, closedDeals: closedDeals.n, closedValue: closedDeals.total || 0, avgSqm: Math.round(avgSqm), overpriced, opportunities });
});

// PROPERTIES
app.get('/api/properties', (req, res) => {
  const props = db.prepare("SELECT * FROM properties ORDER BY created_at DESC").all();
  res.json(props);
});
app.get('/api/properties/:id', (req, res) => {
  const prop = db.prepare("SELECT * FROM properties WHERE id=?").get(req.params.id);
  if (!prop) return res.status(404).json({ error: 'Not found' });
  res.json(prop);
});
app.post('/api/properties', (req, res) => {
  const id = uuidv4();
  const d = req.body;
  const avm = calculateAVM(d);
  db.prepare(`INSERT INTO properties (id,address,neighborhood,property_type,sqm_covered,sqm_total,rooms,floor,age_years,condition,listed_price_usd,expenses_usd,has_garage,has_pool,has_gym,has_terrace,status,avm_value,avm_deviation_pct,investment_score,risk_score,commercial_score,ai_insight)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,d.address,d.neighborhood,d.property_type||'Departamento',d.sqm_covered,d.sqm_total||d.sqm_covered,d.rooms,d.floor||0,d.age_years||0,d.condition||'Reciclado',d.listed_price_usd,d.expenses_usd||0,d.has_garage?1:0,d.has_pool?1:0,d.has_gym?1:0,d.has_terrace?1:0,'active',avm.estimated_value,avm.deviation_pct,avm.investment_score,avm.risk_score,avm.commercial_score,avm.ai_insight);
  res.json({ id, ...avm });
});
app.patch('/api/properties/:id', (req, res) => {
  const fields = req.body;
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  db.prepare(`UPDATE properties SET ${sets}, updated_at=datetime('now') WHERE id=?`).run(...Object.values(fields), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/properties/:id', (req, res) => {
  db.prepare("UPDATE properties SET status='archived' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// AVM ENDPOINT (calculate without saving)
app.post('/api/avm/calculate', (req, res) => {
  const result = calculateAVM(req.body);
  res.json(result);
});

// CLIENTS
app.get('/api/clients', (req, res) => {
  const { type, temperature, stage } = req.query;
  let q = "SELECT * FROM clients WHERE 1=1";
  const params = [];
  if (type) { q += " AND client_type=?"; params.push(type); }
  if (temperature) { q += " AND temperature=?"; params.push(temperature); }
  if (stage) { q += " AND pipeline_stage=?"; params.push(stage); }
  q += " ORDER BY created_at DESC";
  res.json(db.prepare(q).all(...params));
});
app.get('/api/clients/:id', (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id=?").get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  // Matching properties
  const matches = db.prepare("SELECT * FROM properties WHERE status='active' ORDER BY investment_score DESC LIMIT 3").all();
  res.json({ ...client, matches });
});
app.post('/api/clients', (req, res) => {
  const id = uuidv4();
  const d = req.body;
  db.prepare(`INSERT INTO clients (id,name,email,phone,client_type,budget_min_usd,budget_max_usd,preferred_neighborhoods,preferred_rooms,notes,pipeline_stage,temperature)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id,d.name,d.email||'',d.phone||'',d.client_type||'buyer',d.budget_min_usd||0,d.budget_max_usd||0,d.preferred_neighborhoods||'',d.preferred_rooms||'',d.notes||'',d.pipeline_stage||'lead',d.temperature||'cold');
  res.json({ id, ok: true });
});
app.patch('/api/clients/:id', (req, res) => {
  const fields = req.body;
  const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
  db.prepare(`UPDATE clients SET ${sets} WHERE id=?`).run(...Object.values(fields), req.params.id);
  res.json({ ok: true });
});
app.delete('/api/clients/:id', (req, res) => {
  db.prepare("DELETE FROM clients WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// PIPELINE
app.get('/api/pipeline', (req, res) => {
  const stages = ['lead', 'qualifying', 'offer', 'closing', 'closed'];
  const result = {};
  stages.forEach(s => {
    result[s] = db.prepare("SELECT * FROM pipeline_deals WHERE stage=? ORDER BY created_at DESC").all(s);
  });
  res.json(result);
});
app.post('/api/pipeline', (req, res) => {
  const id = uuidv4();
  const d = req.body;
  db.prepare("INSERT INTO pipeline_deals (id,title,client_id,property_id,stage,value_usd,notes) VALUES (?,?,?,?,?,?,?)")
    .run(id,d.title,d.client_id||null,d.property_id||null,d.stage||'lead',d.value_usd||0,d.notes||'');
  res.json({ id, ok: true });
});
app.patch('/api/pipeline/:id', (req, res) => {
  const { stage } = req.body;
  db.prepare("UPDATE pipeline_deals SET stage=? WHERE id=?").run(stage, req.params.id);
  res.json({ ok: true });
});

// MARKET DATA
app.get('/api/market', (req, res) => {
  const data = db.prepare("SELECT * FROM market_data ORDER BY avg_usd_sqm DESC").all();
  const trend = [2410,2480,2510,2490,2560,2580,2620,2650,2690,2720,2790,2840];
  res.json({ neighborhoods: data, trend, avg_caba: Math.round(data.reduce((a,b)=>a+b.avg_usd_sqm,0)/data.length) });
});

// INSIGHTS
app.get('/api/insights', (req, res) => {
  const overpriced = db.prepare("SELECT * FROM properties WHERE avm_deviation_pct > 10 AND status='active' ORDER BY avm_deviation_pct DESC").all();
  const opportunities = db.prepare("SELECT * FROM properties WHERE avm_deviation_pct < -4 AND status='active' ORDER BY avm_deviation_pct ASC").all();
  const hotLeads = db.prepare("SELECT * FROM clients WHERE temperature='hot' ORDER BY created_at DESC").all();
  res.json({
    alerts: overpriced.map(p => ({ type: 'alert', title: `Sobreprecio detectado — ${p.neighborhood}`, body: `${p.address} publicada ${p.avm_deviation_pct}% sobre el mercado real. Valor estimado: USD ${p.avm_value?.toLocaleString()}. Tiempo de venta estimado: 90+ días sin ajuste.`, property: p })),
    opportunities: opportunities.map(p => ({ type: 'opportunity', title: `Oportunidad — ${p.neighborhood}`, body: `${p.address} está ${Math.abs(p.avm_deviation_pct)}% por debajo del valor real. Score de inversión: ${p.investment_score}/100.`, property: p })),
    matches: hotLeads.map(c => ({ type: 'match', title: `Match IA — ${c.name}`, body: c.ai_insight, client: c }))
  });
});

// INTERACTIONS
app.post('/api/interactions', (req, res) => {
  const id = uuidv4();
  const d = req.body;
  db.prepare("INSERT INTO interactions (id,property_id,client_id,type,notes) VALUES (?,?,?,?,?)")
    .run(id, d.property_id||null, d.client_id||null, d.type||'note', d.notes||'');
  res.json({ id, ok: true });
});
app.get('/api/interactions', (req, res) => {
  const { client_id, property_id } = req.query;
  let q = "SELECT * FROM interactions WHERE 1=1";
  const params = [];
  if (client_id) { q += " AND client_id=?"; params.push(client_id); }
  if (property_id) { q += " AND property_id=?"; params.push(property_id); }
  q += " ORDER BY created_at DESC LIMIT 20";
  res.json(db.prepare(q).all(...params));
});

// Catch-all → SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Inteliprop corriendo en http://localhost:${PORT}`));
