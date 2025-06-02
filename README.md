# DiploSense - Real-Time Diplomatic Intelligence Fusion Platform

A multimodal AI platform designed to support diplomats and policymakers during high-stakes negotiations by fusing audio, visual, textual, and cultural data in real time.

## Features

- **Voice & Emotion Analysis**: Real-time emotional tone detection using OpenAI's audio processing
- **Facial Microexpression Detection**: Computer vision analysis of facial expressions and microexpressions
- **Text Sentiment & Cultural Framing**: Advanced text analysis with cultural context awareness
- **Cultural Context Engine**: Built-in rulebase for understanding cultural communication patterns
- **Auto Diplomatic Cable Generator**: Multi-agent AI pipeline for generating structured diplomatic reports
- **Real-time Dashboard**: Live visualization of negotiation dynamics and insights

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **AI/ML**: OpenAI GPT-4o, Whisper API
- **Database**: Supabase
- **Real-time Communication**: WebSockets

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key
- Supabase account (optional)

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory

2. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and Supabase credentials
   ```

3. Build and start all services:

   ```bash
   make up
   # OR
   docker-compose up --build -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. View logs:

   ```bash
   make logs
   # OR
   docker-compose logs -f
   ```

6. Stop services:

   ```bash
   make down
   # OR
   docker-compose down
   ```

### Local Development Setup

If you prefer to run services locally:

1. Install dependencies:

   ```bash
   make install
   ```

2. Start the backend:

   ```bash
   cd api && python main.py
   ```

3. Start the frontend:

   ```bash
   cd web && npm run dev
   ```

## Usage

1. **Upload Media**: Use the upload panel to analyze audio files, video/images, or text
2. **Real-time Analysis**: Watch as the system processes multimodal data in real-time
3. **Dashboard Monitoring**: Monitor emotion scores, stress levels, and cultural indicators
4. **Generate Reports**: Create diplomatic cables with AI-generated insights and recommendations

## API Endpoints

- `POST /api/v1/analyze/audio` - Analyze audio for emotional tone
- `POST /api/v1/analyze/video` - Analyze video/images for facial expressions
- `POST /api/v1/analyze/text` - Analyze text sentiment and cultural context
- `POST /api/v1/generate/cable` - Generate diplomatic cable
- `WS /api/v1/ws/{meeting_id}` - WebSocket for real-time updates

## Cultural Context Engine

The platform includes a sophisticated cultural analysis engine that understands:

- Communication styles (direct vs. indirect)
- Formality levels
- Cultural negotiation patterns
- Potential friction points between cultures
- Adaptive recommendations for cross-cultural communication

Supported cultures include American, Japanese, German, Chinese, British, and French communication patterns.

## Demo Data

For demonstration purposes, the platform can analyze:

- Public diplomatic meeting footage
- Sample diplomatic transcripts
- Mock negotiation scenarios
- Cross-cultural communication examples

## Development

### Project Structure

```
diplosense/
├── api/                    # FastAPI backend
│   ├── main.py            # Main application entry
│   ├── config.py          # Configuration settings
│   ├── models/            # Pydantic models
│   ├── routes/            # API routes
│   └── services/          # Business logic services
├── web/                   # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # App entry point
│   └── public/
└── README.md
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

Built for the SCSP AI Hackathon - OpenAI Challenge Track

Demonstrates advanced multimodal reasoning capabilities of GPT-4o for diplomatic intelligence applications.