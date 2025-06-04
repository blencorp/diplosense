# DiploSense - Real-Time Diplomatic Intelligence Platform

A multimodal AI platform designed to support diplomats and policymakers during high-stakes negotiations by analyzing visual, textual, and cultural data in real time using advanced AI models.

## Multimodal AI Capabilities

DiploSense leverages cutting-edge AI models to provide comprehensive multimodal analysis:

- **🎥 Vision Analysis**: OpenAI GPT-4o Vision API for facial expression detection, microexpression analysis, and body language interpretation
- **🎤 Audio Processing**: OpenAI Whisper API for real-time speech transcription and audio analysis
- **📝 Text Intelligence**: OpenAI GPT-4o for diplomatic text analysis, sentiment analysis, and cultural context understanding
- **🤖 Multi-Agent Systems**: Coordinated AI agents for generating comprehensive diplomatic cables and risk assessments
- **🌍 Cultural AI**: Custom cultural intelligence engine enhanced by GPT-4o for cross-cultural communication analysis

## Features

- **Video Analysis**: Advanced facial expression and microexpression detection using computer vision
- **Body Language Analysis**: Posture, gesture, and non-verbal communication interpretation
- **Text Sentiment & Cultural Framing**: Advanced text analysis with cultural context awareness  
- **Cultural Context Engine**: Built-in rulebase for understanding cultural communication patterns
- **Auto Diplomatic Cable Generator**: Multi-agent AI pipeline for generating structured diplomatic reports
- **Real-time Dashboard**: Live visualization of negotiation dynamics and insights
- **Quick Demo**: Instant analysis using sample diplomatic meeting scenarios

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **AI/ML**: 
  - OpenAI GPT-4o Vision (facial expression & body language analysis)
  - OpenAI GPT-4o (text analysis, diplomatic intelligence, multi-agent reasoning)
  - OpenAI Whisper (speech-to-text transcription)
- **Database**: Supabase
- **Real-time Communication**: WebSockets
- **Infrastructure**: Docker Compose, Nginx

## Quick Start

### Prerequisites

- Docker and Docker Compose (v2.0+ recommended)
- OpenAI API key
- Supabase account (optional)

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory

2. Set up environment variables:

   ```bash
   cp api/.env.example api/.env
   # Edit api/.env with your configuration:
   # - OpenAI API key
   # - Supabase credentials  
   # - Admin password for usage analytics
   ```

3. Build and start all services:

   ```bash
   make up
   # OR
   docker compose up --build -d
   ```

4. Access the application:
   - Frontend: http://localhost:8080
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Admin Panel: http://localhost:8080/admin/usage (password protected)

5. View logs:

   ```bash
   make logs
   # OR
   docker compose logs -f
   ```

6. Stop services:

   ```bash
   make down
   # OR
   docker compose down
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

1. **Upload Video**: Use the upload panel to analyze video files or images
2. **Quick Demo**: Click "Quick Demo" to instantly analyze a sample diplomatic meeting scenario
3. **Text Analysis**: Analyze meeting transcripts with cultural context
4. **Real-time Analysis**: Watch as the system processes video and text data in real-time
5. **Dashboard Monitoring**: Monitor emotion scores, stress levels, and cultural indicators
6. **Generate Reports**: Create diplomatic cables with AI-generated insights and recommendations

## Admin Access

The usage analytics are protected by an admin interface:

- **URL**: http://localhost:8080/admin/usage
- **Authentication**: Password-protected login
- **Configuration**: Set admin password via `ADMIN_PASSWORD` environment variable
- **Features**: API usage tracking, cost analysis, request monitoring

Default admin password is `diplosense-admin-2024` but should be changed in production.

## API Endpoints

- `POST /api/v1/analyze/video` - Analyze video/images for facial expressions and body language
- `POST /api/v1/analyze/text` - Analyze text sentiment and cultural context
- `POST /api/v1/demo/analyze` - Run quick demo analysis with sample data
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

### Test Data Files

The `test_data` directory contains sample files for testing the platform's capabilities:

#### Video Files
- `summit_meeting_2024.mp4` - International summit meeting excerpt
- `press_briefing_2024.mp4` - Diplomatic press briefing  
- `cross_cultural_negotiation.mp4` - Cross-cultural negotiation simulation

The platform also includes a built-in **Quick Demo** feature that simulates analysis of a diplomatic meeting between American and Chinese delegates, demonstrating:
- Facial expression analysis
- Body language interpretation
- Cultural communication pattern detection
- Tension assessment and recommendations

To download these files, run:

```bash
make download-test-data
```

Note: These are sample files for testing purposes only. They are either in the public domain or used under fair use for educational purposes.

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