# Hinter - Local Voice-Activated AI Co-Pilot

Hinter is a fully local, voice-activated AI assistant designed for real-time speech-to-text (STT) transcription and contextual AI assistance. It listens to your microphone and system audio, generates live transcripts, and leverages advanced Large Language Models (LLMs) to provide immediate, context-aware responses, code hints, or guidance.

## Key Features

* **Privacy First (100% Local Inference):** All speech recognition and LLM generation processes run entirely on your hardware. No cloud APIs, no subscriptions, and absolute data privacy.
* **Multi-Engine Speech Recognition:** Switch seamlessly between different STT engines based on your hardware capabilities and accuracy requirements:
  * `Whisper` - High accuracy transcription.
  * `Vosk` - Balanced performance and resource usage.
  * `Sherpa-ONNX` - Ultra-fast, low-latency streaming recognition.
* **Vision Capabilities:** Integrated support for Gemma 4 Vision models via an external projector (`mmproj`). By pressing `Alt+Enter`, the application captures your current screen state and allows the AI to provide context-aware answers based on visual data (e.g., analyzing code in your IDE or reading UI elements).
* **Modern Interface:** Built with Tauri, offering a lightweight desktop footprint. The UI includes dynamic audio visualizers, a dedicated transcript view, and an interactive LLM response dashboard.
* **Auto-Reply & Manual Override:** Enable auto-reply to have the AI seamlessly interject with hints during a conversation, or use the manual text input to type queries directly alongside the live voice transcription.
* **In-App Model Management:** Download, configure, and manage STT models and GGUF-formatted LLMs (such as Llama 3, Qwen 2.5, and Gemma 4) directly through the settings menu.

## Architecture & Tech Stack

* **Frontend:** Tauri, TypeScript, HTML, CSS (Vanilla, dependency-light approach).
* **Backend:** Python 3.10+, WebSockets, `llama-cpp-python`, `faster-whisper`, `vosk`, `sherpa-onnx`.

## Prerequisites

Before installing Hinter, ensure your system meets the following requirements:
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **C++ Build Tools** (Required for compiling `llama-cpp-python`)
* **CUDA Toolkit** (Optional but highly recommended for NVIDIA GPU hardware acceleration)

## Installation Guide

The project is divided into a Python backend and a Tauri frontend. You need to set up both.

### 1. Backend Setup (Python)

Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv

Activate the virtual environment:

    On Windows: venv\Scripts\activate

    On macOS/Linux: source venv/bin/activate

Install the required dependencies:
Bash

pip install -r requirements.txt

Note for GPU Users: To enable hardware acceleration for LLM generation, you must install the specific version of llama-cpp-python compiled for your CUDA version. For example, for CUDA 12.1:
Bash

pip uninstall llama-cpp-python
pip install llama-cpp-python --extra-index-url [https://abetlen.github.io/llama-cpp-python/whl/cu121](https://abetlen.github.io/llama-cpp-python/whl/cu121)

2. Frontend Setup (Tauri)

Return to the root directory of the project and install the Node.js dependencies:
Bash

npm install

Running the Application

To operate Hinter, you must run both the backend core and the frontend application.

    Start the Audio Engine:
    Open a terminal, activate your Python virtual environment, and run the engine:
    Bash

    cd backend
    python audio_engine.py

    Wait until you see the "Starting Hinter Core..." message indicating the WebSocket server is running on port 8765.

    Start the User Interface:
    Open a separate terminal in the project root and launch the Tauri app:
    Bash

    npm run tauri dev

    To build a standalone executable for production, use npm run tauri build instead.

Configuration and AI Roles

The behavior, persona, and strict instructions for the AI are defined by system prompts. These are stored in plain text files located in the root directory of the project:

    system_prompt_ru.txt

    system_prompt_eng.txt

You can edit these files directly using any text editor to fine-tune the AI's role (e.g., instructing it to act as a senior software engineer or an interview evaluator). Alternatively, you can edit the prompt directly within the application's settings panel.
License

This project is licensed under the MIT License. See the LICENSE file for details.