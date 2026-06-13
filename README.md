# 🔥 FireWatch AI

**AI-powered emergency fire reporting platform** that uses a pre-trained MobileNet image classifier to assess fire severity from citizen-submitted images and route reports to fire stations by priority.

> **Phase 1 MVP** — Hackathon submission (4-day build, demo-ready)

---

## 📐 Architecture

```
┌─────────────────┐     POST /report     ┌──────────────────────────────┐
│  Citizen App    │ ──────────────────── │  FastAPI Backend             │
│  (Expo / RN)    │                      │                              │
│                 │  GET /incident/{id}  │  ┌────────────────────────┐  │
│  • Report Fire  │ ◄────────────────── │  │  ML Inference Module   │  │
│  • Track Status │                      │  │  MobileNet .h5 model   │  │
└─────────────────┘                      │  │  128×128, 4-class      │  │
                                         │  └────────────────────────┘  │
┌─────────────────┐  GET /incidents      │                              │
│  Fire Station   │ ◄────────────────── │  ┌────────────────────────┐  │
│  Dashboard      │                      │  │  SQLite Database       │  │
│  (Next.js)      │  PATCH /incident/    │  │  (SQLAlchemy ORM)      │  │
│                 │ ──────────────────── │  └────────────────────────┘  │
│  • Table view   │    {id}/status       │                              │
│  • Map view     │                      │  ┌────────────────────────┐  │
│  • Actions      │                      │  │  Local File Storage    │  │
└─────────────────┘                      │  │  (uploads/)            │  │
                                         │  └────────────────────────┘  │
                                         └──────────────────────────────┘
```

Both client apps communicate through the **same FastAPI backend**. The ML model is invoked **only** on `POST /report`.

---

## 🧠 Model Details

| Property | Value |
|---|---|
| Architecture | MobileNet (ImageNet pretrained, frozen) + GlobalAveragePooling2D + Dense(128, ReLU) + Dropout(0.5) + Dense(4, Softmax) |
| Input Shape | 128 × 128 × 3 |
| Preprocessing | Resize to 128×128, normalize /255.0 |
| Training Performance | ~91% accuracy, F1 > 0.80 across classes |
| Inference Latency | ~429ms per image |
| File | `MobileNet_model.h5` (14.7 MB) |

### Class Index Mapping

The model's softmax output indices (confirmed from `flow_from_directory` alphabetical ordering):

| Index | Training Folder | App Label |
|---|---|---|
| 0 | Fake | No Fire |
| 1 | HIGH (1) | High |
| 2 | LOW (1) | Low |
| 3 | MEDIUM (1) | Medium |

### Critical Derivation Rule ⚠️

> **Known gap — transparent for judging**

The model outputs 4 classes. The app uses a 5-tier severity scale by adding **Critical**:

```
IF model predicts "High" AND confidence ≥ 0.90 → "Critical" (priority 100)
ELSE → pass-through (High=75, Medium=50, Low=25, No Fire=0)
```

This rule is:
- Isolated in **one function**: `backend/app/ml/severity.py → derive_severity()`
- Configurable via `CRITICAL_CONFIDENCE_THRESHOLD` env var (default: 0.90)
- Documented as a post-processing heuristic, not a model output

### Priority Mapping

| Severity | Priority Score |
|---|---|
| Critical | 100 |
| High | 75 |
| Medium | 50 |
| Low | 25 |
| No Fire | 0 |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Citizen App | React Native + Expo (TypeScript) |
| Dashboard | Next.js 16 + React (TypeScript) |
| Backend | FastAPI (Python) |
| Database | SQLite + SQLAlchemy (async) |
| ML | TensorFlow/Keras (MobileNet .h5) |
| Storage | Local filesystem (Supabase-swappable) |
| Map | Google Maps JavaScript API |

---

## 🚀 Local Setup

### Prerequisites

- **Python 3.10+** (with pip)
- **Node.js 18+** (with npm)
- **Expo CLI**: `npm install -g expo-cli` (optional — `npx expo` works too)
- **Expo Go app** on your phone (for mobile testing)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Ensure MobileNet_model.h5 is in the project root (d:\FARAWAY\)
# The default MODEL_PATH=../MobileNet_model.h5 points there

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will:
1. Load the MobileNet model into memory (~2-3s)
2. Create the SQLite database (`firewatch.db`)
3. Create the uploads directory
4. Start serving on http://localhost:8000

**API docs**: http://localhost:8000/docs (Swagger UI)

### 2. Fire Station Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here (optional)

# Start dev server
npm run dev
```

Dashboard will be at http://localhost:3000

### 3. Citizen App (Expo)

```bash
cd citizen-app

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env:
#   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
#   (Use your machine's IP, not localhost, for physical device)

# Start Expo
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

> **Tip**: For Android emulator, use `http://10.0.2.2:8000` as the API URL.
> For iOS simulator, use `http://localhost:8000`.

---

## 🗺️ Google Maps Setup

The dashboard's map view requires a Google Maps JavaScript API key.

### Getting a Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a project (or select existing)
3. Enable the **Maps JavaScript API**
4. Create an API key under **Credentials**
5. Set it in `dashboard/.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

> **Free tier is sufficient**: Google provides $200/month in Maps API credits, more than enough for the demo.

> **Graceful degradation**: If no API key is configured, the map view shows a friendly message. The table view works normally without it.

---

## 📁 Project Structure

```
FARAWAY/
├── MobileNet_model.h5              # Pre-trained model (14.7 MB)
├── FireDataset.ipynb               # Training notebook (reference)
├── ICONAT2025_Paper1762.pdf        # Research paper (reference)
├── README.md                       # This file
│
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # App entry + lifespan
│   │   ├── config.py               # Settings (env vars)
│   │   ├── database.py             # SQLAlchemy async setup
│   │   ├── models.py               # Incident ORM model
│   │   ├── schemas.py              # Pydantic schemas
│   │   ├── routes/
│   │   │   └── incidents.py        # API endpoints
│   │   ├── ml/
│   │   │   ├── model.py            # Model loader (singleton)
│   │   │   ├── inference.py        # Preprocessing + prediction
│   │   │   └── severity.py         # 4→5 tier + Critical rule
│   │   └── storage/
│   │       └── local.py            # File storage
│   ├── requirements.txt
│   └── .env.example
│
├── citizen-app/                    # Expo mobile app
│   ├── app/(tabs)/
│   │   ├── _layout.tsx             # Tab navigation
│   │   ├── index.tsx               # Report Fire screen
│   │   └── two.tsx                 # Status Tracking screen
│   ├── services/
│   │   └── api.ts                  # Backend API client
│   ├── components/
│   │   └── StatusBadge.tsx         # Status indicator
│   └── .env.example
│
├── dashboard/                      # Next.js dashboard
│   ├── src/app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page (table + map)
│   │   ├── globals.css             # Design system
│   │   └── components/
│   │       ├── IncidentTable.tsx    # Sortable table
│   │       ├── IncidentMap.tsx      # Google Maps view
│   │       ├── SeverityBadge.tsx    # Color-coded badge
│   │       ├── StatusBadge.tsx      # Status indicator
│   │       ├── ActionButtons.tsx    # Accept/Dispatch/Resolve
│   │       └── DashboardHeader.tsx  # Header + stats
│   └── .env.example
```

---

## 🌐 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/report` | Submit fire report (image + GPS + description) |
| `GET` | `/incident/{id}` | Get status + timestamps (citizen-facing, no severity) |
| `GET` | `/incidents` | List all incidents by priority (dashboard-facing) |
| `PATCH` | `/incident/{id}/status` | Update status (dashboard actions) |
| `GET` | `/health` | Health check |

---

## 🚢 Deployment

### Backend → Render / Railway

1. Push `backend/` to a Git repo
2. Set environment variables (especially `MODEL_PATH`, `DATABASE_URL`)
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Upload `MobileNet_model.h5` or use a persistent storage volume

### Dashboard → Vercel

1. Push `dashboard/` to a Git repo
2. Connect to Vercel, set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Framework preset: Next.js (auto-detected)

### Database → Supabase (Production)

1. Create a Supabase project
2. Get the PostgreSQL connection string
3. Set `DATABASE_URL=postgresql+asyncpg://...` in the backend env
4. Add `asyncpg` to requirements.txt

---

## 🎤 Demo Narrative Tips

1. **Start with the problem**: Citizen-reported fires need rapid triage
2. **Show the citizen flow**: Capture image → auto GPS → submit → get ID
3. **Show the dashboard**: Real-time table with severity colors, sort by priority
4. **Demo the model**: Show how different fire images get classified
5. **Explain Critical**: "We extend the model's 4-class output with a confidence-based rule for Critical severity — here's the threshold, here's where to tune it"
6. **Show the map**: Toggle to map view — severity-colored markers with InfoWindows
7. **Status updates**: Accept → Dispatch → Resolve flow from dashboard, citizen sees progress
8. **Architecture**: Clean separation — model frozen, inference isolated, database swappable

---

## ⚠️ Known Limitations

- **No authentication** — MVP scope, no user accounts
- **Critical class** — Derived heuristic, not model-trained (documented above)
- **Model accuracy** — ~91% overall; may misclassify edge cases
- **GPS accuracy** — Depends on device hardware and environment
- **SQLite** — Single-writer; swap to PostgreSQL for production

---

## 📄 License

Hackathon project — FireWatch AI Team
