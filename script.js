let isRecording = false;
let recognition;
const startButton = document.getElementById("start-recording");
const summarizeButton = document.getElementById("summarize");
const textInput = document.getElementById("text-input");
const submitTextButton = document.getElementById("submit-text");
const transcriptDiv = document.getElementById("transcript");
const speechSummaryDiv = document.getElementById("speech-summary");
const textSummaryDiv = document.getElementById("text-summary");
const speechStatusMessage = document.getElementById("speech-status-message");
const textStatusMessage = document.getElementById("text-status-message");
const speechNotesDiv = document.getElementById("speech-notes");
const textNotesDiv = document.getElementById("text-notes");

// Navbar elements
const speechNavButton = document.getElementById("speech-nav");
const textNavButton = document.getElementById("text-nav");
const speechSection = document.getElementById("speech-section");
const textSection = document.getElementById("text-section");

// Theme toggle button
const themeToggleButton = document.getElementById("theme-toggle");

// Navbar navigation functionality
speechNavButton.addEventListener("click", switchToSpeechMode);
textNavButton.addEventListener("click", switchToTextMode);
themeToggleButton.addEventListener("click", toggleTheme);

function switchToSpeechMode() {
    speechSection.classList.remove("hidden");
    textSection.classList.add("hidden");
    speechNavButton.classList.add("active");
    textNavButton.classList.remove("active");
    transcriptDiv.textContent = ""; // Clear previous transcripts
    speechStatusMessage.textContent = ""; // Clear the status message
    speechSummaryDiv.classList.add("hidden"); // Hide speech summary
    speechNotesDiv.classList.add("hidden"); // Hide speech notes
}

function switchToTextMode() {
    speechSection.classList.add("hidden");
    textSection.classList.remove("hidden");
    textNavButton.classList.add("active");
    speechNavButton.classList.remove("active");
    textSummaryDiv.classList.add("hidden"); // Hide text summary
    textInput.value = ""; // Clear text input
    textStatusMessage.textContent = ""; // Clear the status message
    textNotesDiv.classList.add("hidden"); // Hide text notes
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
    speechStatusMessage.textContent = "Recording in progress...";
    speechStatusMessage.classList.add("recording-indicator");

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Get interim results

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');
        transcriptDiv.textContent = transcript;
        summarizeButton.disabled = false; // Enable summarize button
    };

    recognition.onerror = (event) => {
        speechStatusMessage.textContent = "Error in recognition: " + event.error;
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
    speechStatusMessage.textContent = "Processing the recorded audio...";
    speechStatusMessage.classList.remove("recording-indicator");
    speechStatusMessage.classList.add("processing-indicator");
    recognition.stop();
}

// Summarize from recorded speech
summarizeButton.addEventListener("click", async () => {
    const text = transcriptDiv.textContent;
    if (text) {
        speechStatusMessage.textContent = "Summarizing speech...";
        const summary = await getSummary(text);
        speechSummaryDiv.textContent = summary;
        speechSummaryDiv.classList.remove("hidden");
        speechNotesDiv.innerHTML = generateNotes(summary); // Generate notes from summary
        speechNotesDiv.classList.remove("hidden");
        speechStatusMessage.textContent = "Summarization complete.";
        highlightImportantInfo(summary); // Highlight key points
    } else {
        speechStatusMessage.textContent = "No speech recorded to summarize.";
    }
});

// Summarize from text input
submitTextButton.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (text) {
        textStatusMessage.textContent = "Processing text input...";
        const summary = await getSummary(text);
        textSummaryDiv.textContent = summary;
        textSummaryDiv.classList.remove("hidden");
        textNotesDiv.innerHTML = generateNotes(summary); // Generate notes from summary
        textNotesDiv.classList.remove("hidden");
        textStatusMessage.textContent = "Summarization complete.";
        highlightImportantInfo(summary); // Highlight key points
    } else {
        textStatusMessage.textContent = "Please enter text to summarize.";
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

// Function to generate structured notes from the summary
function generateNotes(summary) {
    const notesArray = summary.split('.'); // Split the summary into sentences
    const notesHTML = notesArray.map(note => {
        const trimmedNote = note.trim();
        if (trimmedNote) {
            return `<li>${trimmedNote}</li>`; // Create a bullet point for each sentence
        }
        return '';
    }).join('');
    return `<ul>${notesHTML}</ul>`; // Wrap in unordered list
}

// Highlight important information
function highlightImportantInfo(summary) {
    const highlightedInfo = summary.split('.').map(sentence => {
        const trimmedSentence = sentence.trim();
        return `<span class="highlight">${trimmedSentence}</span>`; // Highlight each sentence
    }).join(' ');
    document.getElementById("highlighted-info").innerHTML = highlightedInfo; // Show highlights
}

// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle("dark");
    themeToggleButton.textContent = document.body.classList.contains("dark") ? "Switch to Light Mode" : "Switch to Dark Mode"; // Update button text
}
