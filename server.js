import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
const dataDir = path.join(__dirname, 'data');
const storageFile = path.join(dataDir, 'iscrizioni.json');
const usersFile = path.join(dataDir, 'utenti.json');
const coursesFile = path.join(dataDir, 'corsi.json');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret-session';

const ensureStorage = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(storageFile)) {
    fs.writeFileSync(storageFile, '[]', 'utf8');
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', 'utf8');
  }

  if (!fs.existsSync(coursesFile)) {
    fs.writeFileSync(coursesFile, '[]', 'utf8');
  }
};

const readIscrizioni = () => {
  ensureStorage();

  try {
    const contenuto = fs.readFileSync(storageFile, 'utf8');
    const dati = JSON.parse(contenuto);
    return Array.isArray(dati) ? dati : [];
  } catch (error) {
    console.error('Errore durante la lettura delle iscrizioni:', error);
    return [];
  }
};

const writeIscrizioni = (iscrizioni) => {
  ensureStorage();
  fs.writeFileSync(storageFile, JSON.stringify(iscrizioni, null, 2), 'utf8');
};

const readUsers = () => {
  ensureStorage();

  try {
    const contenuto = fs.readFileSync(usersFile, 'utf8');
    const utenti = JSON.parse(contenuto);
    return Array.isArray(utenti) ? utenti : [];
  } catch (error) {
    console.error('Errore durante la lettura degli utenti:', error);
    return [];
  }
};

const writeUsers = (utenti) => {
  ensureStorage();
  fs.writeFileSync(usersFile, JSON.stringify(utenti, null, 2), 'utf8');
};

const readCorsi = () => {
  ensureStorage();

  try {
    const contenuto = fs.readFileSync(coursesFile, 'utf8');
    const corsi = JSON.parse(contenuto);
    return Array.isArray(corsi) ? corsi : [];
  } catch (error) {
    console.error('Errore durante la lettura dei corsi:', error);
    return [];
  }
};

const parseString = (value) => (typeof value === 'string' ? value.trim() : '');
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60,
  },
}));

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/corsi', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'corsi.html'));
});

app.get('/portfolio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/iscrizione', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'iscrizione.html'));
});

app.get('/iscrizione-corso', requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'iscrizione-corso.html'));
});

app.get('/login-utente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-utente.html'));
});

app.get('/area-personale', requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'area-personale.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.get('/logout-utente', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login-utente.html');
  });
});

app.post('/login', (req, res) => {
  const username = parseString(req.body.username);
  const password = parseString(req.body.password);

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.role = 'admin';
    req.session.username = username;
    return res.redirect('/gestione-iscrizioni');
  }

  return res.redirect('/login.html?error=1');
});

app.post('/login-utente', (req, res) => {
  const username = parseString(req.body.username);
  const password = parseString(req.body.password);

  const utenti = readUsers();
  const utente = utenti.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.passwordHash === hashPassword(password));

  if (!utente) {
    return res.redirect('/login-utente.html?error=1');
  }

  req.session.isAuthenticated = true;
  req.session.role = 'user';
  req.session.userId = utente.id;
  req.session.username = utente.username;

  return res.redirect('/area-personale');
});

app.post('/registrazione', (req, res) => {
  const nome = parseString(req.body.nome);
  const cognome = parseString(req.body.cognome);
  const email = parseString(req.body.email);
  const username = parseString(req.body.username);
  const password = parseString(req.body.password);
  const competenze = parseString(req.body.competenze);
  const bio = parseString(req.body.bio);
  const esperienza = req.body.esperienza;

  if (!nome || !cognome || !email || !username || !password || !competenze || !bio || !['principiante', 'intermedio', 'avanzato'].includes(esperienza)) {
    return res.status(400).send('Compila tutti i campi richiesti per completare la registrazione.');
  }

  const utenti = readUsers();
  const usernameEsistente = utenti.some((utente) => utente.username.toLowerCase() === username.toLowerCase());
  const emailEsistente = utenti.some((utente) => utente.email.toLowerCase() === email.toLowerCase());

  if (usernameEsistente || emailEsistente) {
    return res.status(409).send('Username o email già in uso.');
  }

  const nuovoUtente = {
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
  };

  utenti.push(nuovoUtente);
  writeUsers(utenti);

  req.session.isAuthenticated = true;
  req.session.role = 'user';
  req.session.userId = nuovoUtente.id;
  req.session.username = nuovoUtente.username;

  return res.redirect('/area-personale');
});

app.get('/api/utente', requireUser, (req, res) => {
  const utenti = readUsers();
  const utente = utenti.find((item) => item.id === req.session.userId);

  if (!utente) {
    return res.status(404).json({ message: 'Utente non trovato.' });
  }

  const { passwordHash, ...datiPubblici } = utente;
  return res.json(datiPubblici);
});

app.get('/api/corsi', (req, res) => {
  res.json(readCorsi());
});

app.get('/api/mie-iscrizioni', requireUser, (req, res) => {
  const iscrizioni = readIscrizioni();
  const mieIscrizioni = iscrizioni.filter((iscrizione) => iscrizione.userId === req.session.userId);
  res.json(mieIscrizioni);
});

app.post('/area-personale/iscrizione-corso', requireUser, (req, res) => {
  const userId = req.session.userId;
  const courseId = parseString(req.body.courseId);

  if (!courseId) {
    return res.status(400).send('Seleziona un corso valido.');
  }

  const utenti = readUsers();
  const utente = utenti.find((item) => item.id === userId);
  const corsi = readCorsi();
  const corso = corsi.find((item) => item.id === courseId);

  if (!utente || !corso) {
    return res.status(404).send('Corso o utente non trovato.');
  }

  const iscrizioni = readIscrizioni();
  const esiste = iscrizioni.some((iscrizione) => iscrizione.userId === userId && iscrizione.courseId === courseId);

  if (esiste) {
    return res.status(409).send('Sei già iscritto a questo corso.');
  }

  iscrizioni.push({
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

  writeIscrizioni(iscrizioni);
  return res.redirect('/area-personale?success=1');
});

app.post('/area-personale/modifica', requireUser, (req, res) => {
  const utenti = readUsers();
  const indice = utenti.findIndex((utente) => utente.id === req.session.userId);

  if (indice === -1) {
    return res.status(404).send('Utente non trovato.');
  }

  const nome = parseString(req.body.nome);
  const cognome = parseString(req.body.cognome);
  const email = parseString(req.body.email);
  const username = parseString(req.body.username);
  const competenze = parseString(req.body.competenze);
  const bio = parseString(req.body.bio);
  const esperienza = req.body.esperienza;
  const password = parseString(req.body.password);

  if (!nome || !cognome || !email || !username || !competenze || !bio || !['principiante', 'intermedio', 'avanzato'].includes(esperienza)) {
    return res.status(400).send('Dati non validi per la modifica del profilo.');
  }

  const usernameEsistente = utenti.some((utente, index) => index !== indice && utente.username.toLowerCase() === username.toLowerCase());
  const emailEsistente = utenti.some((utente, index) => index !== indice && utente.email.toLowerCase() === email.toLowerCase());

  if (usernameEsistente || emailEsistente) {
    return res.status(409).send('Username o email già in uso.');
  }

  utenti[indice] = {
    ...utenti[indice],
    nome,
    cognome,
    email,
    username,
    competenze,
    bio,
    esperienza,
    ...(password ? { passwordHash: hashPassword(password) } : {}),
  };

  writeUsers(utenti);
  req.session.username = username;

  return res.redirect('/area-personale');
});

app.get('/gestione-iscrizioni', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gestione-iscrizioni.html'));
});

app.get('/api/iscrizioni', requireAdmin, (req, res) => {
  res.json(readIscrizioni());
});

app.post('/iscrizioni', (req, res) => {
  const nome = parseString(req.body.nome);
  const email = parseString(req.body.email);
  const esperienza = req.body.esperienza;
  const messaggio = parseString(req.body.messaggio);

  if (!nome || !email || !['principiante', 'intermedio', 'avanzato'].includes(esperienza)) {
    return res.status(400).send('Compila nome, email e livello di esperienza.');
  }

  const nuovaIscrizione = {
    id: createId(),
    nome,
    email,
    esperienza,
    messaggio,
    dataIscrizione: new Date().toISOString(),
  };

  const iscrizioni = readIscrizioni();
  iscrizioni.push(nuovaIscrizione);
  writeIscrizioni(iscrizioni);

  const params = new URLSearchParams({
    nome,
    email,
    esperienza,
    messaggio,
  });

  return res.redirect(303, `/successo.html?${params.toString()}`);
});

app.post('/gestione-iscrizioni/elimina/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const iscrizioni = readIscrizioni();
  const aggiornate = iscrizioni.filter((iscrizione) => iscrizione.id !== id);
  writeIscrizioni(aggiornate);
  return res.redirect(303, '/gestione-iscrizioni');
});

app.post('/gestione-iscrizioni/modifica/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const nome = parseString(req.body.nome);
  const email = parseString(req.body.email);
  const esperienza = req.body.esperienza;
  const messaggio = parseString(req.body.messaggio);

  if (!nome || !email || !['principiante', 'intermedio', 'avanzato'].includes(esperienza)) {
    return res.status(400).send('Dati non validi per la modifica.');
  }

  const iscrizioni = readIscrizioni();
  const indice = iscrizioni.findIndex((iscrizione) => iscrizione.id === id);

  if (indice === -1) {
    return res.status(404).send('Iscrizione non trovata.');
  }

  iscrizioni[indice] = {
    ...iscrizioni[indice],
    nome,
    email,
    esperienza,
    messaggio,
  };

  writeIscrizioni(iscrizioni);
  return res.redirect(303, '/gestione-iscrizioni');
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server avviato: http://localhost:${port}`);
});