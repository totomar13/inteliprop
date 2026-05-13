from flask import Flask, jsonify, request, send_from_directory
import sqlite3, json, uuid, os, math
from datetime import datetime

app = Flask(__name__, static_folder='frontend/public', static_url_path='')
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'inteliprop.db')

os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)

# ─── DB ───────────────────────────────────────────────────────────────────────
def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    db.executescript("""
    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY, address TEXT, neighborhood TEXT, property_type TEXT DEFAULT 'Departamento',
        sqm_covered REAL, sqm_total REAL, rooms INTEGER, floor INTEGER DEFAULT 0,
        age_years INTEGER DEFAULT 0, condition TEXT DEFAULT 'Reciclado',
        listed_price_usd REAL, expenses_usd REAL DEFAULT 0,
        has_garage INTEGER DEFAULT 0, has_pool INTEGER DEFAULT 0,
        has_gym INTEGER DEFAULT 0, has_terrace INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active', days_on_market INTEGER DEFAULT 0,
        avm_value REAL, avm_deviation_pct REAL,
        investment_score REAL, risk_score REAL, commercial_score REAL,
        ai_insight TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT,
        client_type TEXT DEFAULT 'buyer', budget_min_usd REAL DEFAULT 0,
        budget_max_usd REAL DEFAULT 0, preferred_neighborhoods TEXT, preferred_rooms TEXT,
        notes TEXT, pipeline_stage TEXT DEFAULT 'lead', temperature TEXT DEFAULT 'cold',
        ai_insight TEXT, last_contact TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY, property_id TEXT, client_id TEXT,
        type TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS market_data (
        id TEXT PRIMARY KEY, neighborhood TEXT, avg_usd_sqm REAL,
        median_days_listed INTEGER, active_listings INTEGER,
        absorption_rate REAL, demand_score REAL,
        recorded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pipeline_deals (
        id TEXT PRIMARY KEY, title TEXT, client_id TEXT, property_id TEXT,
        stage TEXT DEFAULT 'lead', value_usd REAL DEFAULT 0,
        notes TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    """)
    db.commit()

    if db.execute("SELECT COUNT(*) FROM properties").fetchone()[0] == 0:
        seed(db)
    db.close()

def seed(db):
    props = [
        (str(uuid.uuid4()),'Av. Santa Fe 3200','Palermo',72,3,6,12,'Reciclado',220000,1,0,1,187000,17.6,62,74,55,'active',42,'La propiedad está publicada 17.6% por encima del mercado real de Palermo. Con sobreoferta actual del 23% en la zona, el tiempo estimado de venta supera los 90 días sin ajuste de precio. Se recomienda revisar hacia USD 193k–196k.'),
        (str(uuid.uuid4()),'Cabildo 2840','Belgrano',55,2,3,8,'Muy bueno',142000,0,0,0,151000,-6.3,84,22,88,'active',8,'Excelente oportunidad. Propiedad 6.3% por debajo del valor real de Belgrano. Alta liquidez en zona, tiempo promedio de venta 21 días. Score de inversión 84/100.'),
        (str(uuid.uuid4()),'Rivadavia 5100','Caballito',98,4,0,20,'Reciclado',195000,1,0,0,193000,1.1,76,31,72,'active',15,'Propiedad dentro del rango de mercado. Caballito mantiene demanda estable. Buen candidato para cierre en 30–45 días sin ajuste necesario.'),
        (str(uuid.uuid4()),'Triunvirato 4700','Villa Urquiza',80,3,4,15,'Reciclado',168000,0,0,0,159000,5.7,58,48,61,'active',29,'Leve sobreprecio del 5.7%. Villa Urquiza muestra crecimiento del 12% interanual. Ajuste a USD 162k aceleraría el cierre.'),
        (str(uuid.uuid4()),'Monroe 3200','Núñez',60,2,8,5,'Muy bueno',155000,1,0,1,162000,-4.5,88,18,91,'active',5,'Mejor oportunidad de la cartera. Núñez con apreciación del 8.3% anual y demanda 40% superior a oferta. Tiempo medio de venta: 21 días. Altamente recomendado.'),
        (str(uuid.uuid4()),'Thames 2100','Palermo',74,3,7,4,'A estrenar',196000,1,1,1,199000,-1.5,79,28,82,'active',11,'A estrenar con amenities premium. Precio levemente debajo del mercado, favorece cierre rápido. Perfil comprador: inversor renta o familia premium.'),
    ]
    db.executemany("INSERT INTO properties (id,address,neighborhood,sqm_covered,rooms,floor,age_years,condition,listed_price_usd,has_garage,has_pool,has_gym,avm_value,avm_deviation_pct,investment_score,risk_score,commercial_score,status,days_on_market,ai_insight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", props)

    clients = [
        (str(uuid.uuid4()),'Laura Méndez','laura@email.com','11-5555-1234','buyer',170000,200000,'Palermo,Belgrano','3','qualifying','hot','Coincide con 3 propiedades en cartera. Altamente probable cierre en 30 días. Score de match: 92%.'),
        (str(uuid.uuid4()),'Carlos Vega','cvega@invest.com','11-5555-5678','investor',300000,500000,'Núñez,Belgrano','2,3','qualifying','hot','Inversor multi-propiedad. Score cartera 78/100. Rentabilidad estimada 5.2% anual. Candidato ideal para Monroe 3200.'),
        (str(uuid.uuid4()),'Ana Rodríguez','ana@mail.com','11-5555-9012','seller',195000,220000,'Palermo','3','offer','warm','Propietaria con expectativa 17.6% sobre mercado. Recomendar ajuste gradual a USD 195k con argumentación de datos.'),
        (str(uuid.uuid4()),'Martín Lozano','mlozano@gmail.com','11-5555-3456','buyer',90000,130000,'Caballito,Almagro','2,3','lead','cold','Sin actividad en 12 días. Recomendación: recontactar con novedades de Caballito.'),
        (str(uuid.uuid4()),'Sofía Herrera','sofia@inversiones.com','11-5555-7890','investor',150000,250000,'Palermo,Recoleta','2','qualifying','hot','Busca yield mínimo 5%. Thames 2100 y Monroe 3200 cumplen el criterio con 5.1% y 5.4% respectivamente.'),
        (str(uuid.uuid4()),'Roberto Kim','rkim@desarrollos.com','11-5555-2468','developer',1000000,5000000,'Palermo,Belgrano,Núñez','4,5','lead','warm','Interesado en acceso API a datos de mercado. Candidato plan Enterprise USD 400/mes.'),
    ]
    db.executemany("INSERT INTO clients (id,name,email,phone,client_type,budget_min_usd,budget_max_usd,preferred_neighborhoods,preferred_rooms,pipeline_stage,temperature,ai_insight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", clients)

    market = [
        (str(uuid.uuid4()),'Recoleta',3210,38,412,42,88),
        (str(uuid.uuid4()),'Palermo',2940,52,876,31,91),
        (str(uuid.uuid4()),'Belgrano',2720,35,534,38,78),
        (str(uuid.uuid4()),'Núñez',2460,21,218,55,85),
        (str(uuid.uuid4()),'Caballito',2190,44,621,34,62),
        (str(uuid.uuid4()),'Villa Urquiza',1960,48,389,29,54),
        (str(uuid.uuid4()),'Almagro',1740,61,445,22,38),
    ]
    db.executemany("INSERT INTO market_data (id,neighborhood,avg_usd_sqm,median_days_listed,active_listings,absorption_rate,demand_score) VALUES (?,?,?,?,?,?,?)", market)

    deals = [
        (str(uuid.uuid4()),'Laura Méndez — Thames 2100','qualifying',196000),
        (str(uuid.uuid4()),'Carlos Vega — Monroe 3200','qualifying',155000),
        (str(uuid.uuid4()),'Ana Rodríguez ↔ Comprador X','offer',210000),
        (str(uuid.uuid4()),'Sofía Herrera — Cabildo 2840','offer',142000),
        (str(uuid.uuid4()),'Roberto Kim — Caballito 4amb','lead',195000),
        (str(uuid.uuid4()),'Pablo Torres — Monroe 3200','closing',155000),
        (str(uuid.uuid4()),'Verónica Salas — Belgrano 3amb','closing',188000),
        (str(uuid.uuid4()),'Diego Martín — Palermo 2amb','closed',142000),
    ]
    db.executemany("INSERT INTO pipeline_deals (id,title,stage,value_usd) VALUES (?,?,?,?)", deals)
    db.commit()

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ─── AVM ENGINE ───────────────────────────────────────────────────────────────
def calculate_avm(data):
    neighborhood = data.get('neighborhood','Palermo')
    sqm = float(data.get('sqm_covered', 70) or 70)
    floor_ = int(data.get('floor', 0) or 0)
    age = int(data.get('age_years', 10) or 10)
    condition = data.get('condition','Reciclado')
    has_garage = int(data.get('has_garage', 0) or 0)
    has_gym = int(data.get('has_gym', 0) or 0)
    has_pool = int(data.get('has_pool', 0) or 0)
    listed = float(data.get('listed_price_usd', 0) or 0)

    db = get_db()
    market = row_to_dict(db.execute("SELECT * FROM market_data WHERE neighborhood=?", (neighborhood,)).fetchone())
    db.close()

    base_sqm = market['avg_usd_sqm'] if market else 2500

    mult = 1.0
    if condition == 'A estrenar': mult += 0.12
    elif condition == 'Muy bueno': mult += 0.05
    elif condition == 'A reciclar': mult -= 0.15
    if floor_ >= 7: mult += 0.05
    elif floor_ >= 4: mult += 0.02
    elif floor_ == 0: mult -= 0.03
    if has_garage: mult += 0.04
    if has_gym: mult += 0.02
    if has_pool: mult += 0.06
    mult -= min(age, 30) * 0.003

    est_sqm = base_sqm * mult
    est_value = round(est_sqm * sqm / 1000) * 1000
    deviation = round((listed - est_value) / est_value * 100, 1) if listed else 0
    range_min = round(est_value * 0.97 / 1000) * 1000
    range_max = round(est_value * 1.05 / 1000) * 1000
    confidence = 87 if market else 55

    demand = market['demand_score'] if market else 50
    absorption = market['absorption_rate'] if market else 30
    days_avg = market['median_days_listed'] if market else 45

    inv_score = min(100, int(demand*0.35 + absorption*0.35 + (1-max(0,deviation)/100)*30))
    risk_score = min(100, int(max(0,deviation)*1.5 + (100-absorption)*0.4 + 10))
    comm_score = min(100, int(demand*0.5 + absorption*0.3 + max(0,-deviation)*0.8 + 10))

    if deviation > 10:
        insight = f"La propiedad está publicada un {deviation}% por encima del mercado real de {neighborhood}. Con {days_avg} días promedio de venta en la zona, el tiempo de exposición estimado supera los 90 días sin ajuste. Se recomienda revisar el precio hacia USD {round(est_value*1.02/1000)*1000:,}–{range_max:,}."
    elif deviation < -5:
        insight = f"Oportunidad de mercado: propiedad {abs(deviation)}% por debajo del valor real de {neighborhood}. Zona con alta demanda y absorción del {absorption}%. Tiempo estimado de venta: {round(days_avg*0.7)} días. Score de inversión: {inv_score}/100."
    else:
        insight = f"Propiedad dentro del rango de mercado de {neighborhood}. Condición favorable para cierre en 30–45 días. Score comercial {comm_score}/100 indica buena atractividad relativa en la zona."

    import random
    return {
        'estimated_value': est_value,
        'estimated_usd_sqm': round(est_sqm),
        'listed_usd_sqm': round(listed/sqm) if listed and sqm else None,
        'deviation_pct': deviation,
        'range_min': range_min,
        'range_max': range_max,
        'confidence_score': confidence,
        'comparables_count': random.randint(5,10),
        'investment_score': inv_score,
        'risk_score': risk_score,
        'commercial_score': comm_score,
        'ai_insight': insight,
        'market_data': market
    }

# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory('frontend/public', 'index.html')

@app.route('/api/dashboard')
def dashboard():
    db = get_db()
    total_props = db.execute("SELECT COUNT(*) FROM properties WHERE status='active'").fetchone()[0]
    total_clients = db.execute("SELECT COUNT(*) FROM clients").fetchone()[0]
    hot_leads = db.execute("SELECT COUNT(*) FROM clients WHERE temperature='hot'").fetchone()[0]
    closed = db.execute("SELECT COUNT(*), COALESCE(SUM(value_usd),0) FROM pipeline_deals WHERE stage='closed'").fetchone()
    avg_sqm = db.execute("SELECT AVG(avg_usd_sqm) FROM market_data").fetchone()[0] or 0
    overpriced = db.execute("SELECT COUNT(*) FROM properties WHERE avm_deviation_pct > 5").fetchone()[0]
    opportunities = db.execute("SELECT COUNT(*) FROM properties WHERE avm_deviation_pct < -3").fetchone()[0]
    db.close()
    return jsonify({'totalProps':total_props,'totalClients':total_clients,'hotLeads':hot_leads,'closedDeals':closed[0],'closedValue':closed[1],'avgSqm':round(avg_sqm),'overpriced':overpriced,'opportunities':opportunities})

@app.route('/api/properties', methods=['GET','POST'])
def properties():
    db = get_db()
    if request.method == 'GET':
        rows = rows_to_list(db.execute("SELECT * FROM properties WHERE status='active' ORDER BY created_at DESC").fetchall())
        db.close()
        return jsonify(rows)
    d = request.json
    avm = calculate_avm(d)
    id_ = str(uuid.uuid4())
    db.execute("INSERT INTO properties (id,address,neighborhood,property_type,sqm_covered,sqm_total,rooms,floor,age_years,condition,listed_price_usd,expenses_usd,has_garage,has_pool,has_gym,has_terrace,status,avm_value,avm_deviation_pct,investment_score,risk_score,commercial_score,ai_insight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (id_,d.get('address',''),d.get('neighborhood',''),d.get('property_type','Departamento'),d.get('sqm_covered'),d.get('sqm_total',d.get('sqm_covered')),d.get('rooms'),d.get('floor',0),d.get('age_years',0),d.get('condition','Reciclado'),d.get('listed_price_usd'),d.get('expenses_usd',0),d.get('has_garage',0),d.get('has_pool',0),d.get('has_gym',0),d.get('has_terrace',0),'active',avm['estimated_value'],avm['deviation_pct'],avm['investment_score'],avm['risk_score'],avm['commercial_score'],avm['ai_insight']))
    db.commit(); db.close()
    return jsonify({'id':id_,**avm})

@app.route('/api/properties/<id>', methods=['GET','PATCH','DELETE'])
def property_detail(id):
    db = get_db()
    if request.method == 'GET':
        row = row_to_dict(db.execute("SELECT * FROM properties WHERE id=?", (id,)).fetchone())
        db.close()
        return jsonify(row) if row else ('Not found',404)
    if request.method == 'PATCH':
        d = request.json
        sets = ','.join(f"{k}=?" for k in d)
        db.execute(f"UPDATE properties SET {sets},updated_at=datetime('now') WHERE id=?", (*d.values(),id))
        db.commit(); db.close(); return jsonify({'ok':True})
    db.execute("UPDATE properties SET status='archived' WHERE id=?", (id,))
    db.commit(); db.close(); return jsonify({'ok':True})

@app.route('/api/avm/calculate', methods=['POST'])
def avm_calculate():
    return jsonify(calculate_avm(request.json))

@app.route('/api/clients', methods=['GET','POST'])
def clients():
    db = get_db()
    if request.method == 'GET':
        q = "SELECT * FROM clients WHERE 1=1"
        params = []
        for k in ['client_type','temperature','pipeline_stage']:
            v = request.args.get(k)
            if v: q += f" AND {k}=?"; params.append(v)
        rows = rows_to_list(db.execute(q+" ORDER BY created_at DESC", params).fetchall())
        db.close(); return jsonify(rows)
    d = request.json; id_ = str(uuid.uuid4())
    db.execute("INSERT INTO clients (id,name,email,phone,client_type,budget_min_usd,budget_max_usd,preferred_neighborhoods,preferred_rooms,notes,pipeline_stage,temperature) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (id_,d.get('name',''),d.get('email',''),d.get('phone',''),d.get('client_type','buyer'),d.get('budget_min_usd',0),d.get('budget_max_usd',0),d.get('preferred_neighborhoods',''),d.get('preferred_rooms',''),d.get('notes',''),d.get('pipeline_stage','lead'),d.get('temperature','cold')))
    db.commit(); db.close(); return jsonify({'id':id_,'ok':True})

@app.route('/api/clients/<id>', methods=['GET','PATCH','DELETE'])
def client_detail(id):
    db = get_db()
    if request.method == 'GET':
        client = row_to_dict(db.execute("SELECT * FROM clients WHERE id=?", (id,)).fetchone())
        if not client: db.close(); return ('Not found',404)
        matches = rows_to_list(db.execute("SELECT * FROM properties WHERE status='active' ORDER BY investment_score DESC LIMIT 3").fetchall())
        db.close(); return jsonify({**client,'matches':matches})
    if request.method == 'PATCH':
        d = request.json
        sets = ','.join(f"{k}=?" for k in d)
        db.execute(f"UPDATE clients SET {sets} WHERE id=?", (*d.values(),id))
        db.commit(); db.close(); return jsonify({'ok':True})
    db.execute("DELETE FROM clients WHERE id=?", (id,))
    db.commit(); db.close(); return jsonify({'ok':True})

@app.route('/api/pipeline', methods=['GET','POST'])
def pipeline():
    db = get_db()
    if request.method == 'GET':
        result = {}
        for s in ['lead','qualifying','offer','closing','closed']:
            result[s] = rows_to_list(db.execute("SELECT * FROM pipeline_deals WHERE stage=? ORDER BY created_at DESC", (s,)).fetchall())
        db.close(); return jsonify(result)
    d = request.json; id_ = str(uuid.uuid4())
    db.execute("INSERT INTO pipeline_deals (id,title,client_id,property_id,stage,value_usd,notes) VALUES (?,?,?,?,?,?,?)",
        (id_,d.get('title',''),d.get('client_id'),d.get('property_id'),d.get('stage','lead'),d.get('value_usd',0),d.get('notes','')))
    db.commit(); db.close(); return jsonify({'id':id_,'ok':True})

@app.route('/api/pipeline/<id>', methods=['PATCH'])
def pipeline_update(id):
    db = get_db()
    d = request.json
    sets = ','.join(f"{k}=?" for k in d)
    db.execute(f"UPDATE pipeline_deals SET {sets} WHERE id=?", (*d.values(),id))
    db.commit(); db.close(); return jsonify({'ok':True})

@app.route('/api/market')
def market():
    db = get_db()
    neighborhoods = rows_to_list(db.execute("SELECT * FROM market_data ORDER BY avg_usd_sqm DESC").fetchall())
    db.close()
    trend = [2410,2480,2510,2490,2560,2580,2620,2650,2690,2720,2790,2840]
    avg_caba = round(sum(n['avg_usd_sqm'] for n in neighborhoods)/len(neighborhoods)) if neighborhoods else 2500
    return jsonify({'neighborhoods':neighborhoods,'trend':trend,'avg_caba':avg_caba})

@app.route('/api/insights')
def insights():
    db = get_db()
    overpriced = rows_to_list(db.execute("SELECT * FROM properties WHERE avm_deviation_pct > 10 AND status='active' ORDER BY avm_deviation_pct DESC").fetchall())
    opportunities = rows_to_list(db.execute("SELECT * FROM properties WHERE avm_deviation_pct < -4 AND status='active' ORDER BY avm_deviation_pct ASC").fetchall())
    hot_leads = rows_to_list(db.execute("SELECT * FROM clients WHERE temperature='hot' ORDER BY created_at DESC").fetchall())
    db.close()
    return jsonify({
        'alerts': [{'type':'alert','title':f"Sobreprecio detectado — {p['neighborhood']}",'body':f"{p['address']} publicada {p['avm_deviation_pct']}% sobre el mercado real. Valor estimado: USD {p['avm_value']:,.0f}. Ajuste recomendado para acelerar cierre.",'property':p} for p in overpriced],
        'opportunities': [{'type':'opportunity','title':f"Oportunidad — {p['neighborhood']}",'body':f"{p['address']} está {abs(p['avm_deviation_pct'])}% por debajo del valor real. Score de inversión: {p['investment_score']}/100. Alta liquidez en zona.",'property':p} for p in opportunities],
        'matches': [{'type':'match','title':f"Match IA — {c['name']}",'body':c['ai_insight'],'client':c} for c in hot_leads]
    })

@app.route('/api/interactions', methods=['GET','POST'])
def interactions():
    db = get_db()
    if request.method == 'GET':
        q = "SELECT * FROM interactions WHERE 1=1"
        params = []
        for k in ['client_id','property_id']:
            v = request.args.get(k)
            if v: q += f" AND {k}=?"; params.append(v)
        rows = rows_to_list(db.execute(q+" ORDER BY created_at DESC LIMIT 20", params).fetchall())
        db.close(); return jsonify(rows)
    d = request.json; id_ = str(uuid.uuid4())
    db.execute("INSERT INTO interactions (id,property_id,client_id,type,notes) VALUES (?,?,?,?,?)",
        (id_,d.get('property_id'),d.get('client_id'),d.get('type','note'),d.get('notes','')))
    db.commit(); db.close(); return jsonify({'id':id_,'ok':True})

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 3000))
    print(f"Inteliprop corriendo en http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
