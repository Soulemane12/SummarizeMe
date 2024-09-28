let isRecording = false;
let recognition;
const startButton = document.getElementById("start-recording");
const summarizeButton = document.getElementById("summarize");
const textInput = document.getElementById("text-input");
const submitTextButton = document.getElementById("submit-text");
const transcriptDiv = document.getElementById("transcript");
const summaryDiv = document.getElementById("summary");
const statusMessage = document.getElementById("status-message");

// Navbar elements
const speechNavButton = document.getElementById("speech-nav");
const textNavButton = document.getElementById("text-nav");
const speechSection = document.getElementById("speech-section");
const textSection = document.getElementById("text-section");

// Navbar navigation functionality
speechNavButton.addEventListener("click", () => {
    switchToSpeechMode();
});

textNavButton.addEventListener("click", () => {
    switchToTextMode();
});

function switchToSpeechMode() {
    speechSection.classList.remove("hidden");
    textSection.classList.add("hidden");
    speechNavButton.classList.add("active");
    textNavButton.classList.remove("active");
    summaryDiv.classList.add("hidden");
    statusMessage.textContent = ""; // Clear the status message
    transcriptDiv.textContent = ""; // Clear previous transcripts
}

function switchToTextMode() {
    speechSection.classList.add("hidden");
    textSection.classList.remove("hidden");
    textNavButton.classList.add("active");
    speechNavButton.classList.remove("active");
    summaryDiv.classList.add("hidden");
    statusMessage.textContent = ""; // Clear the status message
    textInput.value = ""; // Clear text input
}

// Handle speech recognition
startButton.addEventListener("click", () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

function startRecording() {
    startButton.textContent = "Stop Recording";
    isRecording = true;
    transcriptDiv.textContent = "Recording...";
    transcriptDiv.classList.remove("hidden");
    statusMessage.textContent = "Recording in progress...";
    statusMessage.classList.add("recording-indicator");

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Get interim results

    recognition.start();

    recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');
        transcriptDiv.textContent = transcript;
        summarizeButton.disabled = false; // Enable summarize button
    };

    recognition.onerror = (event) => {
        statusMessage.textContent = "Error in recognition: " + event.error;
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start(); // Automatically restart recognition if still recording
        }
    };
}

function stopRecording() {
    startButton.textContent = "Start Recording";
    isRecording = false;
    statusMessage.textContent = "Processing the recorded audio...";
    statusMessage.classList.remove("recording-indicator");
    statusMessage.classList.add("processing-indicator");
    recognition.stop();
}

// Summarize from recorded speech
summarizeButton.addEventListener("click", async () => {
    const text = transcriptDiv.textContent;
    if (text) {
        const summary = await getSummary(text);
        summaryDiv.textContent = summary;
        summaryDiv.classList.remove("hidden");
        statusMessage.textContent = "Summarization complete.";
    } else {
        statusMessage.textContent = "No speech recorded to summarize.";
    }
});

// Summarize from text input
submitTextButton.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (text) {
        statusMessage.textContent = "Processing text input...";
        const summary = await getSummary(text);
        summaryDiv.textContent = summary;
        summaryDiv.classList.remove("hidden");
        statusMessage.textContent = "Summarization complete.";
    } else {
        statusMessage.textContent = "Please enter text to summarize.";
    }
});

// Function to send text to the server for summarization
async function getSummary(text) {
    try {
        const response = await fetch('http://localhost:5000/summarize', { // Replace with your server URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }), // Sending text for summarization
        });

        if (response.ok) {
            const data = await response.json();
            return data.summary;
        } else {
            return "Error summarizing text.";
        }
    } catch (error) {
        return "Error: Unable to fetch summary.";
    }
}
