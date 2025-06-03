download-test-data:
	@echo "Creating demo-data directory..."
	@mkdir -p demo-data/audio demo-data/video
	@echo "Downloading test files..."
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8z" -o demo-data/audio/unsc_meeting_2023.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8y" -o demo-data/audio/diplomatic_presser_2024.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8x" -o demo-data/audio/negotiation_sample.mp3
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8w" -o demo-data/video/summit_meeting_2024.mp4
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8v" -o demo-data/video/press_briefing_2024.mp4
	@curl -L "https://media.un.org/en/asset/k1l/k1lw6j8j8u" -o demo-data/video/cross_cultural_negotiation.mp4
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_480_1_5MG.mp4" -o demo-data/video/sample_test_video.mp4
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_640_3MG.mp4" -o demo-data/video/sample_test_video_2.mp4
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_1280_10MG.mp4" -o demo-data/video/sample_test_video_3.mp4
	@curl -L "https://samplelib.com/mp4/sample-5s.mp4" -o demo-data/video/samplelib_5s.mp4
	@curl -L "https://samplelib.com/mp4/sample-10s.mp4" -o demo-data/video/samplelib_10s.mp4
	@curl -L "https://upload.wikimedia.org/wikipedia/commons/a/ac/President_Biden_Delivers_Remarks_On_The_Terrorist_Attacks_in_Israel_-_Oct_7,_2023.webm" -o demo-data/video/biden_israel_2023.webm
	@if command -v ffmpeg >/dev/null 2>&1; then \
	  ffmpeg -y -i demo-data/video/biden_israel_2023.webm -c:v libx264 -c:a aac demo-data/video/biden_israel_2023.mp4; \
	  echo "Converted Biden speech to MP4."; \
	else \
	  echo "ffmpeg not found, skipping WebM to MP4 conversion for Biden speech."; \
	fi
	@echo "Test data download complete!"

# Download a public sample MP4 file for testing
sample-mp4:
	@echo "Downloading sample MP4 video from file-examples.com..."
	@mkdir -p demo-data/video
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_480_1_5MG.mp4" -o demo-data/video/sample_test_video.mp4
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_640_3MG.mp4" -o demo-data/video/sample_test_video_2.mp4
	@curl -L "https://file-examples.com/wp-content/storage/2017/04/file_example_MP4_1280_10MG.mp4" -o demo-data/video/sample_test_video_3.mp4
	@curl -L "https://samplelib.com/mp4/sample-5s.mp4" -o demo-data/video/samplelib_5s.mp4
	@curl -L "https://samplelib.com/mp4/sample-10s.mp4" -o demo-data/video/samplelib_10s.mp4
	@echo "Sample MP4 video download complete!"

biden-speech:
	@echo "Downloading President Biden's public domain speech (WebM)..."
	@mkdir -p demo-data/video
	@curl -L "https://upload.wikimedia.org/wikipedia/commons/a/ac/President_Biden_Delivers_Remarks_On_The_Terrorist_Attacks_in_Israel_-_Oct_7,_2023.webm" -o demo-data/video/biden_israel_2023.webm
	@if command -v ffmpeg >/dev/null 2>&1; then \
	  ffmpeg -y -i demo-data/video/biden_israel_2023.webm -c:v libx264 -c:a aac demo-data/video/biden_israel_2023.mp4; \
	  echo "Converted Biden speech to MP4."; \
	else \
	  echo "ffmpeg not found, skipping WebM to MP4 conversion for Biden speech."; \
	fi
	@echo "Biden speech download (and conversion) complete!"