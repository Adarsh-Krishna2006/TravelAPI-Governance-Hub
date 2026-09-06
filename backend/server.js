import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes.js';
import { readDB, writeDB, getEnrichedApis } from './database.js';
import { runFullAnalysis } from './analyser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Production JWT_SECRET requirement check
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '')) {
  console.error("FATAL SECURITY ERROR: JWT_SECRET environment variable is required in production mode.");
  process.exit(1);
}

// Configurable CORS via FRONTEND_URL or permissive for development
const frontendUrl = process.env.FRONTEND_URL;
app.use(cors({
  origin: frontendUrl && frontendUrl !== '*' ? frontendUrl : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach API endpoints
app.use('/api', apiRouter);

// Serve Frontend Static files if build exists (production fallback)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to React app router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
    if (err) {
      res.status(200).send("TravelAPI Governance Hub Backend running. Frontend dist bundle not found; run development server using 'npm run dev'.");
    }
  });
});

// Safe Error-handler middleware (Edge Case: Adversarial Spec shouldn't crash app)
app.use((err, req, res, next) => {
  console.error("Express Error Interceptor:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
    logs: ["Server caught uncaught exception safely. Exception logged."]
  });
});

// Boot the server and run initial duplicate detection
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` TravelAPI Governance Hub Booted Successfully!`);
    console.log(` Access Backend APIs at http://localhost:${PORT}/api`);
    console.log(`=========================================`);

    try {
      const db = readDB();
      console.log(`DB Loaded: ${db.apis.length} APIs indexed, ${db.users.length} mock users, ${db.endpoints.length} endpoints.`);
      
      // Automatically trigger initial analysis on boot if none exists
      if (!db.duplicate_findings || db.duplicate_findings.length === 0) {
        console.log(`Running initial duplicate analysis scan on enriched APIs...`);
        const enriched = getEnrichedApis(db);
        const results = runFullAnalysis(enriched, db.settings);
        
        db.duplicate_findings = results;
        writeDB(db);
        console.log(`Initial analysis complete: generated ${results.length} unique pair records.`);
      }
    } catch (e) {
      console.error("Failed to run startup duplication scan", e);
    }
  });
}

export default app;
