# Demo Data for DiploSense

This directory contains sample data for testing and demonstrating the DiploSense platform.

## Files

### sample-transcript.txt
A mock diplomatic trade negotiation transcript featuring representatives from different cultural backgrounds:
- American (direct, time-focused)
- Japanese (consensus-building, relationship-focused)
- German (data-driven, systematic)
- Chinese (long-term perspective, relationship-focused)
- British (diplomatic, compromise-seeking)
- French (philosophical, principled)

This transcript demonstrates various cultural communication styles and potential friction points that DiploSense can detect and analyze.

## Usage for Testing

1. **Text Analysis**: Copy content from sample-transcript.txt into the text analysis field
2. **Cultural Context**: Use cultures: "American, Japanese, German, Chinese, British, French"
3. **Expected Results**: The system should detect:
   - High directness gap between American/German and Japanese/Chinese participants
   - Time pressure language from American representative
   - Relationship-building language from Japanese/Chinese representatives
   - Potential cultural friction points
   - Recommendations for bridging communication styles

## Sample Analysis Scenarios

### Scenario 1: High-Stress Negotiation
- Use urgent language and time pressure
- Mix direct and indirect communication styles
- Expected: High stress detection, cultural mismatch warnings

### Scenario 2: Consensus Building
- Use collaborative language
- Include multiple cultural perspectives
- Expected: Positive sentiment, cultural harmony indicators

### Scenario 3: Cultural Friction
- Use direct criticism with face-saving cultures present
- Include impatient language
- Expected: Cultural warning flags, diplomatic recommendations

## Adding Custom Demo Data

You can add your own demo files:
- Audio files (WAV, MP3) for voice emotion analysis
- Images/videos for facial expression analysis
- Text files for sentiment and cultural analysis

Remember to respect privacy and use only public domain or permission-granted content for demonstrations.