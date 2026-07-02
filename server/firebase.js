const admin = require('firebase-admin');

// Credentials are provided one of two ways:
//   1. FIREBASE_SERVICE_ACCOUNT — the full service-account JSON as a single
//      env var (recommended on Render / any host where you can't ship a file).
//   2. GOOGLE_APPLICATION_CREDENTIALS — path to a service-account JSON file
//      (handy for local dev). Falls back to applicationDefault().
function buildCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON: ' + e.message);
    }
    // When pasted into a dashboard, the private key's newlines often get
    // escaped as literal "\n" — restore them so the key parses.
    if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, '\n');
    return admin.credential.cert(json);
  }
  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: buildCredential() });
}

const db = admin.firestore();

module.exports = { admin, db };
