# Chinese Object Vocabulary Detector (词)

A full-stack web application designed for Chinese language learners. Users can point their device camera (live video stream or snapshot capture) or upload photos to detect everyday objects in real time.

Directly on top of each detected object's bounding box, the app overlays:
- **Simplified Chinese characters (Hanzi)** (e.g., `瓶子`, `杯子`, `电脑`)
- **Pinyin** with tone marks (e.g., `píngzi`, `bēizi`, `diànnǎo`)
- **English meaning** (e.g., `Bottle`, `Cup / Mug`, `Computer`)

Below the stage area, a clean results panel presents detailed vocabulary cards containing the proper **Chinese measure words** (`量词`, such as `本`, `个`, `支`, `张`, `台`, `把`), confidence score percentages, and text-to-speech audio pronunciation.

---

## Architecture Overview

```
chainesee/
├── backend/
│   ├── main.py              # FastAPI server with /api/detect, /api/vocab, /api/health
│   ├── detector.py          # OWLv2 zero-shot detection & Non-Maximum Suppression (NMS)
│   ├── vocab.json           # Single source of truth (25 target vocabulary items)
│   ├── requirements.txt     # Python dependencies
│   └── tests/
│       ├── test_vocab.py    # Pytest for 25-item vocabulary integrity and schema
│       ├── test_api.py      # Pytest for API endpoints, validation, and mocking
│       └── test_detector.py # Pytest for IoU and NMS suppression algorithms
├── frontend/
│   ├── src/
│   │   ├── components/      # Stage, Controls, ResultsPanel, Header, VocabModal, Toast
│   │   ├── utils/           # Chinese speech synthesis helper
│   │   ├── types.ts         # TypeScript definitions
│   │   ├── App.tsx          # Main application coordinator
│   │   └── test/            # Vitest unit & component test suite
│   ├── package.json
│   ├── vite.config.ts       # Vite configuration with /api proxy to localhost:8000
│   └── tailwind.config.js   # Tailored terracotta & dark slate color system
└── README.md
```

---

## OWLv2 Detection Characteristics & Tuning Guide

### Highly Accurate Objects
`google/owlv2-base-patch16-ensemble` is trained with vision-language contrastive alignment. It achieves high precision and high recall on distinct, medium-to-large objects with common visual archetypes:
* **Book (`书`)** (`detect_as: "book"`)
* **Computer / Laptop (`电脑`)** (`detect_as: "laptop"`)
* **Chair (`椅子`)** (`detect_as: "chair"`)
* **Bottle (`瓶子`)** (`detect_as: "bottle"`)
* **Cup / Mug (`杯子`)** (`detect_as: "cup"`)
* **Backpack (`书包`)** (`detect_as: "backpack"`)
* **Television (`电视`)** (`detect_as: "television"`)
* **Mobile Phone (`手机`)** (`detect_as: "mobile phone"`)
* **Bed (`床`)** (`detect_as: "bed"`)
* **Door (`门`)** and **Window (`窗户`)**

### Challenging Objects & Nuances
Certain items require extra care due to scale, thin profiles, or visual ambiguity:
1. **Chopsticks (`筷子`)** (`detect_as: "chopsticks"`): Thin, elongated cylindrical items often lying flat or partially occluded. Can be mistaken for pencils or cutlery when viewed from top-down angles.
2. **Wristwatch (`手表`)** (`detect_as: "wristwatch"`): Small relative to the overall image frame. When worn on a wrist, bounding box regression may enclose the entire hand or forearm unless zoomed in.
3. **Eyeglasses / Glasses (`眼镜`)** (`detect_as: "eyeglasses"`): Transparent lenses and thin frames can cause low contrast against complex backgrounds or faces.
4. **Paper (`纸`)** vs. **Notebook (`本子`)**: Overlapping semantic boundaries; a notebook opened flat may partially trigger both `notebook` and `paper`. Our built-in Non-Maximum Suppression (NMS) suppresses overlapping lower-confidence duplicates.
5. **Key (`钥匙`)**: Very small object; needs high-resolution close-up capture.

### Tuning the Confidence Threshold
* **Default Threshold (`0.15`)**: Balances recall and precision for zero-shot open-vocabulary detection without flooding false positives.
* **For Small Objects (Wristwatch, Chopsticks, Pen, Key)**: Lower the sensitivity slider to **`0.08 - 0.12`**.
* **For Clean Scenes with Prominent Objects (Laptop, Chair, Bottle, Bed)**: Increase sensitivity to **`0.20 - 0.25`** for strict precision.

---

## Quickstart & Setup Guide

### 1. Backend Setup (FastAPI & Python 3.11+)

```bash
# 1. Open a terminal and navigate to the project directory
cd /path/to/chainesee

# 2. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Start the FastAPI Uvicorn server on port 8000
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Setup (React, Vite, Tailwind CSS)

```bash
# 1. In a new terminal tab, navigate to the frontend directory
cd /path/to/chainesee/frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser. All API calls to `/api/*` are automatically proxied to `http://localhost:8000`.

---

## Running the Automated Test Suites

### Backend Unit & Integration Tests (Pytest)

The test suite validates:
1. Vocabulary data integrity (exactly 25 items, all required fields, valid uniqueness).
2. API endpoint responses (`/api/health`, `/api/vocab`, `/api/detect`).
3. Model mocking so tests run in milliseconds without downloading heavy weights.
4. Input validation (400 on non-image mime types, 400 on corrupted files, 413 on files > 10MB).
5. Non-Maximum Suppression (IoU calculation and duplicate suppression).

```bash
source .venv/bin/activate
pytest backend/tests -v
```

### Frontend Component Tests (Vitest & Testing Library)

The test suite validates:
1. Empty state rendering when no objects are detected.
2. Correct rendering of Chinese characters (`Hanzi`), pinyin, English translations, measure words, and confidence scores.
3. Card deduplication by highest score.
4. Selection and click event triggers.

```bash
cd frontend
npm test
```

---

## Pronunciation Audio (Neural TTS & Web Speech Fallback)

The application provides native Chinese pronunciation audio for detected vocabulary items via the "Listen" speaker button on each result card:

1. **Neural Chinese Text-to-Speech (`edge-tts`)**:
   - High-quality neural voices are generated by the backend using Microsoft Edge's online text-to-speech service (`edge-tts==7.3.1`).
   - **Environment Variable `TTS_VOICE`**: You can customize the voice by setting `TTS_VOICE` before starting the server.
     - Allowed values: `zh-CN-XiaoxiaoNeural` (default female voice), `zh-CN-YunxiNeural` (male voice), `zh-CN-XiaoyiNeural` (female voice).
     - Any unrecognized or missing voice automatically logs a warning and falls back to `zh-CN-XiaoxiaoNeural`. Clients cannot specify arbitrary voice names.
   - **Speech Rate and Pitch Adjustments (`TTS_RATE` and `TTS_PITCH`)**:
     - `TTS_RATE`: Configures playback speed (default `+0%`). Validated against `^[+-]\d{1,3}%$` (e.g. `+10%`, `-15%`).
     - `TTS_PITCH`: Configures pitch frequency (default `+0Hz`). Validated against `^[+-]\d{1,3}Hz$` (e.g. `+5Hz`, `-10Hz`).
     - Invalid values automatically fall back to their respective defaults (`+0%` and `+0Hz`).
   - **Service & Connectivity**: `edge-tts` is an unofficial Python client for Microsoft Edge's free online read-aloud service; it requires outbound internet access from the backend server to communicate with Microsoft endpoints. It is suitable for personal, experimental, and language-learning projects.
   - **In-Memory LRU Caching**: Synthesized audio is stored in an in-memory LRU cache (`max_items=256`), keyed by `(voice, rate, pitch, text)`, and returned with `Cache-Control: public, max-age=86400`, preventing repeated network requests for frequently scanned words.

2. **Resilient Fallback Behavior**:
   - If the backend TTS service is temporarily unavailable (e.g., offline mode, Microsoft service throttling, network timeout, or HTTP 503), the frontend automatically detects the issue and falls back to the browser's native **Web Speech API** (`window.speechSynthesis`).
   - The fallback creates a `SpeechSynthesisUtterance` with `lang="zh-CN"` and `rate=0.9`, preferring an installed Chinese voice whose language starts with `"zh"`, ensuring audio playback continues without user interruption.
   - If the user's browser does not support the Web Speech API, a friendly notification toast is displayed ("Could not play pronunciation. Try again.").

---

## Complete 25 Vocabulary Reference (`backend/vocab.json`)

| ID | Simplified (Hanzi) | Pinyin | English Meaning | Measure Word (`量词`) | Model Query (`detect_as`) |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 书 | shū | Book | 本 (běn) | book |
| 2 | 笔 | bǐ | Pen / Pencil | 支 (zhī) | pen |
| 3 | 纸 | zhǐ | Paper | 张 (zhāng) | paper |
| 4 | 本子 | běnzi | Notebook | 本 / 个 (běn / gè) | notebook |
| 5 | 书包 | shūbāo | Backpack / Schoolbag | 个 (gè) | backpack |
| 6 | 手机 | shǒujī | Mobile Phone | 部 / 个 (bù / gè) | mobile phone |
| 7 | 电脑 | diànnǎo | Computer | 台 (tái) | laptop |
| 8 | 钥匙 | yàoshi | Key | 把 (bǎ) | key |
| 9 | 钱包 | qiánbāo | Wallet | 个 (gè) | wallet |
| 10 | 手表 | shǒubiǎo | Wristwatch | 块 (kuài) | wristwatch |
| 11 | 眼镜 | yǎnjìng | Glasses | 副 (fù) | eyeglasses |
| 12 | 雨伞 | yǔsǎn | Umbrella | 把 (bǎ) | umbrella |
| 13 | 桌子 | zhuōzi | Table / Desk | 张 (zhāng) | table |
| 14 | 椅子 | yǐzi | Chair | 把 (bǎ) | chair |
| 15 | 床 | chuáng | Bed | 张 (zhāng) | bed |
| 16 | 门 | mén | Door | 扇 (shàn) | door |
| 17 | 窗户 | chuānghu | Window | 扇 (shàn) | window |
| 18 | 镜子 | jìngzi | Mirror | 面 (miàn) | mirror |
| 19 | 电视 | diànshì | Television | 台 (tái) | television |
| 20 | 杯子 | bēizi | Cup / Mug | 个 (gè) | cup |
| 21 | 碗 | wǎn | Bowl | 个 / 只 (gè / zhī) | bowl |
| 22 | 盘子 | pánzi | Plate | 个 (gè) | plate |
| 23 | 筷子 | kuàizi | Chopsticks | 双 (shuāng) | chopsticks |
| 24 | 勺子 | sháozi | Spoon | 把 (bǎ) | spoon |
| 25 | 瓶子 | píngzi | Bottle | 个 (gè) | bottle |

