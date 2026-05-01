import os

import site
for sp in site.getsitepackages():
    cublas_path = os.path.join(sp, "nvidia", "cublas", "bin")
    cudnn_path = os.path.join(sp, "nvidia", "cudnn", "bin")
    if os.path.exists(cublas_path): os.environ["PATH"] = cublas_path + os.pathsep + os.environ["PATH"]
    if os.path.exists(cudnn_path): os.environ["PATH"] = cudnn_path + os.pathsep + os.environ["PATH"]
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

import multiprocessing
import asyncio
import websockets
import json
import soundcard as sc
import numpy as np
import warnings
import shutil
import webrtcvad
import collections
from huggingface_hub import hf_hub_download

import psutil
try:
    import GPUtil
    HAS_GPUTIL = True
except ImportError:
    HAS_GPUTIL = False

warnings.filterwarnings("ignore", category=sc.SoundcardRuntimeWarning)

global_model = None
global_model_name = None
global_llm = None
global_llm_name = None

stop_llm_flag = False
CANCEL_DOWNLOADS = set()

VOSK_MODELS_INFO = {
    "vosk-model-small-ru-0.22": {"url": "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip", "size": 45_000_000},
    "vosk-model-ru-0.22": {"url": "https://alphacephei.com/vosk/models/vosk-model-ru-0.22.zip", "size": 1_500_000_000},
    "vosk-model-ru-0.42": {"url": "https://alphacephei.com/vosk/models/vosk-model-ru-0.42.zip", "size": 1_800_000_000},
    "vosk-model-small-en-us-0.15": {"url": "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip", "size": 40_000_000},
    "vosk-model-en-us-0.22-lgraph": {"url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip", "size": 128_000_000},
    "vosk-model-en-us-0.22": {"url": "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip", "size": 1_800_000_000}
}

SHERPA_MODELS_INFO = {
    "sherpa-onnx-streaming-zipformer-small-ru-vosk-2025-08-16": {"url": "csukuangfj/sherpa-onnx-streaming-zipformer-small-ru-vosk-2025-08-16", "size": 45_000_000},
    "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10": {"url": "moeru-ai/sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10", "size": 150_000_000},
    "sherpa-onnx-streaming-zipformer-en-20M-2023-02-17": {"url": "csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17", "size": 65_000_000},
    "sherpa-onnx-streaming-zipformer-en-2023-06-26": {"url": "csukuangfj/sherpa-onnx-streaming-zipformer-en-2023-06-26", "size": 140_000_000}
}

MODELS_INFO = {
    "tiny": {"size": 75_000_000},
    "base": {"size": 145_000_000},
    "small": {"size": 460_000_000},
    "medium": {"size": 1_500_000_000},
    "large-v3": {"size": 3_000_000_000}
}

LLM_MODELS_INFO = {
    "gemma-4-e2b": {"repo": "bartowski/google_gemma-4-E2B-it-GGUF", "file": "google_gemma-4-E2B-it-Q4_K_M.gguf", "size": 3_460_000_000},
    "gemma-4-e4b": {"repo": "bartowski/google_gemma-4-E4B-it-GGUF", "file": "google_gemma-4-E4B-it-Q4_K_M.gguf", "size": 5_410_000_000},
    "gemma-4-26b": {"repo": "bartowski/google_gemma-4-26B-A4B-it-GGUF", "file": "google_gemma-4-26B-A4B-it-Q4_K_M.gguf", "size": 17_040_000_000},
    "gemma-4-31b": {"repo": "bartowski/google_gemma-4-31B-it-GGUF", "file": "google_gemma-4-31B-it-Q4_K_M.gguf", "size": 19_600_000_000},
    "llama-3.2-1b": {"repo": "bartowski/Llama-3.2-1B-Instruct-GGUF", "file": "Llama-3.2-1B-Instruct-Q4_K_M.gguf", "size": 900_000_000},
    "llama-3.2-3b": {"repo": "bartowski/Llama-3.2-3B-Instruct-GGUF", "file": "Llama-3.2-3B-Instruct-Q4_K_M.gguf", "size": 2_000_000_000},
    "llama-3.1-8b": {"repo": "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF", "file": "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf", "size": 4_900_000_000},
    "llama-3.3-70b": {"repo": "bartowski/Llama-3.3-70B-Instruct-GGUF", "file": "Llama-3.3-70B-Instruct-Q4_K_M.gguf", "size": 42_500_000_000},
    "qwen-2.5-1.5b": {"repo": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "file": "qwen2.5-1.5b-instruct-q4_k_m.gguf", "size": 1_100_000_000},
    "qwen-2.5-3b": {"repo": "Qwen/Qwen2.5-3B-Instruct-GGUF", "file": "qwen2.5-3b-instruct-q4_k_m.gguf", "size": 2_400_000_000},
    "qwen-2.5-7b": {"repo": "Qwen/Qwen2.5-7B-Instruct-GGUF", "file": "qwen2.5-7b-instruct-q4_k_m.gguf", "size": 4_700_000_000},
    "qwen-2.5-14b": {"repo": "Qwen/Qwen2.5-14B-Instruct-GGUF", "file": "qwen2.5-14b-instruct-q4_k_m.gguf", "size": 9_000_000_000},
    "mistral-v0.3-7b": {"repo": "bartowski/Mistral-7B-Instruct-v0.3-GGUF", "file": "Mistral-7B-Instruct-v0.3-Q4_K_M.gguf", "size": 4_400_000_000},
    "mistral-nemo-12b": {"repo": "bartowski/Mistral-Nemo-Instruct-2407-GGUF", "file": "Mistral-Nemo-Instruct-2407-Q4_K_M.gguf", "size": 7_100_000_000},
    "mistral-small-24b": {"repo": "bartowski/mistralai_Mistral-Small-3.2-24B-Instruct-2506-GGUF", "file": "Mistral-Small-3.2-24B-Instruct-2506-Q4_K_M.gguf", "size": 14_500_000_000},
    "mixtral-8x7b": {"repo": "TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF", "file": "mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf", "size": 26_400_000_000},
    "codegemma-7b": {"repo": "bartowski/codegemma-1.1-7b-it-GGUF", "file": "codegemma-1.1-7b-it-Q4_K_M.gguf", "size": 5_400_000_000},
    "codellama-13b": {"repo": "TheBloke/CodeLlama-13B-Instruct-GGUF", "file": "codellama-13b-instruct.Q4_K_M.gguf", "size": 7_860_000_000},
    "qwen2.5-coder-7b": {"repo": "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF", "file": "qwen2.5-coder-7b-instruct-q4_k_m.gguf", "size": 4_700_000_000},
    "codestral-22b": {"repo": "bartowski/Codestral-22B-v0.1-GGUF", "file": "Codestral-22B-v0.1-Q4_K_M.gguf", "size": 13_200_000_000},
    "saiga-llama3-8b": {"repo": "IlyaGusev/saiga_llama3_8b_gguf", "file": "saiga_llama3_8b.Q4_K_M.gguf", "size": 4_900_000_000},
    "saiga-gemma2-9b": {"repo": "IlyaGusev/saiga_gemma2_9b_gguf", "file": "saiga_gemma2_9b.Q4_K_M.gguf", "size": 5_400_000_000},
    "dolphin-llama3-8b": {"repo": "cognitivecomputations/dolphin-2.9-llama3-8b-gguf", "file": "dolphin-2.9-llama3-8b-q4_K_M.gguf", "size": 4_900_000_000},
    "phi-3.5-mini": {"repo": "bartowski/Phi-3.5-mini-instruct-GGUF", "file": "Phi-3.5-mini-instruct-Q4_K_M.gguf", "size": 2_400_000_000}
}

PROMPT_FILES = {
    "ru": "system_prompt_ru.txt",
    "en": "system_prompt_eng.txt"
}

DEFAULT_PROMPTS = {
    "ru": "Ты элитный IT-суфлер. Тебе поступают фразы из диалога. Если во фразе есть вопрос или утверждение, требующее факта/помощи — кратко подскажи ответ в 1-2 предложениях. Отвечай только по делу. Ответ пиши с использованием Markdown.",
    "en": "You are an elite IT Co-Pilot. You receive phrases from a dialogue. If there is a question or statement requiring help/facts - provide a brief hint in 1-2 sentences. Stay strictly on topic. Respond using Markdown."
}

def load_system_prompt(lang="ru"):
    file = PROMPT_FILES.get(lang, PROMPT_FILES["en"])
    default = DEFAULT_PROMPTS.get(lang, DEFAULT_PROMPTS["en"])
    try:
        if os.path.exists(file):
            with open(file, "r", encoding="utf-8") as f:
                return f.read().strip()
        else:
            with open(file, "w", encoding="utf-8") as f:
                f.write(default)
            return default
    except Exception:
        return default

def save_system_prompt(text, lang="ru"):
    file = PROMPT_FILES.get(lang, PROMPT_FILES["en"])
    try:
        with open(file, "w", encoding="utf-8") as f:
            f.write(text)
    except Exception as e:
        print(f"Error saving prompt: {e}")
def _download_whisper_worker(target_model, model_folder):
    from faster_whisper import download_model
    download_model(target_model, output_dir=model_folder)

def _download_llm_worker(repo, file, model_folder):
    from huggingface_hub import hf_hub_download
    hf_hub_download(repo_id=repo, filename=file, local_dir=model_folder, local_dir_use_symlinks=False)

def _download_vosk_worker(url, extract_to, temp_zip_path):
    import zipfile
    import requests

    if os.path.exists(temp_zip_path):
        os.remove(temp_zip_path)

    filename = url.split('/')[-1]
    mirror_url = f"https://huggingface.co/localstack/vosk-models/resolve/main/{filename}"
    headers = {}

    def download_file(download_url, timeout):
        with requests.get(download_url, stream=True, timeout=timeout, headers=headers) as r:
            r.raise_for_status()
            with open(temp_zip_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=65536):
                    f.write(chunk)

    try:
        print("Trying fast HuggingFace mirror...")
        download_file(mirror_url, timeout=15)
    except Exception:
        print("Model not on mirror. Switching to official server...")
        if os.path.exists(temp_zip_path):
            os.remove(temp_zip_path)
            
        try:
            download_file(url, timeout=(15, 120)) 
        except Exception as ex:
            if os.path.exists(temp_zip_path): 
                os.remove(temp_zip_path)
            raise Exception(f"Server overloaded. Error: {ex}")

    print("File downloaded! Extracting...")
    with zipfile.ZipFile(temp_zip_path, 'r') as z:
        z.extractall(extract_to)
    os.remove(temp_zip_path)
    print("Vosk installation completely finished!")

def _download_sherpa_worker(repo_id, extract_to, temp_archive_path):
    from huggingface_hub import snapshot_download

    model_name = repo_id.split('/')[-1]
    target_dir = os.path.join(extract_to, model_name)
    os.makedirs(target_dir, exist_ok=True)

    endpoints = ["https://huggingface.co", "https://hf-mirror.com"]
    downloaded = False
    last_err = ""

    for endpoint in endpoints:
        try:
            print(f"\nTrying to download via: {endpoint}...")
            os.environ["HF_ENDPOINT"] = endpoint 
            snapshot_download(
                repo_id=repo_id,
                local_dir=target_dir,
                local_dir_use_symlinks=False,
                ignore_patterns=["*.md", ".gitattributes"],
                max_workers=2
            )
            downloaded = True
            print("\nSherpa installation completely finished!")
            break
        except Exception as e:
            last_err = str(e)
            print(f"\nError on {endpoint}: Timeout. Switching to fallback...")

    if not downloaded:
        if os.path.exists(target_dir): 
            shutil.rmtree(target_dir, ignore_errors=True)
        raise Exception(f"Failed to download model from any server. Last error: {last_err}")

def get_sherpa_path(model_name, cache_dir): return os.path.join(cache_dir, "sherpa")
def get_vosk_path(model_name, cache_dir): return os.path.join(cache_dir, "vosk")
def get_model_path(model_name, cache_dir): return os.path.join(cache_dir, model_name)
def get_llm_path(model_name, cache_dir): return os.path.join(cache_dir, "llm", model_name)

def check_local_models(cache_dir):
    statuses = {m: os.path.exists(os.path.join(get_model_path(m, cache_dir), "config.json")) for m in MODELS_INFO.keys()}
    llm_statuses = {m: os.path.exists(os.path.join(get_llm_path(m, cache_dir), LLM_MODELS_INFO[m]["file"])) for m in LLM_MODELS_INFO.keys()}
    
    vosk_statuses = {}
    for m in VOSK_MODELS_INFO.keys():
        vosk_statuses[m] = os.path.exists(os.path.join(cache_dir, "vosk", m))
        
    sherpa_statuses = {}
    for m in SHERPA_MODELS_INFO.keys():
        sherpa_statuses[m] = os.path.exists(os.path.join(cache_dir, "sherpa", m))
        
    return statuses, llm_statuses, vosk_statuses, sherpa_statuses

def get_size(path):
    total = 0
    for dp, _, fn in os.walk(path):
        for f in fn:
            fp = os.path.join(dp, f)
            if not os.path.islink(fp):
                try: total += os.path.getsize(fp)
                except OSError: pass
    return total

class VADAccumulator:
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
        self.vad = webrtcvad.Vad(1)
        self.buffer = []
        self.silence_frames = 0
        self.max_silence = int(sample_rate * 0.8) 
        self.ring_buffer = collections.deque(maxlen=15)
        self.triggered = False
        self.noise_floor = 0.0001

    def process(self, chunk, rms, noise_suppression=True):
        if len(chunk) != 480: return None
        pcm_data = (chunk * 32767).astype(np.int16).tobytes()
        
        try: is_speech_webrtc = self.vad.is_speech(pcm_data, self.sample_rate)
        except Exception: is_speech_webrtc = False

        if not is_speech_webrtc:
            if rms < self.noise_floor: self.noise_floor = rms
            else: self.noise_floor += (rms - self.noise_floor) * 0.02

        is_speech = is_speech_webrtc
        if noise_suppression:
            is_speech = is_speech_webrtc and (rms > self.noise_floor * 1.5 or rms > 0.0005)

        if not self.triggered:
            self.ring_buffer.append((chunk, is_speech))
            num_speech_frames = sum(1 for _, speech in self.ring_buffer if speech)
            
            if num_speech_frames >= 4:
                self.triggered = True
                for c, _ in self.ring_buffer: self.buffer.append(c)
                self.ring_buffer.clear()
                self.silence_frames = 0
        else:
            self.buffer.append(chunk)
            if not is_speech:
                self.silence_frames += len(chunk)
                if self.silence_frames > self.max_silence:
                    audio_data = np.concatenate(self.buffer)
                    self.reset()
                    if len(audio_data) > self.sample_rate * 0.5:
                        return audio_data
            else:
                self.silence_frames = 0 
        return None

    def reset(self):
        self.buffer = []
        self.triggered = False
        self.silence_frames = 0
        self.ring_buffer.clear()

async def transcribe_worker(websocket, stt_queue, data):
    stt_engine = data.get("sttEngine", "whisper")
    rec_mic = None; rec_sys = None
    stream_mic = None; stream_sys = None
    
    if stt_engine == "vosk":
        import vosk
        rec_mic = vosk.KaldiRecognizer(globals()['global_vosk_model'], 16000)
        rec_sys = vosk.KaldiRecognizer(globals()['global_vosk_model'], 16000)
    elif stt_engine == "sherpa":
        rec_mic = globals()['global_sherpa_model']
        rec_sys = globals()['global_sherpa_model']
        stream_mic = rec_mic.create_stream()
        stream_sys = rec_sys.create_stream()

    try:
        while True:
            speaker, audio_array = await stt_queue.get()
            
            try:
                if stt_engine == "sherpa" and speaker.endswith('_stream'):
                    rec = rec_mic if speaker == 'mic_stream' else rec_sys
                    stream = stream_mic if speaker == 'mic_stream' else stream_sys
                    
                    if rec and stream:
                        stream.accept_waveform(16000, audio_array.astype(np.float32))
                        while rec.is_ready(stream): rec.decode_stream(stream)
                        text = rec.get_result(stream).strip()
                        
                        if rec.is_endpoint(stream):
                            if text:
                                text = text.capitalize() 
                                q_words = {"how", "what", "where", "when", "why", "who", "which", "whose", "whom", "can", "could", "would", "should", "is", "are", "do", "does", "did", "will", "has", "have", "had", "may", "might", "am", "was", "were"}
                                is_question = any(q in text.lower().split() for q in q_words)
                                text += "?" if is_question else "."
                                await websocket.send(json.dumps({"type": "transcript", "speaker": speaker.split('_')[0], "text": text}))
                            rec.reset(stream)
                        else:
                            if text:
                                await websocket.send(json.dumps({"type": "stt_partial", "speaker": speaker.split('_')[0], "text": text}))
                                
                elif stt_engine == "vosk" and speaker.endswith('_stream'):
                    rec = rec_mic if speaker == 'mic_stream' else rec_sys
                    if rec:
                        pcm_data = (audio_array * 32767).astype(np.int16).tobytes()
                        if rec.AcceptWaveform(pcm_data):
                            res = json.loads(rec.Result())
                            text = res.get("text", "").strip()
                            if text:
                                text = text.capitalize() 
                                await websocket.send(json.dumps({"type": "transcript", "speaker": speaker.split('_')[0], "text": text}))
                        else:
                            partial = json.loads(rec.PartialResult())
                            text = partial.get("partial", "").strip()
                            if text:
                                await websocket.send(json.dumps({"type": "stt_partial", "speaker": speaker.split('_')[0], "text": text}))
                                
                elif stt_engine == "whisper" and speaker in ['mic', 'sys']:
                    segments, info = await asyncio.to_thread(global_model.transcribe, audio_array, beam_size=1, language="ru", condition_on_previous_text=False)
                    text = " ".join([segment.text for segment in segments]).strip()
                    if text: await websocket.send(json.dumps({"type": "transcript", "speaker": speaker, "text": text}))
            
            except Exception as e:
                print(f"Stream error: {e}")
    except asyncio.CancelledError:
        pass

import queue
import threading

def llm_generator_thread(messages, config, token_queue):
    global global_llm, stop_llm_flag
    stop_llm_flag = False 
    
    max_toks = config.get("maxTokens", 150)
    if max_toks >= 4000:
        max_toks = -1

    try:
        stream = global_llm.create_chat_completion(
            messages=messages,
            temperature=config.get("temperature", 0.7),
            top_p=config.get("topP", 0.9),
            max_tokens=max_toks,
            stream=True
        )
        for chunk in stream:
            if stop_llm_flag: break
            delta = chunk["choices"][0].get("delta", {})
            if "content" in delta: token_queue.put(delta["content"])
        token_queue.put(None) 
    except Exception as e:
        token_queue.put(f"[Generation error: {e}]")
        token_queue.put(None)

async def llm_worker(websocket, llm_request_queue, config):
    loop = asyncio.get_running_loop()
    chat_history = []
    
    while True:
        queue_item = await llm_request_queue.get()
        while not llm_request_queue.empty():
            queue_item = llm_request_queue.get_nowait()
            
        text, lang = queue_item 
            
        await websocket.send(json.dumps({"type": "llm_start", "prompt": text}))
        
        if len(chat_history) > 0 and chat_history[-1]["role"] == "user":
            chat_history[-1]["content"] = text
        else:
            chat_history.append({"role": "user", "content": text})
        
        max_history = config.get("historyLimit", 10)
        if len(chat_history) > max_history:
            chat_history = chat_history[-max_history:]
            
        system_prompt = load_system_prompt(lang)
        messages = [{"role": "system", "content": system_prompt}] + chat_history
        
        token_queue = queue.Queue()
        threading.Thread(target=llm_generator_thread, args=(messages, config, token_queue), daemon=True).start()
        
        full_answer = ""
        while True:
            token = await loop.run_in_executor(None, token_queue.get)
            if token is None: break
            full_answer += token
            await websocket.send(json.dumps({"type": "llm_token", "text": token}))
            
        chat_history.append({"role": "assistant", "content": full_answer})
        await websocket.send(json.dumps({"type": "llm_complete"}))

async def handle_connection(websocket):
    global global_model, global_model_name
    global global_llm, global_llm_name
    
    try:
        message = await websocket.recv()
        data = json.loads(message)
        model_cache_dir = os.path.join(os.getcwd(), "models")
        
        if data.get("type") == "start_telemetry":
            try:
                current_process = psutil.Process(os.getpid())
                current_process.cpu_percent()
                cpu_count = psutil.cpu_count(logical=True)
                while True:
                    raw_cpu = current_process.cpu_percent()
                    cpu = min(100, int(raw_cpu / (cpu_count or 1)))
                    gpu = 0
                    if HAS_GPUTIL:
                        gpus = GPUtil.getGPUs()
                        if gpus: gpu = int(gpus[0].load * 100)
                    await websocket.send(json.dumps({"type": "telemetry", "cpu": cpu, "gpu": gpu}))
                    await asyncio.sleep(1.5)
            except Exception: pass
            return

        elif data.get("type") == "get_prompt":
            lang = data.get("lang", "en")
            await websocket.send(json.dumps({"type": "prompt_data", "text": load_system_prompt(lang)}))
            return
            
        elif data.get("type") == "save_prompt":
            lang = data.get("lang", "en")
            save_system_prompt(data.get("text", ""), lang)
            return

        if data.get("type") == "cancel_download":
            model = data.get("model")
            print(f"Cancellation signal received for: {model}")
            CANCEL_DOWNLOADS.add(model)
            return

        elif data.get("type") == "check_models":
            statuses, llm_statuses, vosk_statuses, sherpa_statuses = check_local_models(model_cache_dir)
            await websocket.send(json.dumps({"type": "models_status", "statuses": statuses, "llm_statuses": llm_statuses, "vosk_statuses": vosk_statuses, "sherpa_statuses": sherpa_statuses}))
            return

        elif data.get("type") == "download_model":
            target_model = data.get("model", "base")
            CANCEL_DOWNLOADS.discard(target_model)
            
            is_vosk = target_model in VOSK_MODELS_INFO
            is_sherpa = target_model in SHERPA_MODELS_INFO
            
            if is_vosk:
                model_folder = get_vosk_path(target_model, model_cache_dir)
                os.makedirs(model_folder, exist_ok=True)
                temp_file = os.path.join(model_folder, f"{target_model}.zip")
                TARGET_SIZE = VOSK_MODELS_INFO[target_model]["size"]
                print(f"Downloading Vosk {target_model}...")
                p = multiprocessing.Process(target=_download_vosk_worker, args=(VOSK_MODELS_INFO[target_model]["url"], model_folder, temp_file))
            elif is_sherpa:
                model_folder = get_sherpa_path(target_model, model_cache_dir)
                os.makedirs(model_folder, exist_ok=True)
                temp_file = os.path.join(model_folder, f"{target_model}.tar.bz2")
                TARGET_SIZE = SHERPA_MODELS_INFO[target_model]["size"]
                print(f"Downloading Sherpa {target_model}...")
                p = multiprocessing.Process(target=_download_sherpa_worker, args=(SHERPA_MODELS_INFO[target_model]["url"], model_folder, temp_file))
            else:
                model_folder = get_model_path(target_model, model_cache_dir)
                os.makedirs(model_folder, exist_ok=True)
                TARGET_SIZE = MODELS_INFO[target_model]["size"]
                print(f"Downloading Whisper {target_model}...")
                p = multiprocessing.Process(target=_download_whisper_worker, args=(target_model, model_folder))
                
            p.start()
            
            import time
            last_size = 0
            last_time = time.time()
            
            try:
                while p.is_alive():
                    if target_model in CANCEL_DOWNLOADS:
                        CANCEL_DOWNLOADS.discard(target_model)
                        print(f"Stopping {target_model}...")
                        p.terminate()
                        p.join(timeout=1)
                        if p.is_alive(): p.kill() 
                        await asyncio.sleep(1) 
                        shutil.rmtree(model_folder, ignore_errors=True)
                        await websocket.send(json.dumps({"type": "download_cancelled"}))
                        return

                    if is_vosk or is_sherpa:
                        if os.path.exists(temp_file): size = os.path.getsize(temp_file)
                        else:
                            specific_folder = os.path.join(model_folder, target_model)
                            size = get_size(specific_folder) if os.path.exists(specific_folder) else 0
                    else:
                        size = get_size(model_folder)
                        
                    percent = min(99, int((size / TARGET_SIZE) * 100))
                    current_time = time.time()
                    time_diff = current_time - last_time
                    speed_mb = max(0, (size - last_size) / time_diff / 1048576) if time_diff > 0 else 0
                    last_size = size
                    last_time = current_time

                    await websocket.send(json.dumps({"type": "download_progress", "percent": percent, "speed": round(speed_mb, 1)}))
                    await asyncio.sleep(1)
                p.join()
                if p.exitcode == 0:
                    await websocket.send(json.dumps({"type": "download_progress", "percent": 100}))
                    await websocket.send(json.dumps({"type": "download_complete"}))
                else: raise Exception("Process was interrupted.")
            except Exception as e: await websocket.send(json.dumps({"type": "error", "message": str(e)}))
            return

        elif data.get("type") == "download_llm":
            target_model = data.get("model")
            CANCEL_DOWNLOADS.discard(target_model)
            info = LLM_MODELS_INFO[target_model]
            model_folder = get_llm_path(target_model, model_cache_dir)
            os.makedirs(model_folder, exist_ok=True)
            TARGET_SIZE = info["size"]
            print(f"Downloading LLM {target_model} (~{TARGET_SIZE // 1048576} MB)...")
            p = multiprocessing.Process(target=_download_llm_worker, args=(info["repo"], info["file"], model_folder))
            p.start()
            
            import time
            last_size = 0
            last_time = time.time()
            
            try:
                while p.is_alive():
                    if target_model in CANCEL_DOWNLOADS:
                        CANCEL_DOWNLOADS.discard(target_model)
                        print(f"Stopping LLM {target_model}...")
                        p.terminate()
                        p.join(timeout=1)
                        if p.is_alive(): p.kill()
                        await asyncio.sleep(1)
                        shutil.rmtree(model_folder, ignore_errors=True)
                        await websocket.send(json.dumps({"type": "download_cancelled"}))
                        return
                        
                    size = get_size(model_folder)
                    percent = min(99, int((size / TARGET_SIZE) * 100))
                    
                    current_time = time.time()
                    time_diff = current_time - last_time
                    speed_mb = max(0, (size - last_size) / time_diff / 1048576) if time_diff > 0 else 0
                    last_size = size
                    last_time = current_time
                    
                    await websocket.send(json.dumps({"type": "download_progress", "percent": percent, "speed": round(speed_mb, 1)}))
                    await asyncio.sleep(1)
                p.join()
                if p.exitcode == 0:
                    await websocket.send(json.dumps({"type": "download_progress", "percent": 100}))
                    await websocket.send(json.dumps({"type": "download_complete"}))
                else: raise Exception("Process was interrupted.")
            except Exception as e: await websocket.send(json.dumps({"type": "error", "message": str(e)}))
            return

        elif data.get("type") in ["delete_model", "delete_llm"]:
            is_llm = data.get("type") == "delete_llm"
            target_model = data.get("model")
            
            if is_llm: path = get_llm_path(target_model, model_cache_dir)
            elif target_model in VOSK_MODELS_INFO: path = os.path.join(get_vosk_path(target_model, model_cache_dir), target_model)
            elif target_model in SHERPA_MODELS_INFO: path = os.path.join(get_sherpa_path(target_model, model_cache_dir), target_model)
            else: path = get_model_path(target_model, model_cache_dir)
                
            if os.path.exists(path): shutil.rmtree(path, ignore_errors=True)
            
            statuses, llm_statuses, vosk_statuses, sherpa_statuses = check_local_models(model_cache_dir)
            await websocket.send(json.dumps({"type": "models_status", "statuses": statuses, "llm_statuses": llm_statuses, "vosk_statuses": vosk_statuses, "sherpa_statuses": sherpa_statuses}))
            return

        elif data.get("type") in ["open_folder", "open_llm_folder"]:
            is_llm = data.get("type") == "open_llm_folder"
            target_model = data.get("model")
            
            if is_llm: path = get_llm_path(target_model, model_cache_dir)
            elif target_model in VOSK_MODELS_INFO: path = os.path.join(get_vosk_path(target_model, model_cache_dir), target_model)
            elif target_model in SHERPA_MODELS_INFO: path = os.path.join(get_sherpa_path(target_model, model_cache_dir), target_model)
            else: path = get_model_path(target_model, model_cache_dir)
                
            os.startfile(path)
            return

        elif data.get("type") == "configure":
            target_model = data.get("model", "base")
            target_llm = data.get("llmModel")
            stt_engine = data.get("sttEngine", "whisper")
            use_gpu = data.get("useGpu", True) 

            statuses, llm_statuses, vosk_statuses, sherpa_statuses = check_local_models(model_cache_dir)
            
            if stt_engine == "sherpa":
                if not sherpa_statuses.get(target_model):
                    await websocket.send(json.dumps({"type": "error", "message": "Sherpa model is not downloaded!"}))
                    return
            elif stt_engine == "vosk":
                if not vosk_statuses.get(target_model):
                    await websocket.send(json.dumps({"type": "error", "message": "Vosk model is not downloaded!"}))
                    return
            else:
                if not statuses.get(target_model):
                    await websocket.send(json.dumps({"type": "error", "message": "Whisper model is not downloaded!"}))
                    return

            if stt_engine == "sherpa":
                if globals().get('global_model_name') != target_model:
                    import sherpa_onnx
                    import glob
                    print(f"Loading Sherpa {target_model} into memory...")
                    search_path = os.path.join(get_sherpa_path(target_model, model_cache_dir), target_model)
                    
                    encoder = [f for f in glob.glob(os.path.join(search_path, "**", "*encoder*.onnx"), recursive=True) if "int8" not in f]
                    decoder = [f for f in glob.glob(os.path.join(search_path, "**", "*decoder*.onnx"), recursive=True) if "int8" not in f]
                    joiner = [f for f in glob.glob(os.path.join(search_path, "**", "*joiner*.onnx"), recursive=True) if "int8" not in f]
                    tokens = glob.glob(os.path.join(search_path, "**", "tokens.txt"), recursive=True)
                    
                    if not (encoder and decoder and joiner and tokens):
                        await websocket.send(json.dumps({"type": "error", "message": "Sherpa files not found. Delete the model in settings and download again."}))
                        return
                        
                    try:
                        def load_sherpa():
                            return sherpa_onnx.OnlineRecognizer.from_transducer(
                                tokens=tokens[0], encoder=encoder[0], decoder=decoder[0], joiner=joiner[0],
                                num_threads=max(1, data.get("nThreads", 4) - 1), sample_rate=16000, feature_dim=80,
                                enable_endpoint_detection=True, rule1_min_trailing_silence=1.2, rule2_min_trailing_silence=0.8,
                                rule3_min_utterance_length=20.0, provider="cpu"
                            )
                        globals()['global_sherpa_model'] = await asyncio.to_thread(load_sherpa)
                        globals()['global_model_name'] = target_model
                        print("Sherpa is ready for streaming!")
                    except Exception as e:
                        await websocket.send(json.dumps({"type": "error", "message": f"Sherpa error: {e}"}))
                        return

            elif stt_engine == "vosk":
                if globals().get('global_model_name') != target_model:
                    import vosk
                    vosk.SetLogLevel(0) 
                    print(f"Loading Vosk {target_model} into memory...")
                    model_path = os.path.join(get_vosk_path(target_model, model_cache_dir), target_model)
                    if not os.path.exists(os.path.join(model_path, "am")) and os.path.exists(os.path.join(model_path, target_model, "am")):
                        model_path = os.path.join(model_path, target_model)

                    try:
                        globals()['global_vosk_model'] = await asyncio.to_thread(vosk.Model, model_path)
                        globals()['global_model_name'] = target_model
                        print("Vosk is ready for streaming!")
                    except Exception as e:
                        await websocket.send(json.dumps({"type": "error", "message": "Vosk loading error."}))
                        return
            else:
                if global_model is None or globals().get('global_model_name') != target_model:
                    from faster_whisper import WhisperModel
                    print(f"Loading Whisper {target_model} into memory...")
                    model_path = get_model_path(target_model, model_cache_dir)
                    n_threads = data.get("nThreads", 4)
                    safe_threads = max(1, n_threads - 1)
                    
                    try:
                        device_type = "cuda" if use_gpu else "cpu"
                        compute_t = "float16" if use_gpu else "int8"
                        global_model = await asyncio.to_thread(
                            WhisperModel, model_path, device=device_type, compute_type=compute_t, cpu_threads=safe_threads 
                        )
                        globals()['global_model_name'] = target_model
                        print(f"Whisper is ready! (Device: {device_type.upper()})")
                    except Exception as e:
                        if use_gpu:
                            print(f"GPU unavailable ({e}). Falling back to CPU...")
                            try:
                                global_model = await asyncio.to_thread(
                                    WhisperModel, model_path, device="cpu", compute_type="int8", cpu_threads=safe_threads 
                                )
                                globals()['global_model_name'] = target_model
                                print("Whisper is ready! (CPU)")
                            except Exception as fallback_e:
                                await websocket.send(json.dumps({"type": "error", "message": f"Whisper error (CPU fallback failed): {fallback_e}"}))
                                return
                        else:
                            await websocket.send(json.dumps({"type": "error", "message": f"Whisper error: {e}"}))
                            return

            if target_llm and target_llm != "":
                if not llm_statuses.get(target_llm):
                    await websocket.send(json.dumps({"type": "error", "message": "LLM model is not downloaded!"}))
                    return
                if 'global_llm' not in globals() or globals().get('global_llm_name') != target_llm:
                    from llama_cpp import Llama
                    print(f"Loading LLM {target_llm} into memory...")
                    llm_path = os.path.join(get_llm_path(target_llm, model_cache_dir), LLM_MODELS_INFO[target_llm]["file"])
                    n_threads = data.get("nThreads", 4)
                    flash_attn = data.get("flashAttn", False)
                    
                    def load_llm():
                        llm = Llama(
                            model_path=llm_path, n_ctx=data.get("nCtx", 2048),
                            n_gpu_layers=-1 if use_gpu else 0, n_threads=n_threads,
                            flash_attn=flash_attn, verbose=False
                        )
                        print("Warming up LLM cache...")
                        try:
                            sys_prompt = load_system_prompt()
                            llm.create_chat_completion(
                                messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": "Hello"}],
                                max_tokens=1, stream=False
                            )
                            print("Warm-up complete!")
                        except Exception as e:
                            print(f"Warm-up error: {e}")
                        return llm
                    
                    try:
                        globals()['global_llm'] = await asyncio.to_thread(load_llm)
                        globals()['global_llm_name'] = target_llm
                        print(f"LLM is ready! (GPU: {use_gpu}, Threads: {n_threads}, FlashAttn: {flash_attn})")
                    except Exception as e:
                        await websocket.send(json.dumps({"type": "error", "message": f"LLM error: {e}"}))
                        return

            try: mic = sc.default_microphone() if data.get("deviceId", "default") == "default" else sc.get_microphone(data.get("deviceId"))
            except: mic = sc.default_microphone()
            try: system_mic = sc.get_microphone(sc.default_speaker().id, include_loopback=True)
            except: system_mic = None

            await websocket.send(json.dumps({"type": "confirmed"}))
            stt_queue = asyncio.Queue()
            llm_request_queue = asyncio.Queue() 
            stt_task = asyncio.create_task(transcribe_worker(websocket, stt_queue, data))
            if target_llm and target_llm != "":
                llm_task = asyncio.create_task(llm_worker(websocket, llm_request_queue, data))

            session_state = {"mic_muted": False} 

            async def ws_receiver():
                global stop_llm_flag
                try:
                    async for msg in websocket:
                        d = json.loads(msg)
                        if d.get("type") == "ask_llm": 
                            await llm_request_queue.put((d.get("prompt"), d.get("lang", "en")))
                        elif d.get("type") == "stop_llm": stop_llm_flag = True
                        elif d.get("type") == "toggle_mute": session_state["mic_muted"] = d.get("muted", False)
                except: pass
            ws_task = asyncio.create_task(ws_receiver())

            samplerate = 16000; numframes = 480
            mic_vad = VADAccumulator(samplerate); sys_vad = VADAccumulator(samplerate)
            mic_recorder = mic.recorder(samplerate=samplerate)
            sys_recorder = system_mic.recorder(samplerate=samplerate) if system_mic else None
            mic_agc_gain = 1.0; sys_agc_gain = 1.0

            with mic_recorder, (sys_recorder if sys_recorder else asyncio.sleep(0)):
                 print("Listening to audio stream...")
                 while True:
                     if sys_recorder:
                         mic_data, sys_data = await asyncio.gather(
                             asyncio.to_thread(mic_recorder.record, numframes=numframes),
                             asyncio.to_thread(sys_recorder.record, numframes=numframes)
                         )
                     else:
                         mic_data = await asyncio.to_thread(mic_recorder.record, numframes=numframes)
                         sys_data = np.zeros_like(mic_data)

                     mic_mono = mic_data.mean(axis=1) if len(mic_data) > 0 else np.array([])
                     sys_mono = sys_data.mean(axis=1) if len(sys_data) > 0 else np.array([])
                     
                     if session_state.get("mic_muted", False):
                         mic_mono = np.zeros_like(mic_mono); mic_rms = 0
                     else:
                         mic_rms = np.sqrt(np.mean(mic_mono**2)) if len(mic_mono) > 0 else 0
                     sys_rms = np.sqrt(np.mean(sys_mono**2)) if len(sys_mono) > 0 else 0
                     
                     noise_supp = data.get("noiseSuppression", True)
                     gate_threshold = max(0.0003, mic_vad.noise_floor * 1.5) if noise_supp else 0.0001
                     mic_level = min(100, int(mic_rms * 5000)) if mic_rms > gate_threshold else 0
                     sys_level = min(100, int(sys_rms * 3500)) if sys_rms > gate_threshold else 0
                     
                     if stt_engine in ["vosk", "sherpa"]:
                         if mic_rms > gate_threshold:
                             target_gain = 0.3 / (mic_rms + 0.0001)
                             mic_agc_gain += (target_gain - mic_agc_gain) * 0.05
                         mic_agc_gain = np.clip(mic_agc_gain, 1.0, 15.0) 
                         mic_stream_norm = np.clip(mic_mono * mic_agc_gain, -1.0, 1.0)
                         await stt_queue.put(('mic_stream', np.zeros_like(mic_stream_norm) if noise_supp and mic_rms <= gate_threshold else mic_stream_norm))
                             
                         if sys_recorder:
                             if sys_rms > gate_threshold:
                                 target_gain = 0.3 / (sys_rms + 0.0001)
                                 sys_agc_gain += (target_gain - sys_agc_gain) * 0.05
                             sys_agc_gain = np.clip(sys_agc_gain, 1.0, 15.0)
                             sys_stream_norm = np.clip(sys_mono * sys_agc_gain, -1.0, 1.0)
                             await stt_queue.put(('sys_stream', np.zeros_like(sys_stream_norm) if noise_supp and sys_rms <= gate_threshold else sys_stream_norm))
                     else:
                         mic_phrase = mic_vad.process(mic_mono, mic_rms, noise_supp)
                         sys_phrase = sys_vad.process(sys_mono, sys_rms, noise_supp) if sys_recorder else None
                         if mic_phrase is not None:
                             peak = np.max(np.abs(mic_phrase))
                             if peak > 0: mic_phrase = np.clip(mic_phrase * (0.8 / peak), -1.0, 1.0)
                             await stt_queue.put(('mic', mic_phrase.astype(np.float32)))
                         if sys_phrase is not None:
                             peak = np.max(np.abs(sys_phrase))
                             if peak > 0: sys_phrase = np.clip(sys_phrase * (0.8 / peak), -1.0, 1.0)
                             await stt_queue.put(('sys', sys_phrase.astype(np.float32)))

                     await websocket.send(json.dumps({"mic_volume": mic_level, "sys_volume": sys_level}))
                     await asyncio.sleep(0.001)
    except websockets.exceptions.ConnectionClosed: pass
    finally:
        for tsk in ['stt_task', 'llm_task', 'ws_task']:
            if tsk in locals(): locals()[tsk].cancel()

async def main():
    print("Starting Hinter Core...")
    async with websockets.serve(handle_connection, "localhost", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())