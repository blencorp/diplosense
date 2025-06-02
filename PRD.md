**Product Requirements Document (PRD): DiploSense – Real-Time Diplomatic Intelligence Fusion Platform**

---

### 1. **Overview**

DiploSense is a multimodal AI platform designed to support diplomats and policymakers during high-stakes negotiations by fusing audio, visual, textual, and cultural data in real time. It provides deep situational awareness by interpreting emotional tone, facial microexpressions, sentiment of written communications, and cultural context. The platform outputs real-time dashboards and AI-generated diplomatic summaries.

---

### 2. **Goals and Objectives**

* Deliver a demo-ready MVP in 40 hours for the SCSP AI Hackathon
* Demonstrate advanced multimodal reasoning capabilities of GPT-4o
* Help diplomats understand the emotional and cultural undercurrents of negotiations
* Showcase a novel, agentic workflow that interprets complex human signals

---

### 3. **Core Features**

#### 3.1 Voice & Emotion Analysis

* Use OpenAI Realtime API for transcription and real-time emotional tone detection
* Visualize a "negotiation temperature" based on vocal stress and tone

#### 3.2 Facial Microexpression Detection

* Extract frames from video input periodically
* Use GPT-4o image input to interpret microexpressions (e.g., anxiety, frustration, confidence)

#### 3.3 Text Sentiment & Cultural Framing

* Parse meeting notes or transcripts for sentiment polarity
* Cross-reference against known diplomatic norms to flag cultural friction

#### 3.4 Cultural Context Engine

* Maintain a mini rulebase for cultural norms (e.g., American directness vs. Japanese indirectness)
* Highlight communication mismatches using GPT-4o classification

#### 3.5 Auto Diplomatic Cable Generator

* Use a multi-agent GPT-4o pipeline to summarize emotional and factual insights
* Output structured reports with metadata tags (e.g., sentiment, risk level, action recommendations)

---

### 4. **System Architecture (MVP)**

* **Frontend:** TypeScript + React real-time dashboard
* **Backend:** Python (FastAPI) for API integration and workflow orchestration
* **LLM Orchestration:** OpenAI Realtime API, GPT-4o, Agents SDK
* **Storage:** Supabase (for storing cable output and cultural rulebase)

---

### 5. **User Workflow**

1. Upload or stream a diplomatic meeting (video + transcript)
2. Backend processes audio (tone), video (expression), and text (sentiment)
3. Dashboard updates in real time: tone graph, emotional indicators, and cultural flags
4. Agents generate a structured diplomatic brief ("cable") summarizing insights

---

### 6. **Demo Data Plan**

* Use publicly available video footage of real or mock diplomatic meetings (e.g., UN speeches, press conferences, publicly released negotiation footage)
* Transcribe audio using OpenAI Realtime API for tone/emotion analysis
* Use publicly accessible policy documents and diplomatic statements as textual input for sentiment and cultural tone analysis
* Include sample meeting notes written in different cultural communication styles (e.g., direct vs. indirect)
* Visual assets: tone graphs, facial emotion heatmaps, cultural mismatch highlights

### 7. **Success Criteria**

* Real-time dashboard displaying at least 3 modalities (voice, image, text)
* Working cable generator agent that outputs structured summaries
* Effective demo video showing full user flow and outputs
* High-scoring presentation on novelty, technical difficulty, and impact

---

### 8. **Stretch Goals (if time permits)**

* Cultural adaptation feedback: rewording suggestions to align with target culture
* Real-time coaching: in-meeting prompts to the diplomat based on live analysis
* Historical pattern matching using vector search for outcome prediction

---

**Prepared for the SCSP AI Hackathon – OpenAI Challenge Track**

