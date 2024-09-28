from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import speech_recognition as sr
from transformers import pipeline

app = Flask(__name__)
CORS(app)  # This will allow CORS for all routes

# Initialize the speech recognizer
recognizer = sr.Recognizer()

# Initialize the summarization pipeline for text
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_text(text, chunk_size=1000):
    """Summarize the provided text using the summarization model."""
    # Split text into manageable chunks
    chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
    
    # Summarize each chunk and collect the summaries
    summaries = []
    for chunk in chunks:
        summary = summarizer(chunk, max_length=50, min_length=25, do_sample=False)
        if summary:  # Check if summary is not empty
            summaries.append(summary[0]['summary_text'])
    
    # Combine the summaries into one text
    combined_summary = " ".join(summaries)
    return combined_summary


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

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    
    if 'text' in data:
        # Summarize text input
        text = data['text']
        summary = summarize_text(text)
        return jsonify(summary=summary)
    
    elif 'audio' in data:
        # Summarize audio input
        audio_base64 = data['audio']
        audio_data = base64.b64decode(audio_base64)  # Decode the base64 audio data
        summary = summarize_speech(audio_data)
        return jsonify(summary=summary)
    
    else:
        return jsonify(error="Invalid input. Please provide either text or audio."), 400

if __name__ == '__main__':
    app.run(port=5000)
