download-test-data:
	@echo "Creating test_data directory..."
	@mkdir -p test_data/audio test_data/video
	@echo "Downloading test files..."
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8z" -o test_data/audio/unsc_meeting_2023.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8y" -o test_data/audio/diplomatic_presser_2024.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8x" -o test_data/audio/negotiation_sample.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8w" -o test_data/video/summit_meeting_2024.mp4
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8v" -o test_data/video/press_briefing_2024.mp4
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8u" -o test_data/video/cross_cultural_negotiation.mp4
	@echo "Test data download complete!"