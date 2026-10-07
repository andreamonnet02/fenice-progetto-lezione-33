# Dal progetto della lezione 33 al database e al deploy

In questa esercitazione collegherai il progetto della lezione 33 a Neon tramite Vercel e lo pubblicherai online. **Mantieni tutte le funzioni già presenti:** registrazione degli studenti, accesso, area privata, profilo, catalogo, iscrizioni ai corsi e gestione amministratore.

Il database contiene tre tabelle:
- `studenti`: profili e password trasformate in hash;
- `corsi`: catalogo dei corsi;
- `iscrizioni`: richieste e collegamenti tra studenti e corsi.

Non eliminerai il login e non sostituirai il modulo di registrazione con un semplice form pubblico.

## 1. Scarica il progetto con git clone

Il progetto iniziale è disponibile nel repository pubblico [fenice-progetto-lezione-33](https://github.com/sfilangio01/fenice-progetto-lezione-33). Contiene il codice della lezione 33, ancora basato sui file JSON: non è già collegato a Neon o Vercel. Le istruzioni e il codice da aggiungere sono in questa guida.

Installa Git, Node.js 24 e VS Code se non li hai già. Su macOS, se il comando `git` propone di installare gli strumenti da riga di comando, completa l'installazione prima di proseguire. Apri un terminale e verifica:

```bash
node --version
npm --version
git --version
```

Usa Node.js 24. Se usi nvm:

```bash
nvm install 24
nvm use 24
```

Spostati nella cartella dove vuoi creare il progetto. Se usi macOS e vuoi lavorare sul Desktop:

```bash
cd ~/Desktop
git clone https://github.com/sfilangio01/fenice-progetto-lezione-33.git progetto_completo_json_a_db
cd progetto_completo_json_a_db
git remote -v
```

`git clone` crea la cartella e scarica i file. Nell'ultimo comando vedrai `origin` collegato al repository pubblico del corso: è normale. Non devi avere accesso in scrittura al repository del docente per scaricarlo.

Se `progetto_completo_json_a_db` esiste già, non cancellarla e non clonare dentro quella cartella. Scegli un nuovo nome, per esempio:

```bash
git clone https://github.com/sfilangio01/fenice-progetto-lezione-33.git progetto_fenice_esercitazione
cd progetto_fenice_esercitazione
```

Usa una sola delle due sequenze di clonazione, non entrambe. Tutti i comandi successivi vanno eseguiti nel terminale di questa cartella, dove trovi `package.json` e `server.js`.

Apri VS Code e scegli **File > Apri cartella**, selezionando la cartella appena clonata. Poi apri **Terminale > Nuovo terminale**. Se il comando `code` è già disponibile nel tuo terminale, puoi aprirla anche con `code .`.

Nel repository troverai `server.js`, `package.json`, `package-lock.json`, `public`, `data`, `.gitignore` e questa guida. Non troverai `.env`, `node_modules`, `db`, `pages` o `scripts`: li preparerai durante l'esercitazione. Gli utenti e le iscrizioni iniziali sono vuoti per non distribuire dati o password di prova; il catalogo contiene quattro corsi dimostrativi. Registra un nuovo studente con dati inventati quando proverai il progetto.

Installa le dipendenze iniziali dalla cartella clonata:

```bash
npm ci
```

Per vedere il punto di partenza, esegui `npm start` e apri `http://localhost:3000`. Questa versione salva ancora nei JSON: non pubblicarla online così com'è. Ferma il server con **Ctrl+C** prima di continuare. Se la porta 3000 è già occupata, ferma il tuo precedente server senza terminare processi che non riconosci.

Il codice iniziale legge e scrive `data/utenti.json`, `data/iscrizioni.json` e `data/corsi.json`. Nei passaggi successivi sostituirai queste operazioni con query SQL. I file JSON serviranno per importare i dati iniziali, non per salvare i nuovi dati dopo la migrazione.

## 2. Crea Neon dal Marketplace Vercel

1. Apri [Vercel](https://vercel.com) e accedi con GitHub.
2. Seleziona l'account/team che userai per il progetto.
3. Apri **Integrations > Browse Marketplace** e cerca [Neon](https://vercel.com/marketplace/neon).
4. Se Neon non è ancora installato, premi **Install** e segui la procedura per creare o collegare il tuo account Neon. Se l'integrazione è già presente, aprila e crea una nuova risorsa: non creare un secondo account.
5. Scegli il piano gratuito, se disponibile, e controlla limiti e costi prima di confermare.
6. Scegli la regione e il nome del database. Se trovi l'opzione **Auth** attiva, disattivala prima di creare la risorsa. Il progetto mantiene il proprio sistema di registrazione e login: non usa Neon Auth.
7. Conferma la creazione. Se viene proposto subito **Connect to Project**, rimanda il collegamento al punto 13: il progetto web non è ancora stato importato su Vercel.
8. Apri la risorsa nella sezione **Storage** e controlla nome e piano selezionati.
9. Apri la sezione **Quickstart** della risorsa oppure **Open in Neon > Connect**. Copia la stringa completa **pooled** indicata come `DATABASE_URL`, non quella unpooled.

Se **Open in Neon** richiede di verificare l'email, apri il messaggio di attivazione Neon, conferma l'indirizzo e torna alla console. Se Vercel mostra **Reauthenticate** prima di leggere la connessione, completa personalmente la verifica richiesta, poi riprendi da dove eri rimasto. Non disattivare le protezioni dell'account.

Non creare un secondo database separatamente. La stringa contiene una password: non condividerla e non mostrarla nelle schermate.

## 3. Installa i pacchetti necessari

```bash
npm uninstall express-session
npm install pg@8.23.1 cookie-session@2.1.1
npm pkg set 'engines.node=>=22'
npm pkg set 'scripts.start=node server.js'
npm pkg set 'scripts.db:seed=node scripts/db-seed.js'
```

`pg` esegue le query SQL. `cookie-session` conserva un piccolo cookie firmato per l'accesso, invece delle sessioni in memoria del vecchio server. Il login rimane.

Npm aggiorna `package.json` e `package-lock.json`: conserva entrambi. Non aggiungere o rimuovere script di test per seguire questa guida.

## 4. Proteggi le pagine riservate

Il contenuto di `public` è pubblico anche su Vercel. Le pagine riservate vanno spostate, non duplicate:

```bash
mkdir -p pages db scripts
mv public/area-personale.html pages/area-personale.html
mv public/gestione-iscrizioni.html pages/gestione-iscrizioni.html
mv public/iscrizione-corso.html pages/iscrizione-corso.html
```

Esegui gli spostamenti una sola volta. Se i file sono già in `pages`, non ripeterli.

Lascia in `public`:
- home, portfolio, catalogo, registrazione, login e conferma;
- CSS, immagini e altri file pubblici.

**Non modificare i link, la navigazione o il form di registrazione.** `public/iscrizione.html` deve continuare a inviare a `POST /registrazione`, con nome, cognome, email, username, password, esperienza, competenze e bio. Il server servirà le pagine spostate solo dopo il controllo dell'accesso.

## 5. Crea le tre tabelle

In VS Code, nella cartella `db` creata al punto 4, crea un nuovo file chiamato `schema.sql`. Copia nel file tutte le query riportate qui sotto e salva. Il file non è già presente nel progetto iniziale: lo creerai durante questa esercitazione.

Usa un database nuovo per questo schema. Se avevi creato la precedente versione con la sola tabella del form, non riutilizzarla: `CREATE TABLE IF NOT EXISTS` non modifica le colonne di una tabella già esistente. Conserva il vecchio database e crea una nuova risorsa per questa esercitazione.

```sql
CREATE TABLE IF NOT EXISTS corsi (
  id TEXT PRIMARY KEY,
  titolo TEXT NOT NULL,
  descrizione TEXT NOT NULL,
  level TEXT NOT NULL,
  durata TEXT NOT NULL,
  modalita TEXT NOT NULL,
  prezzo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS studenti (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  competenze TEXT NOT NULL,
  bio TEXT NOT NULL,
  esperienza TEXT NOT NULL CHECK (esperienza IN ('principiante', 'intermedio', 'avanzato')),
  data_registrazione TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iscrizioni (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cognome TEXT,
  email TEXT NOT NULL,
  esperienza TEXT,
  messaggio TEXT,
  studente_id TEXT REFERENCES studenti(id) ON DELETE SET NULL,
  corso_id TEXT REFERENCES corsi(id),
  corso_titolo TEXT,
  corso_livello TEXT,
  data_iscrizione TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (studente_id, corso_id)
);
```

1. Da **Vercel > Storage** apri il database creato.
2. Premi **Open in Neon**. Se richiesto, completa la verifica dell'email descritta al punto 2.
3. Nella console Neon apri **Postgres > SQL Editor**; se il menu Postgres è chiuso, espandilo. I nomi delle voci possono variare leggermente.
4. Seleziona il branch principale e lo stesso database della tua stringa di connessione, normalmente `neondb`.
5. Incolla tutto il contenuto di `db/schema.sql` e premi **Run**.
6. Attendi l'esito positivo delle tre istruzioni. Se una query restituisce un errore, non proseguire con l'importazione dei dati prima di averlo risolto.

`studente_id` collega un'iscrizione a `studenti.id`; `corso_id` la collega a `corsi.id`. Le richieste del form generico possono avere entrambi i campi vuoti. Il vincolo `UNIQUE (studente_id, corso_id)` impedisce di iscrivere due volte lo stesso studente allo stesso corso.

## 6. Configura le variabili private

Crea `.env.example`, nella stessa cartella di `package.json`, con:

```dotenv
DATABASE_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
```

Crea `.env` nella stessa cartella:

```dotenv
DATABASE_URL=LA_TUA_STRINGA_NEON_COMPLETA
ADMIN_USERNAME=IL_TUO_NOME_ADMIN
ADMIN_PASSWORD=LA_TUA_PASSWORD_ADMIN
SESSION_SECRET=IL_TUO_SEGRETO_CASUALE
```

Genera password amministratore e segreto separatamente, senza condividerli:

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Il primo risultato può essere usato come `ADMIN_PASSWORD`; il secondo come `SESSION_SECRET`. Non usare `admin123` o `secret-session` online.

Crea o aggiorna `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
.vercel/
.DS_Store
archivio/
```

Non inserire i valori privati in `.env.example`.

## 7. Crea la connessione al database

Crea `db/pool.js`:

```javascript
import pg from 'pg';

export function createPool({ connectionString = process.env.DATABASE_URL } = {}) {
  if (!connectionString) throw new Error('Inserisci DATABASE_URL nel file .env.');
  const url = new URL(connectionString);
  if (url.hostname.endsWith('.neon.tech')) url.searchParams.set('sslmode', 'verify-full');
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 5,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', error => console.error('Errore database:', error.code));
  return pool;
}
```

Questo file legge `DATABASE_URL` e mantiene un numero limitato di connessioni. Non mettere la stringa di connessione dentro il codice.

## 8. Sostituisci il server mantenendo le funzioni esistenti

Apri `server.js` e sostituisci tutto il contenuto con:

```javascript
import express from 'express';
import cookieSession from 'cookie-session';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db/pool.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const privateDir = path.join(__dirname, 'pages');
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const USER_LEVELS = ['principiante', 'intermedio', 'avanzato'];
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-session-secret';

const parseString = (value) => (typeof value === 'string' ? value.trim() : '');
const createId = () => crypto.randomUUID();
export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};
const verifyPassword = (password, stored) => {
  if (typeof stored !== 'string') return false;
  const parts = stored.split(':');
  const actual = parts[0] === 'scrypt' && parts.length === 3
    ? crypto.scryptSync(password, parts[1], 64)
    : crypto.createHash('sha256').update(password).digest();
  const expected = Buffer.from(parts[0] === 'scrypt' ? parts[2] || '' : stored, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const normalizeUserRow = (row) => ({
  id: row.id,
  nome: row.nome,
  cognome: row.cognome,
  email: row.email,
  username: row.username,
  passwordHash: row.password_hash,
  competenze: row.competenze,
  bio: row.bio,
  esperienza: row.esperienza,
  dataRegistrazione: row.data_registrazione,
});

const normalizeCourseRow = (row) => ({
  id: row.id,
  titolo: row.titolo,
  descrizione: row.descrizione,
  level: row.level,
  durata: row.durata,
  modalita: row.modalita,
  prezzo: row.prezzo,
});

const normalizeEnrollmentRow = (row) => ({
  id: row.id,
  nome: row.nome,
  cognome: row.cognome,
  email: row.email,
  esperienza: row.esperienza,
  messaggio: row.messaggio,
  userId: row.studente_id,
  courseId: row.corso_id,
  corso: row.corso_titolo ?? row.corso,
  livello: row.corso_livello ?? row.livello,
  dataIscrizione: row.data_iscrizione,
});

function validateRuntimeConfig() {
  if (!isProduction) {
    return;
  }

  const required = ['DATABASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SESSION_SECRET'];
  for (const variable of required) {
    if (!process.env[variable]) {
      throw new Error(`Variabile obbligatoria mancante in produzione: ${variable}`);
    }
  }
  if (ADMIN_PASSWORD === 'admin123' || SESSION_SECRET === 'development-session-secret' || SESSION_SECRET === 'secret-session' || SESSION_SECRET.length < 32) {
    throw new Error('Configura credenziali diverse da quelle predefinite e un SESSION_SECRET di almeno 32 caratteri prima di pubblicare il progetto.');
  }
}

export function createRepository({ connectionString = process.env.DATABASE_URL, pool = null } = {}) {
  if (!connectionString && !pool) {
    throw new Error('La variabile DATABASE_URL è necessaria per collegarsi a PostgreSQL.');
  }

  const connectionPool = pool ?? createPool({ connectionString });

  return {
    pool: connectionPool,
    async getCourses() {
      const { rows } = await connectionPool.query(
        `SELECT id, titolo, descrizione, level, durata, modalita, prezzo
         FROM corsi ORDER BY id ASC`,
      );
      return rows.map(normalizeCourseRow);
    },

    async findUserById(id) {
      const { rows } = await connectionPool.query(
        `SELECT * FROM studenti WHERE id = $1 LIMIT 1`,
        [id],
      );
      return rows[0] ? normalizeUserRow(rows[0]) : null;
    },

    async findUserByUsername(username) {
      const normalized = parseString(username);
      if (!normalized) {
        return null;
      }

      const { rows } = await connectionPool.query(
        `SELECT * FROM studenti WHERE LOWER(username) = LOWER($1) LIMIT 1`,
        [normalized],
      );
      return rows[0] ? normalizeUserRow(rows[0]) : null;
    },

    async findUserByEmail(email) {
      const normalized = parseString(email);
      if (!normalized) {
        return null;
      }

      const { rows } = await connectionPool.query(
        `SELECT * FROM studenti WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normalized],
      );
      return rows[0] ? normalizeUserRow(rows[0]) : null;
    },

    async createUser(user) {
      const id = user.id ?? createId();
      const passwordHash = user.passwordHash ?? hashPassword(user.password ?? '');

      await connectionPool.query(
        `INSERT INTO studenti (id, nome, cognome, email, username, password_hash, competenze, bio, esperienza, data_registrazione)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          user.nome,
          user.cognome,
          user.email,
          user.username,
          passwordHash,
          user.competenze,
          user.bio,
          user.esperienza,
          user.dataRegistrazione ?? new Date().toISOString(),
        ],
      );

      return this.findUserById(id);
    },

    async updateUser(id, updates) {
      const current = await this.findUserById(id);
      if (!current) {
        return null;
      }

      const next = {
        ...current,
        ...updates,
      };

      await connectionPool.query(
        `UPDATE studenti
         SET nome = $2,
             cognome = $3,
             email = $4,
             username = $5,
             password_hash = COALESCE($6, password_hash),
             competenze = $7,
             bio = $8,
             esperienza = $9
         WHERE id = $1`,
        [
          id,
          next.nome,
          next.cognome,
          next.email,
          next.username,
          updates.passwordHash ?? null,
          next.competenze,
          next.bio,
          next.esperienza,
        ],
      );

      return this.findUserById(id);
    },

    async getAllIscrizioni() {
      const { rows } = await connectionPool.query(
        `SELECT * FROM iscrizioni ORDER BY data_iscrizione DESC`,
      );
      return rows.map(normalizeEnrollmentRow);
    },

    async getUserIscrizioni(userId) {
      const { rows } = await connectionPool.query(
        `SELECT * FROM iscrizioni WHERE studente_id = $1 ORDER BY data_iscrizione DESC`,
        [userId],
      );
      return rows.map(normalizeEnrollmentRow);
    },

    async hasCourseEnrollment(userId, courseId) {
      const { rows } = await connectionPool.query(
        `SELECT 1 FROM iscrizioni WHERE studente_id = $1 AND corso_id = $2 LIMIT 1`,
        [userId, courseId],
      );
      return (rows.length ?? 0) > 0;
    },

    async createCourseEnrollment(payload) {
      const id = payload.id ?? createId();
      await connectionPool.query(
        `INSERT INTO iscrizioni (id, nome, cognome, email, esperienza, messaggio, studente_id, corso_id, corso_titolo, corso_livello, data_iscrizione)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          payload.nome,
          payload.cognome ?? null,
          payload.email,
          payload.livello ?? null,
          null,
          payload.userId ?? null,
          payload.courseId ?? null,
          payload.corso ?? null,
          payload.livello ?? null,
          payload.dataIscrizione ?? new Date().toISOString(),
        ],
      );
      const result = await connectionPool.query('SELECT * FROM iscrizioni WHERE id = $1', [id]);
      return normalizeEnrollmentRow(result.rows[0]);
    },

    async createGeneralEnrollment(payload) {
      const id = payload.id ?? createId();
      await connectionPool.query(
        `INSERT INTO iscrizioni (id, nome, cognome, email, esperienza, messaggio, studente_id, corso_id, corso_titolo, corso_livello, data_iscrizione)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          payload.nome,
          payload.cognome ?? null,
          payload.email,
          payload.esperienza ?? null,
          payload.messaggio ?? null,
          payload.userId ?? null,
          payload.courseId ?? null,
          payload.corso ?? null,
          payload.livello ?? null,
          payload.dataIscrizione ?? new Date().toISOString(),
        ],
      );
      const result = await connectionPool.query('SELECT * FROM iscrizioni WHERE id = $1', [id]);
      return normalizeEnrollmentRow(result.rows[0]);
    },

    async deleteEnrollment(id) {
      await connectionPool.query('DELETE FROM iscrizioni WHERE id = $1', [id]);
    },

    async updateEnrollment(id, updates) {
      const existing = await connectionPool.query('SELECT * FROM iscrizioni WHERE id = $1 LIMIT 1', [id]);
      if ((existing.rowCount ?? 0) === 0) {
        return null;
      }

      const row = existing.rows[0];
      const next = {
        nome: updates.nome ?? row.nome,
        cognome: updates.cognome ?? row.cognome,
        email: updates.email ?? row.email,
        esperienza: updates.esperienza ?? row.esperienza,
        messaggio: updates.messaggio ?? row.messaggio,
      };

      await connectionPool.query(
        `UPDATE iscrizioni
         SET nome = $2,
             cognome = $3,
             email = $4,
             esperienza = $5,
             messaggio = $6
         WHERE id = $1`,
        [id, next.nome, next.cognome, next.email, next.esperienza, next.messaggio],
      );

      const updated = await connectionPool.query('SELECT * FROM iscrizioni WHERE id = $1 LIMIT 1', [id]);
      return updated.rows[0] ? normalizeEnrollmentRow(updated.rows[0]) : null;
    },
  };
}

export function createApp({ repository = null } = {}) {
  validateRuntimeConfig();

  const app = express();
  const repo = repository ?? createRepository();
  app.locals.repository = repo;

  // Express 4 does not forward rejected route promises to error middleware.
  for (const method of ['get', 'post']) {
    const register = app[method].bind(app);
    app[method] = (route, ...handlers) => {
      if (handlers.length === 0) return register(route);
      return register(route, ...handlers.map(handler => (req, res, next) => {
        try {
          Promise.resolve(handler(req, res, next)).catch(next);
        } catch (error) {
          next(error);
        }
      }));
    };
  }
  const authenticate = async (req, values) => {
    req.session = { ...values, expiresAt: Date.now() + 60 * 60 * 1000 };
  };

  app.set('trust proxy', 1);
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieSession({
    name: 'fenice_login',
    keys: [SESSION_SECRET],
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 60 * 60 * 1000,
  }));
  app.use((req, res, next) => {
    if (req.session?.isAuthenticated &&
        (!Number.isFinite(req.session.expiresAt) || req.session.expiresAt <= Date.now())) {
      req.session = null;
    }
    next();
  });

  const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAuthenticated && req.session.role === 'admin') {
      return next();
    }
    return res.redirect('/login.html');
  };

  const requireUser = (req, res, next) => {
    if (req.session && req.session.isAuthenticated && req.session.role === 'user') {
      return next();
    }
    return res.redirect('/login-utente.html');
  };

  app.get('/area-personale.html', (req, res) => {
    if (req.session?.isAuthenticated && req.session.role === 'user') {
      return res.redirect('/area-personale');
    }
    return res.redirect('/login-utente.html');
  });

  app.get('/gestione-iscrizioni.html', (req, res) => {
    if (req.session?.isAuthenticated && req.session.role === 'admin') {
      return res.redirect('/gestione-iscrizioni');
    }
    return res.redirect('/login.html');
  });
  app.get('/iscrizione-corso.html', requireUser, (req, res) => res.redirect('/iscrizione-corso'));

  app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.get('/home', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.get('/corsi', (req, res) => res.sendFile(path.join(publicDir, 'corsi.html')));
  app.get('/portfolio', (req, res) => res.sendFile(path.join(publicDir, 'portfolio.html')));
  app.get('/iscrizione', (req, res) => res.sendFile(path.join(publicDir, 'iscrizione.html')));
  app.get('/iscrizione-corso', requireUser, (req, res) => res.sendFile(path.join(privateDir, 'iscrizione-corso.html')));
  app.get('/login-utente', (req, res) => res.sendFile(path.join(publicDir, 'login-utente.html')));
  app.get('/area-personale', requireUser, (req, res) => res.sendFile(path.join(privateDir, 'area-personale.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));

  app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login.html');
  });

  app.get('/logout-utente', (req, res) => {
    req.session = null;
    res.redirect('/login-utente.html');
  });

  app.post('/login', async (req, res) => {
    const username = parseString(req.body.username).toLowerCase();
    const password = parseString(req.body.password);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      await authenticate(req, { isAuthenticated: true, role: 'admin', username });
      return res.redirect('/gestione-iscrizioni');
    }

    return res.redirect('/login.html?error=1');
  });

  app.post('/login-utente', async (req, res) => {
    const username = parseString(req.body.username).toLowerCase();
    const password = parseString(req.body.password);

    const utente = await repo.findUserByUsername(username);
    if (!utente || !verifyPassword(password, utente.passwordHash)) {
      return res.redirect('/login-utente.html?error=1');
    }
    if (!utente.passwordHash.startsWith('scrypt:')) {
      await repo.updateUser(utente.id, { passwordHash: hashPassword(password) });
    }

    await authenticate(req, { isAuthenticated: true, role: 'user', userId: utente.id, username: utente.username });

    return res.redirect('/area-personale');
  });

  app.post('/registrazione', async (req, res) => {
    const nome = parseString(req.body.nome);
    const cognome = parseString(req.body.cognome);
    const email = parseString(req.body.email).toLowerCase();
    const username = parseString(req.body.username).toLowerCase();
    const password = parseString(req.body.password);
    const competenze = parseString(req.body.competenze);
    const bio = parseString(req.body.bio);
    const esperienza = req.body.esperienza;

    if (!nome || !cognome || !email || !username || !password || !competenze || !bio || !USER_LEVELS.includes(esperienza)) {
      return res.status(400).send('Compila tutti i campi richiesti per completare la registrazione.');
    }

    const userByUsername = await repo.findUserByUsername(username);
    const userByEmail = await repo.findUserByEmail(email);
    if (userByUsername || userByEmail) {
      return res.status(409).send('Username o email già in uso.');
    }

    const nuovoUtente = await repo.createUser({
      id: createId(),
      nome,
      cognome,
      email,
      username,
      passwordHash: hashPassword(password),
      competenze,
      bio,
      esperienza,
      dataRegistrazione: new Date().toISOString(),
    });

    await authenticate(req, { isAuthenticated: true, role: 'user', userId: nuovoUtente.id, username: nuovoUtente.username });

    return res.redirect('/area-personale');
  });

  app.get('/api/utente', requireUser, async (req, res) => {
    const utente = await repo.findUserById(req.session.userId);
    if (!utente) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    const { passwordHash, ...datiPubblici } = utente;
    return res.json(datiPubblici);
  });

  app.get('/api/corsi', async (req, res) => {
    const corsi = await repo.getCourses();
    return res.json(corsi);
  });

  app.get('/api/mie-iscrizioni', requireUser, async (req, res) => {
    const mieIscrizioni = await repo.getUserIscrizioni(req.session.userId);
    return res.json(mieIscrizioni);
  });

  app.post('/area-personale/iscrizione-corso', requireUser, async (req, res) => {
    const userId = req.session.userId;
    const courseId = parseString(req.body.courseId);

    if (!courseId) {
      return res.status(400).send('Seleziona un corso valido.');
    }

    const utente = await repo.findUserById(userId);
    const corsi = await repo.getCourses();
    const corso = corsi.find((item) => item.id === courseId);
    if (!utente || !corso) {
      return res.status(404).send('Corso o utente non trovato.');
    }

    const esiste = await repo.hasCourseEnrollment(userId, courseId);
    if (esiste) {
      return res.status(409).send('Sei già iscritto a questo corso.');
    }

    await repo.createCourseEnrollment({
      id: createId(),
      userId,
      courseId,
      corso: corso.titolo,
      nome: utente.nome,
      cognome: utente.cognome,
      email: utente.email,
      livello: utente.esperienza,
      dataIscrizione: new Date().toISOString(),
    });

    return res.redirect('/area-personale?success=1');
  });

  app.post('/area-personale/modifica', requireUser, async (req, res) => {
    const utente = await repo.findUserById(req.session.userId);
    if (!utente) {
      return res.status(404).send('Utente non trovato.');
    }

    const nome = parseString(req.body.nome);
    const cognome = parseString(req.body.cognome);
    const email = parseString(req.body.email).toLowerCase();
    const username = parseString(req.body.username).toLowerCase();
    const competenze = parseString(req.body.competenze);
    const bio = parseString(req.body.bio);
    const esperienza = req.body.esperienza;
    const password = parseString(req.body.password);

    if (!nome || !cognome || !email || !username || !competenze || !bio || !USER_LEVELS.includes(esperienza)) {
      return res.status(400).send('Dati non validi per la modifica del profilo.');
    }

    const existingUsername = await repo.findUserByUsername(username);
    const existingEmail = await repo.findUserByEmail(email);
    if ((existingUsername && existingUsername.id !== utente.id) || (existingEmail && existingEmail.id !== utente.id)) {
      return res.status(409).send('Username o email già in uso.');
    }

    const updated = await repo.updateUser(req.session.userId, {
      nome,
      cognome,
      email,
      username,
      competenze,
      bio,
      esperienza,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    });

    req.session.username = updated?.username ?? username;
    return res.redirect('/area-personale');
  });

  app.get('/gestione-iscrizioni', requireAdmin, (req, res) => res.sendFile(path.join(privateDir, 'gestione-iscrizioni.html')));
  app.get('/api/iscrizioni', requireAdmin, async (req, res) => {
    const iscrizioni = await repo.getAllIscrizioni();
    return res.json(iscrizioni);
  });

  app.post('/iscrizioni', async (req, res) => {
    const nome = parseString(req.body.nome);
    const email = parseString(req.body.email).toLowerCase();
    const esperienza = req.body.esperienza;
    const messaggio = parseString(req.body.messaggio);

    if (!nome || !email || !USER_LEVELS.includes(esperienza)) {
      return res.status(400).send('Compila nome, email e livello di esperienza.');
    }

    await repo.createGeneralEnrollment({
      id: createId(),
      nome,
      email,
      esperienza,
      messaggio,
      dataIscrizione: new Date().toISOString(),
    });

    const params = new URLSearchParams({ nome, email, esperienza, messaggio });
    return res.redirect(303, `/successo.html?${params.toString()}`);
  });

  app.post('/gestione-iscrizioni/elimina/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    await repo.deleteEnrollment(id);
    return res.redirect(303, '/gestione-iscrizioni');
  });

  app.post('/gestione-iscrizioni/modifica/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const nome = parseString(req.body.nome);
    const email = parseString(req.body.email).toLowerCase();
    const esperienza = req.body.esperienza;
    const messaggio = parseString(req.body.messaggio);

    if (!nome || !email || !USER_LEVELS.includes(esperienza)) {
      return res.status(400).send('Dati non validi per la modifica.');
    }

    const updated = await repo.updateEnrollment(id, { nome, email, esperienza, messaggio });
    if (!updated) {
      return res.status(404).send('Iscrizione non trovata.');
    }

    return res.redirect(303, '/gestione-iscrizioni');
  });

  app.use(express.static(publicDir, { index: false, redirect: false }));

  app.use((error, req, res, next) => {
    console.error('Richiesta non riuscita:', error.code || error.name || 'Errore');
    if (res.headersSent) return next(error);
    if (error.code === '23505') {
      return res.status(409).send('Dati già presenti: username, email o iscrizione duplicata.');
    }
    res.status(500).send('Errore interno del server.');
  });

  return app;
}

export function startServer({ port = DEFAULT_PORT, app = createApp() } = {}) {
  return app.listen(port, () => {
    console.log(`Server avviato: http://localhost:${port}`);
  });
}

const app = process.env.NODE_ENV === 'test' ? undefined : createApp();
export default app;
if (process.argv[1] === fileURLToPath(import.meta.url)) startServer({ app });
```

### Percorsi mantenuti

| Metodo e percorso | Funzione |
| --- | --- |
| `GET /`, `/home`, `/portfolio`, `/corsi` | Pagine pubbliche. |
| `GET /iscrizione` | Modulo di registrazione dello studente. |
| `POST /registrazione` | Crea lo studente su SQL e apre l'area privata. |
| `POST /login-utente` | Controlla username e password, poi autentica lo studente. |
| `GET /area-personale` | Pagina privata: richiede accesso studente. |
| `GET /api/utente` | Profilo dello studente autenticato, senza password. |
| `POST /area-personale/modifica` | Aggiorna il profilo nel database. |
| `GET /api/corsi` | Catalogo letto dalla tabella `corsi`. |
| `GET /iscrizione-corso` | Pagina di iscrizione al corso, dopo l'accesso. |
| `POST /area-personale/iscrizione-corso` | Collega studente e corso nella tabella `iscrizioni`. |
| `GET /api/mie-iscrizioni` | Mostra soltanto le iscrizioni dello studente autenticato. |
| `GET /logout-utente` | Esce dall'area studente. |
| `POST /login`, `GET /gestione-iscrizioni` | Accesso e area dell'amministratore. |
| `GET /api/iscrizioni` | Elenco iscrizioni, riservato all'amministratore. |
| `POST /gestione-iscrizioni/modifica/:id` | Modifica un'iscrizione, riservata all'amministratore. |
| `POST /gestione-iscrizioni/elimina/:id` | Elimina un'iscrizione, riservata all'amministratore. |
| `POST /iscrizioni` | Mantiene il form generico già previsto nel server iniziale. |

Il frontend continua a usare `userId` e `courseId`: il server li converte in `studente_id` e `corso_id` nel database. Non rinominare i campi nei vecchi HTML o JavaScript.

Le password nuove vengono salvate come hash scrypt, non in chiaro. Le password già presenti nei JSON restano compatibili e vengono aggiornate al formato nuovo dopo un accesso riuscito.

L'accesso usa un cookie firmato che scade dopo un'ora. Non contiene password. Il cookie permette di usare più istanze del server senza una tabella tecnica delle sessioni. Il logout elimina il cookie dal browser; per questa soluzione didattica non revoca copie del cookie eventualmente rubate prima della scadenza. Prima di un servizio reale servono ulteriori protezioni.

### Query principali

Il server usa query con parametri, senza concatenare i valori inseriti nel form:

```sql
-- Catalogo
SELECT * FROM corsi ORDER BY id;

-- Ricerca dello studente per il login
SELECT * FROM studenti WHERE LOWER(username) = LOWER($1) LIMIT 1;

-- Profilo privato
SELECT * FROM studenti WHERE id = $1;

-- Iscrizioni del solo studente autenticato
SELECT * FROM iscrizioni WHERE studente_id = $1 ORDER BY data_iscrizione DESC;

-- Eliminazione amministratore
DELETE FROM iscrizioni WHERE id = $1;
```

Questi sono esempi dei parametri usati dal server, non query da incollare nel SQL Editor senza fornire i valori. Per controllare i dati nel pannello usa:

```sql
SELECT id, nome, cognome, email, username FROM studenti;
SELECT id, titolo, level FROM corsi;
SELECT id, nome, email, studente_id, corso_id FROM iscrizioni;
```

Non mostrare o esportare `password_hash` nelle API pubbliche.

## 9. Importa i JSON della lezione 33

Non spostare o cancellare i JSON: il catalogo e gli account di prova verranno importati. Controlla che contengano soltanto dati dimostrativi.

Crea `scripts/db-seed.js`:

```javascript
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

dotenv.config({ quiet: true });

export async function loadSeedData() {
  const read = async name => JSON.parse(await fs.readFile(new URL('../data/' + name + '.json', import.meta.url), 'utf8'));
  return { corsi: await read('corsi'), utenti: await read('utenti'), iscrizioni: await read('iscrizioni') };
}

export async function seed(pool, { corsi, utenti, iscrizioni }) {
  const client = await pool.connect();
  const counts = { inserted: 0, skipped: 0 };
  const insert = async (sql, params) => {
    const result = await client.query(sql, params);
    counts[result.rowCount ? 'inserted' : 'skipped']++;
  };
  try {
    await client.query('BEGIN');
    for (const c of corsi) {
      await insert('INSERT INTO corsi (id,titolo,descrizione,level,durata,modalita,prezzo) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING',
        [c.id,c.titolo,c.descrizione,c.level,c.durata,c.modalita,c.prezzo]);
    }
    for (const u of utenti) {
      await insert('INSERT INTO studenti (id,nome,cognome,email,username,password_hash,competenze,bio,esperienza,data_registrazione) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING',
        [u.id,u.nome,u.cognome,u.email.toLowerCase(),u.username.toLowerCase(),u.passwordHash,u.competenze,u.bio,u.esperienza,u.dataRegistrazione]);
    }
    for (const i of iscrizioni) {
      await insert('INSERT INTO iscrizioni (id,nome,cognome,email,esperienza,messaggio,studente_id,corso_id,corso_titolo,corso_livello,data_iscrizione) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING',
        [i.id,i.nome,i.cognome ?? null,i.email,i.esperienza ?? null,i.messaggio ?? null,i.userId ?? null,i.courseId ?? null,i.corso ?? null,i.livello ?? null,i.dataIscrizione]);
    }
    await client.query('COMMIT');
    return counts;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool();
  try {
    const result = await seed(pool, await loadSeedData());
    console.log('Importazione completata senza sovrascrivere i dati esistenti:', result);
  } catch (error) {
    console.error('Importazione non riuscita; tutte le modifiche sono state annullate:', error.code || error.name);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
```

Controlla la sintassi ed esegui l'importazione:

```bash
node --check server.js
node --check db/pool.js
node --check scripts/db-seed.js
npm run db:seed
```

L'importazione inserisce prima i corsi, poi gli studenti, poi le iscrizioni, così i collegamenti trovano già i record a cui riferirsi. È eseguita in una transazione e non sovrascrive record già presenti.

Nel SQL Editor verifica:

```sql
SELECT count(*) FROM corsi;
SELECT count(*) FROM studenti;
SELECT count(*) FROM iscrizioni;
```

Dopo la migrazione i nuovi dati vengono salvati nel database, non nei JSON.

## 10. Prova registrazione, accesso e area privata in locale

```bash
npm start
```

Apri [http://localhost:3000](http://localhost:3000), non Live Server.

1. Apri il catalogo: deve mostrare i corsi importati.
2. Registra uno studente con dati inventati e tutti i campi richiesti.
3. Verifica l'apertura dell'area personale.
4. Esci, poi accedi dalla pagina login con lo stesso username e password.
5. Modifica la bio del profilo e verifica che rimanga dopo un nuovo accesso.
6. Iscriviti a un corso e controlla l'elenco nell'area personale.
7. Prova a iscriverti nuovamente allo stesso corso: il server deve rifiutare il duplicato.
8. Accedi come amministratore con i valori di `.env` e prova la gestione delle iscrizioni.
9. Dal SQL Editor verifica studenti e iscrizioni con le query del punto 8.
10. Senza accesso, prova `/area-personale` e `/area-personale.html`: devono rimandare al login.

Quando tutto funziona, ferma il server con **Ctrl+C**.

## 11. Crea il tuo repository privato e carica il codice

La cartella è già un repository Git perché l'hai clonata al punto 1. **Non eseguire di nuovo `git init` e non inviare le tue modifiche al repository pubblico del docente.** Crea una destinazione tua:

1. Apri [GitHub](https://github.com) con l'account che collegherai a Vercel.
2. Premi **New repository**.
3. Nome: `progetto-completo`, o un nome scelto da te.
4. Seleziona **Private**.
5. Non aggiungere README, licenza o `.gitignore`.
6. Premi **Create repository** e copia l'URL HTTPS.

Nel terminale del progetto, sostituisci nome ed email con i tuoi:

```bash
git branch -M main
git config user.name "Nome Cognome"
git config user.email "LA_TUA_EMAIL_VERIFICATA_SU_GITHUB"
git remote -v
```

Se `origin` punta ancora a `https://github.com/sfilangio01/fenice-progetto-lezione-33.git`, rinomina quel collegamento in `upstream` e aggiungi come nuovo `origin` il TUO repository privato. Sostituisci l'URL dell'esempio:

```bash
git remote rename origin upstream
git remote add origin https://github.com/TUO_ACCOUNT/TUO_REPOSITORY.git
git remote -v
```

Ora `upstream` identifica il progetto iniziale del corso e `origin` identifica il tuo progetto. Al punto 12 importerai su Vercel il TUO repository, non quello del docente.

Esegui la rinomina una sola volta. Se hai già configurato `origin` con il tuo repository e `upstream` con quello del corso, passa al controllo dei file:

```bash
git add .
git status --short
git diff --cached --stat
git ls-files -- .env '.env.*' node_modules .vercel archivio
```

L'ultimo comando deve mostrare soltanto `.env.example`. Se mostra segreti o `archivio`, fermati e correggi `.gitignore` prima di continuare. La cartella `data` contiene i dati dimostrativi da importare: verifica che non ci siano dati personali reali.

Crea il commit:

```bash
git commit -m "Collega il form a Neon e prepara il deploy"
```

Pubblica il commit nel tuo repository privato:

```bash
git remote -v
git push -u origin main
```

Completa l'autenticazione richiesta con il tuo account GitHub. Se compare un errore di permessi, controlla che `origin` punti al tuo repository e non a quello pubblico del docente. Se compare `remote origin already exists`, non ripetere `git remote add`: verifica prima `git remote -v`; soltanto se punta alla destinazione sbagliata usa `git remote set-url origin URL_DEL_TUO_REPOSITORY`.

Apri il repository su GitHub e controlla che ci siano `server.js`, `public`, `pages`, `db`, `scripts`, `data`, `package.json` e `package-lock.json`. Non devono esserci `.env`, `node_modules` o `archivio`.

## 12. Importa il repository e fai il primo deploy su Vercel

1. Torna a Vercel nello stesso account/team usato al punto 2.
2. Premi **Add New > Project**.
3. Se richiesto, autorizza Vercel a leggere il repository GitHub.
4. Seleziona il repository appena creato e premi **Import**.
5. Scegli il nome del progetto.
6. Lascia la **Root Directory** nella radice del repository, dove sono `package.json` e `server.js`: non scegliere `public`.
7. Usa la configurazione Express rilevata automaticamente. Non scegliere un framework frontend.
8. Non impostare Build Command o Output Directory personalizzati: non esiste `npm run build` in questo progetto.
9. Se disponibile, scegli Node.js 24.x.
10. Prima di premere Deploy, nella sezione **Environment Variables** aggiungi `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `SESSION_SECRET`, con gli stessi valori del tuo `.env`. Per ciascuna variabile seleziona soltanto **Production**: se è selezionato anche Preview, deselezionalo. Mantieni riservati i valori. Se usi **Import .env**, seleziona il tuo file locale e controlla comunque nomi e ambienti prima del deploy; importare le variabili nel pannello non significa caricare `.env` su GitHub.
11. Premi **Deploy** e attendi **Ready**.

Le variabili al punto 10 permettono al primo deploy di funzionare prima del collegamento formale della risorsa al progetto. Stai usando il database già creato: non crearne un secondo.

## 13. Collega la risorsa Neon al progetto Vercel

### Rimuovi la sola variabile manuale che impedisce il collegamento

Al punto 12 hai inserito manualmente `DATABASE_URL` per rendere operativo il primo deploy. L'integrazione Neon deve ora creare e gestire quella stessa variabile. Se provi a collegarla senza rimuovere la variabile manuale, può comparire:

> This project already has an existing environment variable with name DATABASE_URL in one of the chosen environments

Non creare un altro database e non cambiare il codice per aggirare l'errore. Procedi così:

1. Controlla che la connessione del database sia ancora conservata nel tuo `.env` locale, senza mostrarla o condividerla.
2. Apri il progetto web corretto in Vercel e poi **Settings > Environment Variables**, oppure la voce **Environment Variables** nel menu laterale.
3. Cerca `DATABASE_URL` e verifica che sia la variabile manuale aggiunta al punto 12, nell'ambiente **Production**. Se è già gestita dall'integrazione Neon e la risorsa risulta collegata al progetto, non eliminarla: passa al controllo delle variabili e al redeploy qui sotto.
4. Dal menu della sola variabile manuale scegli **Delete**.
5. Nella conferma controlla nuovamente nome del progetto, chiave `DATABASE_URL` e ambiente Production. Se richiesta, seleziona la casella che conferma di aver compreso la rimozione e premi **Delete**.

Questa operazione rimuove la variabile dal pannello Vercel: **non elimina il database Neon, le tabelle o i dati**. Non rimuovere `ADMIN_USERNAME`, `ADMIN_PASSWORD` o `SESSION_SECRET`. Non avviare un deploy tra la rimozione e il collegamento: prima lascia che Neon ricrei `DATABASE_URL`.

### Collega il database già creato

1. In Vercel apri **Storage** e seleziona la risorsa Neon creata al punto 2, controllando il nome del database.
2. Apri **Projects** e premi **Connect to Project**.
3. Nel campo **Search projects** cerca il progetto web appena importato e selezionalo. Scegli il progetto esistente, non l'opzione **Create Project**.
4. Apri il menu **Environments**: lascia selezionato soltanto **Production**, deselezionando Preview e Development se presenti. Chiudi il menu.
5. Nella sezione **Create database branch for deployment** lascia disattivate le caselle: per questa esercitazione non servono nuovi branch del database.
6. Lascia vuoto **Custom Environment Variable Prefix**: non inserire `STORAGE` o altri prefissi. La variabile che legge il server si chiama esattamente `DATABASE_URL`.
7. Mantieni attiva l'opzione **Sensitive**, se presente, e premi **Connect Project**.
8. Attendi che la tabella **Connections** mostri il tuo progetto con ambiente **Production**. Questa è la conferma del collegamento.
9. Nel progetto web torna a **Environment Variables** e controlla che `DATABASE_URL` sia stata ricreata dall'integrazione della risorsa Neon corretta, in Production. L'integrazione può aggiungere anche altre variabili, come `DATABASE_URL_UNPOOLED`, `PGHOST` e `POSTGRES_URL`: non devi copiarle nel codice. Questo progetto usa `DATABASE_URL`.
10. Controlla che siano ancora presenti `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `SESSION_SECRET`, in Production, con gli stessi valori del primo deploy. Sono variabili dell'applicazione, non vengono create automaticamente da Neon.

Se il collegamento fallisce dopo la rimozione, risolvi l'errore prima di pubblicare. Se devi interrompere la procedura, puoi reinserire la `DATABASE_URL` conservata nel tuo `.env`, nello stesso progetto e ambiente, per evitare un successivo deploy senza connessione.

### Rifai il deploy con la nuova configurazione

1. Apri **Deployments** del progetto web.
2. Seleziona il deployment più recente del branch `main`.
3. Apri **Deployment Actions > Redeploy**.
4. Nella finestra di conferma scegli **Production** e controlla che sia selezionato il deployment del commit appena pubblicato.
5. Lascia disattivata **Use existing Build Cache**, come nella verifica di questa procedura, e premi **Redeploy**.
6. Attendi **Ready** nel nuovo deployment. Controlla che riporti Production, il commit atteso e il dominio pubblico del tuo progetto.
7. Esegui tutti i controlli del punto 14: il precedente deploy funzionante non dimostra che anche quello appena creato usi correttamente le nuove variabili.

Il collegamento identifica la risorsa usata dal progetto e può aggiornare le variabili. Le nuove variabili richiedono un nuovo deployment.

## 14. Verifica il risultato online

Apri l'indirizzo di produzione assegnato da Vercel.

1. Controlla home, portfolio, catalogo e caricamento dell'immagine profilo.
2. Registra uno studente con dati inventati, accedi all'area personale e iscrivilo a un corso.
3. Esci e accedi nuovamente: profilo e iscrizione devono rimanere disponibili.
4. Apri il SQL Editor dalla risorsa Neon e verifica i nuovi record:

```sql
SELECT * FROM iscrizioni ORDER BY data_iscrizione DESC;
```

5. Senza accesso, `/api/utente` e `/api/iscrizioni` devono rimandare al relativo login. Le pagine `/area-personale.html` e `/gestione-iscrizioni.html` non devono aprirsi direttamente. `/.env`, `/data/utenti.json` e `/pages/area-personale.html` non devono essere scaricabili.
6. Accedi come amministratore e verifica l'elenco, la modifica e l'eliminazione delle iscrizioni di prova.
7. Controlla anche il sito da telefono.

**Il deploy è completato quando registrazione, accesso, area privata e iscrizione al corso funzionano online e i record sono presenti nel database**, non soltanto quando la home si apre.

Se il form restituisce errore, apri i log runtime su Vercel e controlla:
- tutte e quattro le variabili disponibili in Production;
- deployment creato dopo l'ultima modifica della variabile;
- tabelle `studenti`, `corsi` e `iscrizioni` create e dati importati nel database giusto;
- URL e credenziali del database ancora validi.

## 15. Pubblica modifiche successive

Modifica il codice, prova in locale e ferma il server. Poi:

```bash
node --check server.js
git diff
git add .
git diff --cached --stat
git commit -m "Descrivi la modifica"
git push
```

Vercel pubblica il nuovo commit tramite l'integrazione Git: dopo `git push` non devi avviare un deploy manuale.

1. In GitHub controlla che il commit sia arrivato sul branch `main`.
2. In Vercel apri **Deployments** e attendi il deployment generato da quel push.
3. Controlla che il commit mostrato corrisponda a quello di GitHub, che l'ambiente sia **Production** e che lo stato diventi **Ready**.
4. Apri il dominio di produzione e verifica la modifica pubblicata.
5. Accedi con uno studente di prova già registrato: profilo e iscrizioni devono essere ancora presenti. Il deploy del codice non deve cancellare i dati di Neon.
6. Prova nuovamente registrazione, accesso e iscrizione online, verificando anche i record nel SQL Editor.

Questo è il deploy automatico tramite GitHub e Vercel. Non hai configurato una pipeline separata di test automatici: i controlli locali e online di questa guida vanno eseguiti da te prima e dopo la pubblicazione.

Se cambi solo le variabili, non serve un commit del codice: aggiorna la configurazione e fai **Redeploy**. Dopo il collegamento lascia che l'integrazione Neon gestisca le proprie variabili; se cambi database, collega la nuova risorsa corretta e verifica la connessione prima di pubblicare. Non caricare `.env`.

Questa è un'esercitazione con dati inventati. Prima di raccogliere dati reali servono anche informativa privacy e protezioni contro gli invii abusivi.

Riferimenti: [Express su Vercel](https://vercel.com/docs/frameworks/backend/express), [Neon nel Marketplace](https://vercel.com/marketplace/neon), [creazione e collegamento delle risorse](https://vercel.com/docs/integrations/install-an-integration/product-integration), [variabili d'ambiente](https://vercel.com/docs/environment-variables).

## Prima di concludere

Considera completata l'esercitazione quando puoi registrarti, autenticarti, entrare nella tua area personale e iscriverti a un corso sul sito online, con i dati salvati nel database. Esegui i controlli locali del punto 10 e quelli online del punto 14: una pagina di conferma o un deployment Ready, da soli, non dimostrano il salvataggio.

Se il browser mostra un avviso di sicurezza come **Sito pericoloso**, non ignorarlo e non disattivare la protezione. Non inserire dati reali e non condividere il link finché la segnalazione non è stata verificata e risolta. I test funzionali e il salvataggio nel database, da soli, non attestano la sicurezza del sito.
