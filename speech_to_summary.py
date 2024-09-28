import speech_recognition as sr
from transformers import pipeline

# Initialize the speech recognizer
recognizer = sr.Recognizer()

# Initialize the summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text):
    """Summarize the provided text using the summarization model."""
    summary = summarizer(text, max_length=150, min_length=30, do_sample=False)[0]['summary_text']
    return summary

def summarize_speech(audio_data):
    """Summarize the provided audio data."""
    with open("temp_audio.wav", "wb") as f:  # Save the audio data to a temporary file
        f.write(audio_data)

    with sr.AudioFile("temp_audio.wav") as source:  # Use the temporary audio file
        audio = recognizer.record(source)

        try:
            # Use Google Web Speech API for recognition
            text = recognizer.recognize_google(audio)
            print("Recognized Speech: " + text)
            
            # Summarize the recognized text
            summary = summarize_text(text)
            return summary

        except sr.UnknownValueError:
            return "Sorry, I could not understand the audio."
        except sr.RequestError as e:
            return f"Could not request results from Google Speech Recognition service; {e}"

if __name__ == "__main__":
    # For testing speech recognition directly from microphone (if needed)
    with sr.Microphone() as source:
        print("Please say something...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)

        print("Recognizing...")
        try:
            text = recognizer.recognize_google(audio)
            print("You said: " + text)
            summary = summarize_text(text)
            print("Summarized Text:\n", summary)

        except sr.UnknownValueError:
            print("Sorry, I could not understand the audio.")
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
