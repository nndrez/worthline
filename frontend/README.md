# Worthline frontend

Frontend Angular 22, standalone e zoneless, con TypeScript e template rigorosamente tipizzati. Tailwind CSS 4, CSS con token condivisi, font Inter locale e traduzioni esclusivamente italiane.

## Avvio

Richiede una versione Node compatibile con Angular 22, ad esempio Node 24.19.

```powershell
cd frontend
npm ci
npm start
```

Apri `http://localhost:4200`. Avvia separatamente il backend seguendo il suo README: il proxy di sviluppo inoltra `/api` a `http://localhost:8080`, configurato in `proxy.conf.json`.

L'applicazione usa le API reali. Non contiene dati finanziari precompilati, dati demo automatici o persistenza alternativa nel browser. Con un backend vuoto mostra gli stati iniziali; con il backend non disponibile mostra un errore italiano e permette di riprovare.

## Funzionalità iniziali

- **Panoramica**: patrimonio rilevato, storico mensile, ripartizione per tipologia, entrate, uscite, risparmio e avanzamento delle rilevazioni.
- **Conti**: creazione, ricerca, ordinamento, modifica e cancellazione.
- **Saldi mensili**: rilevazioni manuali di fine mese, filtrate per periodo e conto, con creazione, modifica e cancellazione.
- **Movimenti**: entrate e uscite, categoria dinamica, tag e note; filtri per tipo, descrizione e intervallo di date.
- **Categorie**: categorie e sottocategorie per entrate/uscite; modifica del nome e cancellazione secondo i vincoli del backend.
- **Portafoglio**: strumenti e operazioni manuali di acquisto, vendita e dividendo.

Tutte le tabelle sono paginate dal backend. Filtri, ordinamento e pagina restano nell'URL. La richiesta usa pagine a partire da zero, mentre la risposta del backend le numera a partire da uno: la conversione è centralizzata.

## Convenzioni

Le indicazioni di progetto sono in `AGENTS.md`. Ogni funzionalità possiede DTO, client API, pagine e form. `core` contiene l'infrastruttura HTTP, la navigazione delle ricerche e la traduzione degli errori; `shared` contiene componenti di presentazione e utilità.

I form usano **Signal Forms** e i componenti condivisi adattati dalla libreria Insula in `shared/ui/controls`: input, select con ricerca e selezione multipla, datepicker (anche per il solo mese) e intervallo date. La copia dei sorgenti è autonoma: non richiede il checkout Insula o il suo registry privato. Le varianti condividono i token visivi di Worthline e le traduzioni `controls.*`; le pagine devono riutilizzarle. I dialog usano l'elemento nativo `dialog`, con gestione del focus e chiusura tramite Escape. Gli overlay CDK usano il top layer tramite Popover API per funzionare anche dentro i dialog. La UI distingue caricamento, salvataggio, dati assenti, filtri senza risultati ed errori.

`public/i18n/it.json` è l'unico catalogo: italiano come lingua iniziale e fallback, con ngx-translate. Le chiavi del backend sono tradotte tramite `errors.<errorCode>`, con un messaggio italiano generico per codici sconosciuti. I messaggi inglesi del backend non vengono mostrati come errori all'utente.

Il parser HTTP preserva i numeri decimali come stringhe, evitando la perdita di precisione del normale parsing JSON. `decimal.js` gestisce somme e normalizzazione; gli importi dei form vengono serializzati come stringhe decimali, accettate dai DTO `BigDecimal` del backend. La formattazione EUR e le date civili sono centralizzate.

I saldi non vengono modificati da movimenti o operazioni. Un saldo mancante non diventa zero e non viene sostituito dal mese precedente. Il grafico mantiene i mesi mancanti e segnala i periodi parziali; il dettaglio è disponibile anche come tabella accessibile.

Il layout occupa l'altezza della finestra. Nelle sei liste CRUD scorrono soltanto le righe della tabella: titolo, filtri, intestazioni e paginazione restano visibili. La panoramica usa lo scorrimento centrale per grafici e riepiloghi. `DataTable`, `Chip` e `Tabs` sono i componenti condivisi per tabelle, etichette e navigazione a sezioni; anche le tabelle integrate nella panoramica usano `DataTable`.

Il primo caricamento delle liste usa uno skeleton; durante filtri, ordinamenti e cambi di pagina le righe precedenti rimangono attenuate e non interattive fino alla nuova risposta. Un errore elimina i risultati precedenti e permette di riprovare. Le transizioni di pagine e righe sono brevi e rispettano la preferenza di movimento ridotto. Il selettore mese condiviso include le frecce precedente/successivo e mantiene il calendario per scegliere direttamente mese e anno.

Per la panoramica, il client legge tutte le pagine delle rilevazioni degli ultimi dodici mesi e dei movimenti del mese selezionato. Questo mantiene corretti i totali con le API CRUD iniziali. Le normali tabelle restano paginate: non caricano tutte le righe. Con una crescita significativa dei dati sarà opportuno introdurre aggregazioni dedicate sul backend.

## Verifica

```powershell
npm run lint
npm run format:check
npm test
npm run build
```

I test unitari coprono importi, precisione JSON, date, paginazione, traduzioni e calcoli della panoramica.

Per i test browser:

```powershell
npx playwright install chromium
npm run test:e2e
```

In alternativa, con Chrome già installato su Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = "chrome"
npm run test:e2e
```

I test Playwright simulano le API con dati sintetici e non scrivono nel database applicativo. Verificano i flussi CRUD, la validazione, i messaggi tradotti, filtri e paginazione, il layout mobile, il focus dei dialog e controlli automatici WCAG tramite axe. Le immagini di verifica vengono salvate in `test-results/`, escluso dal versionamento.

L'implementazione è stata verificata anche con il backend reale su un PostgreSQL temporaneo dedicato, usando solo dati sintetici. I controlli automatici di accessibilità sono accompagnati da una verifica della navigazione da tastiera; non costituiscono da soli una certificazione di conformità.

## Build e pubblicazione

`npm run build` produce i file statici in `dist/worthline/browser`. In produzione, il server deve inoltrare `/api` al backend e servire `index.html` per le rotte Angular. Non inserire credenziali o segreti nella configurazione del browser. Questa implementazione non effettua alcuna pubblicazione automatica.
