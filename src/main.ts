import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';
import hljs from 'highlight.js';

const TRANSLATIONS: Record<string, Record<string, string>> = {
    ru: {
        "loader-text": "Инициализация интерфейса...",
        "status-stopped": "Сессия остановлена",
        "status-connecting": "Подключение...",
        "status-config": "Конфигурация...",
        "status-active": "Сессия запущена",
        "auto-reply": "Автоответ",
        "tab-answers": "Ответы",
        "tab-transcript": "Считанный текст",
        "placeholder-answers": "Здесь будут подсказки от нейросети...",
        "placeholder-transcript": "Начни сессию, чтобы программа начала слушать...",
        "modal-title": "Настройки",
        "mic-title": "Микрофон (твой голос)",
        "noise-title": "Умное шумоподавление",
        "stt-title": "Нейросеть (Распознавание речи)",
        "stt-whisper-lbl": "Whisper",
        "stt-vosk-lbl": "Vosk",
        "stt-sherpa-lbl": "Sherpa",
        "dl-model-btn": "Скачать модель",
        "status-installed": "Установлена",
        "llm-title": "Языковая модель (Генерация ответов)",
        "local-llm-lbl": "Локальная LLM",
        "dl-llm-btn": "Скачать LLM",
        "sys-prompt-lbl": "Системный промпт (Роль ИИ)",
        "expand-btn": "Развернуть",
        "collapse-btn": "Свернуть",
        "manual-input-placeholder": "Ввести запрос вручную...",
        "adv-llm-title": "Расширенные настройки LLM",
        "temp-lbl": "Температура (Креативность)",
        "topp-lbl": "Top P (Разнообразие)",
        "tokens-lbl": "Макс. токенов ответа",
        "ctx-lbl": "Окно контекста (Память)",
        "hw-lbl": "Аппаратное ускорение",
        "hw-gpu-lbl": "GPU (Видеокарта)",
        "hw-cpu-lbl": "Только CPU",
        "flash-lbl": "Flash Attention (Быстрый контекст)",
        "threads-lbl": "Потоки CPU (n_threads)",
        "history-lbl": "Глубина памяти (сообщений)",
        "save-btn": "Сохранить",
        "prompt-shorter": "[ИНСТРУКЦИЯ: Ответь на вопрос выше максимально коротко, тезисно, строго по делу, без воды.]",
        "prompt-longer": "[ИНСТРУКЦИЯ: Ответь на вопрос выше максимально подробно, дай развернутый ответ, добавь больше деталей и контекста по делу.]",
        "prompt-append": "[СИСТЕМНАЯ КОМАНДА: Твой прошлый ответ оборвался. Напиши ТОЛЬКО продолжение. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО переписывать или повторять уже написанный тобой текст. Никаких вступлений, дописывай строго со следующего слова.]",
        "loader-connecting": "Подключение к ядру Python...",
        "loader-waiting": "Ожидание запуска ядра (Hinter Core)...",

        "default-device": "Устройство по умолчанию",
        "no-mic-access": "Нет доступа к микрофонам",
        "mic-fallback": "Микрофон",
        "select-model": "Выберите модель",
        "downloading": "Идет загрузка...",
        "dl-status": "Скачивание",
        "dl-error": "Ошибка скачивания: ",
        "dl-error-llm": "Ошибка скачивания LLM: ",
        "delete-confirm": "Удалить модель",
        "prompt-loading": "Загрузка промпта из файла...",
        "prompt-error": "⚠️ Ошибка: Ядро не запущено.\nЗапустите ядро Hinter (Python), чтобы программа смогла прочитать файл system_prompt.txt",
        "alert-select-model": "Пожалуйста, зайдите в настройки и выберите модель речи!",
        "alert-core-fail": "Не удалось подключиться к ядру.",
        "speaker-you": "Вы",
        "speaker-interlocutor": "Собеседник",
        "stt-model-whisper": "Модель Whisper",
        "stt-model-vosk": "Модель Vosk",
        "stt-model-sherpa": "Модель Sherpa-onnx"
    },
    en: {
        "loader-text": "Initializing interface...",
        "status-stopped": "Session stopped",
        "status-connecting": "Connecting...",
        "status-config": "Configuring...",
        "status-active": "Session active",
        "auto-reply": "Auto-reply",
        "tab-answers": "Answers",
        "tab-transcript": "Transcript",
        "placeholder-answers": "AI hints will appear here...",
        "placeholder-transcript": "Start session for the app to listen...",
        "modal-title": "Settings",
        "mic-title": "Microphone (your voice)",
        "noise-title": "Smart noise suppression",
        "stt-title": "Speech Recognition (STT)",
        "manual-input-placeholder": "Type query manually...",
        "stt-whisper-lbl": "Whisper",
        "stt-vosk-lbl": "Vosk",
        "stt-sherpa-lbl": "Sherpa",
        "dl-model-btn": "Download model",
        "status-installed": "Installed",
        "llm-title": "Language Model (LLM)",
        "local-llm-lbl": "Local LLM",
        "dl-llm-btn": "Download LLM",
        "sys-prompt-lbl": "System Prompt (AI Role)",
        "expand-btn": "Expand",
        "collapse-btn": "Collapse",
        "adv-llm-title": "Advanced LLM Settings",
        "temp-lbl": "Temperature (Creativity)",
        "topp-lbl": "Top P (Diversity)",
        "tokens-lbl": "Max Response Tokens",
        "ctx-lbl": "Context Window (Memory)",
        "hw-lbl": "Hardware Acceleration",
        "hw-gpu-lbl": "GPU (Graphics Card)",
        "hw-cpu-lbl": "CPU Only",
        "flash-lbl": "Flash Attention (Fast Context)",
        "threads-lbl": "CPU Threads (n_threads)",
        "history-lbl": "Memory Depth (messages)",
        "save-btn": "Save",
        "prompt-shorter": "[INSTRUCTION: Answer the question above as briefly as possible, use bullet points, strict to the point, no fluff.]",
        "prompt-longer": "[INSTRUCTION: Answer the question above in maximum detail, provide an expanded answer, add more relevant details and context.]",
        "prompt-append": "[SYSTEM COMMAND: Your previous answer was cut off. Write ONLY the continuation. DO NOT rewrite or repeat text you already wrote. No intros, continue exactly from the next word.]",
        "loader-connecting": "Connecting to Python core...",
        "loader-waiting": "Waiting for core startup (Hinter Core)...",

        "default-device": "Default device",
        "no-mic-access": "No access to microphones",
        "mic-fallback": "Microphone",
        "select-model": "Select a model",
        "downloading": "Downloading...",
        "dl-status": "Downloading",
        "dl-error": "Download error: ",
        "dl-error-llm": "LLM download error: ",
        "delete-confirm": "Delete model",
        "prompt-loading": "Loading prompt from file...",
        "prompt-error": "⚠️ Error: Core not running.\nStart Hinter Core (Python) to read system_prompt.txt",
        "alert-select-model": "Please open settings and select a speech model!",
        "alert-core-fail": "Failed to connect to the core.",
        "speaker-you": "You",
        "speaker-interlocutor": "Interlocutor",
        "stt-model-whisper": "Whisper Model",
        "stt-model-vosk": "Vosk Model",
        "stt-model-sherpa": "Sherpa-onnx Model"
    }
};

let currentLang: string = localStorage.getItem('hinter_lang') || '';

if (!currentLang) {
    currentLang = navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    localStorage.setItem('hinter_lang', currentLang);
}

function t(key: string): string {
    return TRANSLATIONS[currentLang]?.[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
            el.innerHTML = TRANSLATIONS[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
            (el as HTMLInputElement).placeholder = TRANSLATIONS[currentLang][key];
        }
    });

    document.getElementById('lang-ru')?.classList.toggle('active', currentLang === 'ru');
    document.getElementById('lang-en')?.classList.toggle('active', currentLang === 'en');
}
interface AppSettings {
    micDeviceId: string; aiModel: string; llmModel: string;
    temperature: number; topP: number; maxTokens: number; nCtx: number;
    useGpu: boolean; flashAttn: boolean; nThreads: number;
    sttEngine: string; voskModel: string; sherpaModel: string;
    noiseSuppression: boolean;
    micMuted: boolean;
    historyLimit: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    micDeviceId: 'default', aiModel: '', llmModel: '',
    temperature: 0.7, topP: 0.9, maxTokens: 4096,
    nCtx: 8192,
    useGpu: true, flashAttn: true,
    nThreads: navigator.hardwareConcurrency || 8,
    sttEngine: 'sherpa',
    voskModel: '', sherpaModel: '',
    noiseSuppression: true,
    micMuted: false,
    historyLimit: 10
};

const SHERPA_MODELS = [
    { id: 'sherpa-onnx-streaming-zipformer-small-ru-vosk-2025-08-16', name: 'Sherpa RU (Fast)', size: '~45 МБ' },
    { id: 'sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10', name: 'Sherpa RU+EN (Multi language)', size: '~150 МБ' },
    { id: 'sherpa-onnx-streaming-zipformer-en-20M-2023-02-17', name: 'Sherpa EN (Fast)', size: '~65 МБ' },
    { id: 'sherpa-onnx-streaming-zipformer-en-2023-06-26', name: 'Sherpa EN (Large)', size: '~140 МБ' }
];

const AI_MODELS = [
    { id: 'tiny', name: 'Whisper Tiny', size: '~75 МБ' },
    { id: 'base', name: 'Whisper Base', size: '~145 МБ' },
    { id: 'small', name: 'Whisper Small', size: '~460 МБ' },
    { id: 'medium', name: 'Whisper Medium', size: '~1.5 ГБ' },
    { id: 'large-v3', name: 'Whisper Large v3', size: '~3 ГБ' }
];

const VOSK_MODELS = [
    { id: 'vosk-model-small-ru-0.22', name: 'Vosk RU Small (Super Fast)', size: '~45 МБ' },
    { id: 'vosk-model-ru-0.22', name: 'Vosk RU Base (Balance)', size: '~1.5 ГБ' },
    { id: 'vosk-model-ru-0.42', name: 'Vosk RU Large (Accurate)', size: '~1.8 ГБ' },

    { id: 'vosk-model-small-en-us-0.15', name: 'Vosk EN Small (Fast)', size: '~40 МБ' },
    { id: 'vosk-model-en-us-0.22-lgraph', name: 'Vosk EN Base (Balance)', size: '~128 МБ' },
    { id: 'vosk-model-en-us-0.22', name: 'Vosk EN Large (Accurate)', size: '~1.8 ГБ' }
];

let selectedEngineUI = 'sherpa';
let selectedVoskIdUI = '';
let selectedSherpaIdUI = '';                   
let voskStatuses: Record<string, boolean> = {};
let sherpaStatuses: Record<string, boolean> = {};

const LLM_MODELS = [
    { category: 'Google Gemma', id: 'gemma-4-e2b', name: 'Gemma 4 (E2B) - Super Fast', size: '~3.4 ГБ' },
    { category: 'Google Gemma', id: 'gemma-4-e4b', name: 'Gemma 4 (E4B) - Balance', size: '~5.4 ГБ' },
    { category: 'Google Gemma', id: 'gemma-4-26b', name: 'Gemma 4 (26B) - Middle', size: '~17.0 ГБ' },
    { category: 'Google Gemma', id: 'gemma-4-31b', name: 'Gemma 4 (31B) - Best', size: '~19.6 ГБ' },

    { category: 'Meta Llama', id: 'llama-3.2-1b', name: 'Llama 3.2 (1B) - Micro', size: '~0.9 ГБ' },
    { category: 'Meta Llama', id: 'llama-3.2-3b', name: 'Llama 3.2 (3B) - Fast', size: '~2.0 ГБ' },
    { category: 'Meta Llama', id: 'llama-3.1-8b', name: 'Llama 3.1 (8B) - Balance', size: '~4.9 ГБ' },
    { category: 'Meta Llama', id: 'llama-3.3-70b', name: 'Llama 3.3 (70B) - Best', size: '~42.5 ГБ' },

    { category: 'Alibaba Qwen', id: 'qwen-2.5-1.5b', name: 'Qwen 2.5 (1.5B) - Micro', size: '~1.1 ГБ' },
    { category: 'Alibaba Qwen', id: 'qwen-2.5-3b', name: 'Qwen 2.5 (3B) - Super Fast', size: '~2.4 ГБ' },
    { category: 'Alibaba Qwen', id: 'qwen-2.5-7b', name: 'Qwen 2.5 (7B) - Balance', size: '~4.7 ГБ' },
    { category: 'Alibaba Qwen', id: 'qwen-2.5-14b', name: 'Qwen 2.5 (14B) - Best', size: '~9.0 ГБ' },

    { category: 'Mistral AI', id: 'mistral-v0.3-7b', name: 'Mistral v0.3 (7B) - Fast', size: '~4.4 ГБ' },
    { category: 'Mistral AI', id: 'mistral-nemo-12b', name: 'Mistral Nemo (12B) - Balance', size: '~7.1 ГБ' },
    { category: 'Mistral AI', id: 'mistral-small-24b', name: 'Mistral Small 3.2 (24B)', size: '~14.5 ГБ' },
    { category: 'Mistral AI', id: 'mixtral-8x7b', name: 'Mixtral (8x7B) - Best', size: '~26.4 ГБ' },

    { category: 'Code writing', id: 'qwen2.5-coder-7b', name: 'Qwen 2.5 Coder (7B) - Fast and Smart', size: '~4.7 ГБ' },
    { category: 'Code writing', id: 'codestral-22b', name: 'Codestral (22B) - Mistral Expert', size: '~13.2 ГБ' },
    { category: 'Code writing', id: 'codegemma-7b', name: 'CodeGemma (7B) - Google', size: '~5.4 ГБ' },
    { category: 'Code writing', id: 'codellama-13b', name: 'CodeLlama (13B) - Meta', size: '~7.8 ГБ' },

    { category: 'Perfect Russian language', id: 'saiga-llama3-8b', name: 'Saiga Llama 3 (8B) - Humanlike text', size: '~4.9 ГБ' },
    { category: 'Perfect Russian language', id: 'saiga-gemma2-9b', name: 'Saiga Gemma 2 (9B) - Logic text', size: '~5.4 ГБ' },

    { category: 'No censorship', id: 'dolphin-llama3-8b', name: 'Dolphin (8B) - No censorship', size: '~4.9 ГБ' },

    { category: 'Micro weight', id: 'phi-3.5-mini', name: 'Phi 3.5 Mini (3.8B) - Microsoft', size: '~2.4 ГБ' }
];

window.addEventListener('DOMContentLoaded', () => {
    applyTranslations();

    document.getElementById('lang-ru')?.addEventListener('mousedown', (e) => {
        e.preventDefault();
        currentLang = 'ru';
        localStorage.setItem('hinter_lang', 'ru');
        applyTranslations();
        loadPromptFromServer();                   
    });

    document.getElementById('lang-en')?.addEventListener('mousedown', (e) => {
        e.preventDefault();
        currentLang = 'en';
        localStorage.setItem('hinter_lang', 'en');
        applyTranslations();
        loadPromptFromServer();                   
    });

    function loadPromptFromServer() {
        const promptInputUI = document.getElementById('system-prompt-input') as HTMLTextAreaElement;
        if (!promptInputUI) return;

        promptInputUI.style.opacity = '0.5';
        promptInputUI.value = t('prompt-loading');

        const promptWs = new WebSocket('ws://localhost:8765');

        promptWs.onopen = () => promptWs.send(JSON.stringify({ type: "get_prompt", lang: currentLang }));

        promptWs.onmessage = (e) => {
            const res = JSON.parse(e.data);
            if (res.type === "prompt_data") {
                promptInputUI.value = res.text;
                promptInputUI.style.opacity = '1';
                setTimeout(autoResizePrompt, 50);
            }
            promptWs.close();
        };

        promptWs.onerror = () => {
            promptInputUI.value = t('prompt-error');
            promptInputUI.style.opacity = '1';
            setTimeout(autoResizePrompt, 50);
        };
    }

    document.getElementById('minimize-btn')?.addEventListener('click', () => invoke('minimize_app'));
    document.getElementById('close-btn')?.addEventListener('click', () => invoke('close_app'));

    const contentEl = document.querySelector('.content-area') as HTMLElement;
    let isModalOpen = false;

    const WINDOW_CONFIG = { START_MIN_HEIGHT: 250, MAX_HEIGHT: 650, SETTINGS_HEIGHT: 650 };
    let currentWindowHeight = WINDOW_CONFIG.START_MIN_HEIGHT;
    let targetWindowHeight = WINDOW_CONFIG.START_MIN_HEIGHT;
    let resizeAnimationId: number | null = null;

    function adjustWindowSize() {
        if (isModalOpen) {
            targetWindowHeight = WINDOW_CONFIG.SETTINGS_HEIGHT;
        } else {
            const activeTab = document.querySelector('.tab-content.active');
            const innerContent = activeTab ? activeTab.firstElementChild as HTMLElement : null;

            const BASE_UI_HEIGHT = 190;

            const textHeight = innerContent ? innerContent.scrollHeight : 0;
            targetWindowHeight = textHeight + BASE_UI_HEIGHT;

            if (targetWindowHeight < WINDOW_CONFIG.START_MIN_HEIGHT) targetWindowHeight = WINDOW_CONFIG.START_MIN_HEIGHT;
            if (targetWindowHeight > WINDOW_CONFIG.MAX_HEIGHT) targetWindowHeight = WINDOW_CONFIG.MAX_HEIGHT;
        }
        if (Math.abs(targetWindowHeight - currentWindowHeight) > 1 && !resizeAnimationId) smoothResize();
    }

    function smoothResize() {
        currentWindowHeight += (targetWindowHeight - currentWindowHeight) * 0.15;
        invoke('resize_app', { height: currentWindowHeight });
        if (Math.abs(targetWindowHeight - currentWindowHeight) < 1) {
            currentWindowHeight = targetWindowHeight; invoke('resize_app', { height: currentWindowHeight }); resizeAnimationId = null;
        } else resizeAnimationId = requestAnimationFrame(smoothResize);
    }
    new MutationObserver(() => adjustWindowSize()).observe(contentEl, { childList: true, subtree: true, characterData: true });

    let isSessionActive = false;
    let ws: WebSocket | null = null;
    let selectedDeviceIdUI = 'default';

    const initialSettings = loadSettings();             
    let isMicMuted = initialSettings.micMuted;

    const micContainer = document.getElementById('mic-canvas-container');
    const micIconOverlay = document.getElementById('mic-icon-overlay');

    const updateMicUI = (muted: boolean) => {
        if (!micContainer || !micIconOverlay) return;
        if (muted) {
            micContainer.classList.add('muted');
            micIconOverlay.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
        } else {
            micContainer.classList.remove('muted');
            micIconOverlay.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
        }
    };

    updateMicUI(isMicMuted);

    if (micContainer) {
        micContainer.addEventListener('click', () => {
            isMicMuted = !isMicMuted;
            updateMicUI(isMicMuted);

            const settings = loadSettings();
            settings.micMuted = isMicMuted;
            localStorage.setItem('hinter_settings', JSON.stringify(settings));

            if (isSessionActive && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "toggle_mute", muted: isMicMuted }));
            }
        });
    }

    let selectedModelIdUI = ''; let modelStatuses: Record<string, boolean> = {};
    let downloadingModelId = ''; let currentDownloadPercent = 0; let currentDownloadSpeed = 0;

    let selectedLlmIdUI = ''; let llmStatuses: Record<string, boolean> = {};
    let downloadingLlmId = ''; let currentLlmDownloadPercent = 0; let currentLlmDownloadSpeed = 0;

    function formatSpeed(speedMb: number): string {
        if (!speedMb) return "0 КБ/с";
        if (speedMb >= 1) return `${speedMb.toFixed(1)} МБ/с`;
        return `${Math.round(speedMb * 1024)} КБ/с`;
    }

    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const micCanvas = document.getElementById('mic-canvas') as HTMLCanvasElement;
    const sysCanvas = document.getElementById('sys-canvas') as HTMLCanvasElement;
    const micCtx = micCanvas?.getContext('2d');
    const sysCtx = sysCanvas?.getContext('2d');

    const NUM_SEGMENTS = 14;                
    const SMOOTHING = 0.25;                    

    let micTargetAmps = new Array(NUM_SEGMENTS).fill(0);
    let micCurrentAmps = new Array(NUM_SEGMENTS).fill(0);
    let sysTargetAmps = new Array(NUM_SEGMENTS).fill(0);
    let sysCurrentAmps = new Array(NUM_SEGMENTS).fill(0);

    function updateTargets(targets: number[], volume: number, height: number) {
        const boostedVolume = Math.pow(volume / 100, 0.6) * 100;

        for (let i = 1; i < NUM_SEGMENTS; i++) {
            if (volume > 0) {
                const centerMultiplier = Math.sin((i / NUM_SEGMENTS) * Math.PI);
                targets[i] = (boostedVolume / 100) * (height / 2 - 1) * (Math.random() * 0.4 + 0.8) * centerMultiplier;
            } else {
                targets[i] = 0;
            }
        }
    }

    function drawSmoothGraph(ctx: CanvasRenderingContext2D, currentAmps: number[], color: string) {
        if (!ctx) return;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const time = Date.now() * 0.003;          
        const points = [];
        const step = w / NUM_SEGMENTS;

        for (let i = 0; i <= NUM_SEGMENTS; i++) {
            let x = i * step;
            let y = h / 2;

            if (i > 0 && i < NUM_SEGMENTS) {
                x += Math.sin(time + i) * (step * 0.4);

                const dir = i % 2 === 0 ? 1 : -1;
                y += dir * currentAmps[i];       
            }
            points.push({ x, y });
        }

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
    }

    function renderLoop() {
        const micColor = (isSessionActive && !isMicMuted) ? '#2ecc71' : '#95a5a6';
        const sysColor = isSessionActive ? '#e67e22' : '#95a5a6';

        if (micCtx) {
            for (let i = 1; i < NUM_SEGMENTS; i++) {
                micCurrentAmps[i] += (micTargetAmps[i] - micCurrentAmps[i]) * SMOOTHING;
            }
            drawSmoothGraph(micCtx, micCurrentAmps, micColor);
        }
        if (sysCtx) {
            for (let i = 1; i < NUM_SEGMENTS; i++) {
                sysCurrentAmps[i] += (sysTargetAmps[i] - sysCurrentAmps[i]) * SMOOTHING;
            }
            drawSmoothGraph(sysCtx, sysCurrentAmps, sysColor);
        }
        requestAnimationFrame(renderLoop);
    }

    renderLoop();

    const modal = document.getElementById('settings-modal');

    const promptInput = document.getElementById('system-prompt-input') as HTMLTextAreaElement;
    const promptFade = document.getElementById('prompt-expand-fade');
    const expandBtn = document.getElementById('prompt-expand-btn');
    let isPromptExpanded = false;
    const COLLAPSED_HEIGHT = 96;             

    function autoResizePrompt() {
        if (!promptInput || promptInput.offsetParent === null) return;                   

        const prevHeight = promptInput.style.height;
        promptInput.style.transition = 'none';
        promptInput.style.height = '1px';
        const scrollHeight = promptInput.scrollHeight;

        promptInput.style.height = prevHeight || `${COLLAPSED_HEIGHT}px`;
        void promptInput.offsetHeight;             

        promptInput.style.transition = 'border-color 0.2s, height 0.3s ease';

        if (scrollHeight <= COLLAPSED_HEIGHT + 10) {
            promptInput.style.height = scrollHeight + 2 + 'px';
            if (expandBtn) expandBtn.style.display = 'none';
            if (promptFade) promptFade.classList.remove('visible');
        } else {
            if (expandBtn) expandBtn.style.display = 'inline-block';
            if (isPromptExpanded) {
                promptInput.style.height = scrollHeight + 2 + 'px';
                if (expandBtn) expandBtn.innerText = t('collapse-btn');
                if (promptFade) promptFade.classList.remove('visible');
            } else {
                promptInput.style.height = COLLAPSED_HEIGHT + 'px';
                if (expandBtn) expandBtn.innerText = t('expand-btn');
                if (promptFade) promptFade.classList.add('visible');
            }
        }
    }

    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isPromptExpanded = !isPromptExpanded;
            autoResizePrompt();
        });
    }

    if (promptInput) {
        promptInput.addEventListener('input', autoResizePrompt);
    }

    if (promptInput) {
        promptInput.addEventListener('input', autoResizePrompt);
    }

    const autoReplyCheckbox = document.getElementById('auto-reply-checkbox') as HTMLInputElement;
    if (autoReplyCheckbox) {
        autoReplyCheckbox.checked = localStorage.getItem('hinter_auto_reply') === 'true';
        autoReplyCheckbox.addEventListener('change', () => {
            localStorage.setItem('hinter_auto_reply', autoReplyCheckbox.checked.toString());
        });
    }

    const bindSlider = (id: string, valId: string) => {
        const el = document.getElementById(id) as HTMLInputElement;
        const valEl = document.getElementById(valId);
        if (el && valEl) el.addEventListener('input', () => valEl.innerText = el.value);
    };
    bindSlider('temp-slider', 'temp-val'); bindSlider('topp-slider', 'topp-val');
    bindSlider('tokens-slider', 'tokens-val'); bindSlider('ctx-slider', 'ctx-val'); bindSlider('threads-slider', 'threads-val');
    bindSlider('history-limit-slider', 'history-limit-val');

    const maxCores = navigator.hardwareConcurrency || 8;                         
    const threadsSlider = document.getElementById('threads-slider') as HTMLInputElement;
    const threadsTicks = document.getElementById('threads-ticks');
    if (threadsSlider && threadsTicks) {
        threadsSlider.max = maxCores.toString();

        const mid = Math.ceil(maxCores / 2);
        threadsTicks.innerHTML = `
            <span>1</span>
            ${maxCores > 2 ? `<span>${mid}</span>` : ''}
            <span>${maxCores}</span>
        `;
    }

    function loadSettings(): AppSettings {
        const stored = localStorage.getItem('hinter_settings');
        if (stored) { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; } catch (e) { return DEFAULT_SETTINGS; } }
        return DEFAULT_SETTINGS;
    }

    function closeModal() { modal?.classList.remove('show'); isModalOpen = false; setTimeout(() => adjustWindowSize(), 300); }

    function saveSettings() {
        const newPrompt = (document.getElementById('system-prompt-input') as HTMLTextAreaElement).value;

        const promptWs = new WebSocket('ws://localhost:8765');
        promptWs.onopen = () => {
            promptWs.send(JSON.stringify({ type: "save_prompt", text: newPrompt, lang: currentLang }));
            setTimeout(() => promptWs.close(), 500);
        };

        localStorage.setItem('hinter_settings', JSON.stringify({
            micDeviceId: selectedDeviceIdUI, aiModel: selectedModelIdUI, llmModel: selectedLlmIdUI,
            temperature: parseFloat((document.getElementById('temp-slider') as HTMLInputElement).value),
            topP: parseFloat((document.getElementById('topp-slider') as HTMLInputElement).value),
            maxTokens: parseInt((document.getElementById('tokens-slider') as HTMLInputElement).value),
            nCtx: parseInt((document.getElementById('ctx-slider') as HTMLInputElement).value),
            historyLimit: parseInt((document.getElementById('history-limit-slider') as HTMLInputElement).value),
            useGpu: (document.getElementById('hw-gpu') as HTMLInputElement).checked,
            flashAttn: (document.getElementById('flash-attn-checkbox') as HTMLInputElement).checked,
            nThreads: parseInt((document.getElementById('threads-slider') as HTMLInputElement).value),             
            sttEngine: selectedEngineUI,
            voskModel: selectedVoskIdUI,
            sherpaModel: selectedSherpaIdUI,
            noiseSuppression: (document.getElementById('noise-suppression-checkbox') as HTMLInputElement).checked,
            micMuted: isMicMuted
        }));
        closeModal();
    }

    const advancedToggle = document.getElementById('advanced-settings-toggle') as HTMLDetailsElement;
    const modalBody = document.querySelector('.modal-body') as HTMLElement;
    if (advancedToggle && modalBody) {
        advancedToggle.addEventListener('toggle', () => {
            if (advancedToggle.open) {
                setTimeout(() => {
                    modalBody.scrollTo({ top: modalBody.scrollHeight, behavior: 'smooth' });
                }, 50);                         
            }
        });
    }

    function setupDropdown(containerId: string, selectedId: string) {
        const container = document.getElementById(containerId);
        document.getElementById(selectedId)?.addEventListener('click', (e) => {
            e.stopPropagation();

            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                if (dropdown.id !== containerId) {
                    dropdown.classList.remove('open');
                }
            });

            container?.classList.toggle('open');
        });

        window.addEventListener('click', (e) => {
            if (!container?.contains(e.target as Node)) container?.classList.remove('open');
        });
    }

    setupDropdown('mic-dropdown-container', 'mic-dropdown-selected');
    setupDropdown('ai-dropdown-container', 'ai-dropdown-selected');
    setupDropdown('llm-dropdown-container', 'llm-dropdown-selected');

    async function populateMicList() {
        const options = document.getElementById('mic-dropdown-options');
        if (!options) return;
        options.innerHTML = '';
        const addOpt = (id: string, label: string) => {
            const div = document.createElement('div');
            div.className = `dropdown-option ${id === selectedDeviceIdUI ? 'selected' : ''}`;
            div.innerText = label;
            div.onclick = () => {
                selectedDeviceIdUI = id;
                document.getElementById('mic-dropdown-selected')!.innerHTML = `<span>${label}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                document.getElementById('mic-dropdown-container')?.classList.remove('open');
                options.querySelectorAll('.dropdown-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
            };
            options.appendChild(div);
            if (id === selectedDeviceIdUI) div.click();
        };
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput');
            addOpt('default', t('default-device'));
            devices.forEach(d => addOpt(d.deviceId, d.label || `${t('mic-fallback')} (${d.deviceId.slice(0, 5)})`));
        } catch (err) { addOpt('error', t('no-mic-access')); }
    }

    function updateModelUI() {
        const dlBlock = document.getElementById('model-download-block'); const readyBlock = document.getElementById('model-ready-block');
        const dlBtn = document.getElementById('download-model-btn') as HTMLButtonElement; const progCont = document.getElementById('download-progress-container');

        const currentSelectedId = selectedEngineUI === 'whisper' ? selectedModelIdUI : selectedEngineUI === 'vosk' ? selectedVoskIdUI : selectedSherpaIdUI;
        const currentStatuses = selectedEngineUI === 'whisper' ? modelStatuses : selectedEngineUI === 'vosk' ? voskStatuses : sherpaStatuses;
        const currentModelsList = selectedEngineUI === 'whisper' ? AI_MODELS : selectedEngineUI === 'vosk' ? VOSK_MODELS : SHERPA_MODELS;

        if (!currentSelectedId || currentSelectedId === '') { dlBlock?.classList.add('hidden'); readyBlock?.classList.add('hidden'); return; }

        const isDownloaded = currentStatuses[currentSelectedId] === true;
        const currentModelData = currentModelsList.find(m => m.id === currentSelectedId);

        if (isDownloaded) {
            dlBlock?.classList.add('hidden'); readyBlock?.classList.remove('hidden');
        } else {
            dlBlock?.classList.remove('hidden'); readyBlock?.classList.add('hidden');
            if (downloadingModelId === currentSelectedId) {
                if (dlBtn) dlBtn.style.display = 'none';
                if (progCont) {
                    progCont.classList.remove('hidden');
                    document.getElementById('download-progress-fill')!.style.width = `${currentDownloadPercent}%`;
                    document.getElementById('download-status-text')!.innerText = `${t('dl-status')}: ${currentDownloadPercent}% (${formatSpeed(currentDownloadSpeed)})`;
                }
            } else if (downloadingModelId !== '') {
                if (dlBtn) { dlBtn.style.display = 'block'; dlBtn.innerText = t('downloading'); dlBtn.disabled = true; dlBtn.style.opacity = '0.5'; }
                if (progCont) progCont.classList.add('hidden');
            } else {
                if (dlBtn) { dlBtn.style.display = 'block'; dlBtn.innerText = `${t('dl-model-btn')} (${currentModelData?.size})`; dlBtn.disabled = false; dlBtn.style.opacity = '1'; }
                if (progCont) progCont.classList.add('hidden');
            }
        }
    }

    function populateModelList(statuses: Record<string, boolean>, vStatuses: Record<string, boolean> = {}, sStatuses: Record<string, boolean> = {}) {
        modelStatuses = statuses; voskStatuses = vStatuses; sherpaStatuses = sStatuses;
        const options = document.getElementById('ai-dropdown-options'); if (!options) return; options.innerHTML = '';

        const currentModels = selectedEngineUI === 'whisper' ? AI_MODELS : selectedEngineUI === 'vosk' ? VOSK_MODELS : SHERPA_MODELS;
        const currentSelectedId = selectedEngineUI === 'whisper' ? selectedModelIdUI : selectedEngineUI === 'vosk' ? selectedVoskIdUI : selectedSherpaIdUI;
        const currentStatuses = selectedEngineUI === 'whisper' ? modelStatuses : selectedEngineUI === 'vosk' ? voskStatuses : sherpaStatuses;

        const labelMap: any = { 'whisper': t('stt-model-whisper'), 'vosk': t('stt-model-vosk'), 'sherpa': t('stt-model-sherpa') };
        document.getElementById('stt-model-label')!.innerText = labelMap[selectedEngineUI];

        if (!currentSelectedId || currentSelectedId === '') {
            document.getElementById('ai-dropdown-selected')!.innerHTML = `<span>${t('select-model')}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        }

        currentModels.forEach(model => {
            const isReady = currentStatuses[model.id] === true; const div = document.createElement('div');
            div.className = `dropdown-option ${model.id === currentSelectedId ? 'selected' : ''}`;
            div.innerHTML = `<div class="model-option-content"><span class="model-name">${model.name}</span><span class="model-info">${model.size} ${isReady ? '<span class="icon-check">✓</span>' : '<span class="icon-cross">✕</span>'}</span></div>`;
            div.onclick = () => {
                if (selectedEngineUI === 'whisper') selectedModelIdUI = model.id;
                else if (selectedEngineUI === 'vosk') selectedVoskIdUI = model.id;
                else selectedSherpaIdUI = model.id;

                document.getElementById('ai-dropdown-selected')!.innerHTML = `<span>${model.name}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                document.getElementById('ai-dropdown-container')?.classList.remove('open');
                options.querySelectorAll('.dropdown-option').forEach(el => el.classList.remove('selected')); div.classList.add('selected'); updateModelUI();
            };
            options.appendChild(div);
            if (model.id === currentSelectedId) {
                document.getElementById('ai-dropdown-selected')!.innerHTML = `<span>${model.name}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            }
        });
        updateModelUI();
    }

    function updateLlmUI() {
        const dlBlock = document.getElementById('llm-download-block'); const readyBlock = document.getElementById('llm-ready-block');
        const dlBtn = document.getElementById('download-llm-btn') as HTMLButtonElement; const progCont = document.getElementById('llm-download-progress-container');
        if (!selectedLlmIdUI || selectedLlmIdUI === '') { dlBlock?.classList.add('hidden'); readyBlock?.classList.add('hidden'); return; }
        const isDownloaded = llmStatuses[selectedLlmIdUI] === true; const currentModelData = LLM_MODELS.find(m => m.id === selectedLlmIdUI);

        if (isDownloaded) {
            dlBlock?.classList.add('hidden'); readyBlock?.classList.remove('hidden');
        } else {
            dlBlock?.classList.remove('hidden'); readyBlock?.classList.add('hidden');
            if (downloadingLlmId === selectedLlmIdUI) {
                if (dlBtn) dlBtn.style.display = 'none';
                if (progCont) {
                    progCont.classList.remove('hidden');
                    document.getElementById('llm-download-progress-fill')!.style.width = `${currentLlmDownloadPercent}%`;
                    document.getElementById('llm-download-status-text')!.innerText = `${t('dl-status')}: ${currentLlmDownloadPercent}% (${formatSpeed(currentLlmDownloadSpeed)})`;
                }
            } else if (downloadingLlmId !== '') {
                if (dlBtn) { dlBtn.style.display = 'block'; dlBtn.innerText = t('downloading'); dlBtn.disabled = true; dlBtn.style.opacity = '0.5'; }
                if (progCont) progCont.classList.add('hidden');
            } else {
                if (dlBtn) { dlBtn.style.display = 'block'; dlBtn.innerText = `${t('dl-llm-btn')} (${currentModelData?.size})`; dlBtn.disabled = false; dlBtn.style.opacity = '1'; }
                if (progCont) progCont.classList.add('hidden');
            }
        }
    }

    function populateLlmList(statuses: Record<string, boolean>) {
        llmStatuses = statuses; const options = document.getElementById('llm-dropdown-options'); if (!options) return; options.innerHTML = '';

        const currentSavedSettings = loadSettings();
        if (!currentSavedSettings.llmModel || currentSavedSettings.llmModel === '') {
            document.getElementById('llm-dropdown-selected')!.innerHTML = `<span>${t('select-model')}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        }

        let currentCategory = "";

        LLM_MODELS.forEach(model => {
            if (model.category && model.category !== currentCategory) {
                currentCategory = model.category;
                const catDiv = document.createElement('div');
                catDiv.className = 'dropdown-category';
                catDiv.innerText = currentCategory;
                options.appendChild(catDiv);
            }

            const isReady = statuses[model.id] === true; const div = document.createElement('div');
            div.className = `dropdown-option ${model.id === currentSavedSettings.llmModel ? 'selected' : ''}`;
            div.innerHTML = `<div class="model-option-content"><span class="model-name">${model.name}</span><span class="model-info">${model.size} ${isReady ? '<span class="icon-check">✓</span>' : '<span class="icon-cross">✕</span>'}</span></div>`;
            div.onclick = () => {
                selectedLlmIdUI = model.id;
                document.getElementById('llm-dropdown-selected')!.innerHTML = `<span>${model.name}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                document.getElementById('llm-dropdown-container')?.classList.remove('open');
                options.querySelectorAll('.dropdown-option').forEach(el => el.classList.remove('selected')); div.classList.add('selected'); updateLlmUI();
            };
            options.appendChild(div);
            if (model.id === currentSavedSettings.llmModel) {
                document.getElementById('llm-dropdown-selected')!.innerHTML = `<span>${model.name}</span><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
            }
        });
        updateLlmUI();
    }

    function checkAllModelsInstant() {
        const ws = new WebSocket('ws://localhost:8765');
        ws.onopen = () => ws.send(JSON.stringify({ type: "check_models" }));
        ws.onmessage = (e) => {
            const res = JSON.parse(e.data);
            if (res.type === "models_status") { populateModelList(res.statuses, res.vosk_statuses, res.sherpa_statuses); populateLlmList(res.llm_statuses); ws.close(); }
        };
    }

    document.getElementById('download-model-btn')?.addEventListener('click', () => {
        const targetModelId = selectedEngineUI === 'whisper' ? selectedModelIdUI : selectedEngineUI === 'vosk' ? selectedVoskIdUI : selectedSherpaIdUI;
        if (downloadingModelId !== '') return; downloadingModelId = targetModelId; currentDownloadPercent = 0; updateModelUI();
        const dlWs = new WebSocket('ws://localhost:8765');
        dlWs.onopen = () => dlWs.send(JSON.stringify({ type: "download_model", model: targetModelId }));
        dlWs.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.type === "download_progress") {
                currentDownloadPercent = data.percent;
                currentDownloadSpeed = data.speed || 0;
                if (targetModelId === downloadingModelId) {
                    document.getElementById('download-progress-fill')!.style.width = `${data.percent}%`;
                    document.getElementById('download-status-text')!.innerText = `${t('dl-status')}: ${data.percent}% (${formatSpeed(currentDownloadSpeed)})`;
                }
            } else if (data.type === "download_complete" || data.type === "download_cancelled" || data.type === "error") {
                downloadingModelId = ''; currentDownloadPercent = 0; currentDownloadSpeed = 0; dlWs.close(); checkAllModelsInstant();
                if (data.type === "error") alert(t('dl-error') + data.message);
            }
        };
    });

    document.getElementById('cancel-model-btn')?.addEventListener('click', () => {
        if (downloadingModelId === '') return; const target = downloadingModelId; downloadingModelId = ''; currentDownloadPercent = 0; updateModelUI();
        const ws = new WebSocket('ws://localhost:8765'); ws.onopen = () => { ws.send(JSON.stringify({ type: "cancel_download", model: target })); setTimeout(() => ws.close(), 1000); };
    });

    document.getElementById('download-llm-btn')?.addEventListener('click', () => {
        if (downloadingLlmId !== '') return; downloadingLlmId = selectedLlmIdUI; currentLlmDownloadPercent = 0; updateLlmUI();
        const dlWs = new WebSocket('ws://localhost:8765');
        dlWs.onopen = () => dlWs.send(JSON.stringify({ type: "download_llm", model: selectedLlmIdUI }));
        dlWs.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.type === "download_progress") {
                currentLlmDownloadPercent = data.percent;
                currentLlmDownloadSpeed = data.speed || 0;
                if (selectedLlmIdUI === downloadingLlmId) {
                    document.getElementById('llm-download-progress-fill')!.style.width = `${data.percent}%`;
                    document.getElementById('llm-download-status-text')!.innerText = `${t('dl-status')}: ${data.percent}% (${formatSpeed(currentLlmDownloadSpeed)})`;
                }
            } else if (data.type === "download_complete" || data.type === "download_cancelled" || data.type === "error") {
                downloadingLlmId = ''; currentLlmDownloadPercent = 0; currentLlmDownloadSpeed = 0; dlWs.close(); checkAllModelsInstant();
                if (data.type === "error") alert(t('dl-error-llm') + data.message);
            }
        };
    });

    document.getElementById('cancel-llm-btn')?.addEventListener('click', () => {
        if (downloadingLlmId === '') return; const target = downloadingLlmId; downloadingLlmId = ''; currentLlmDownloadPercent = 0; updateLlmUI();
        const ws = new WebSocket('ws://localhost:8765'); ws.onopen = () => { ws.send(JSON.stringify({ type: "cancel_download", model: target })); setTimeout(() => ws.close(), 1000); };
    });

    document.getElementById('delete-model-btn')?.addEventListener('click', () => {
        const targetModelId = selectedEngineUI === 'whisper' ? selectedModelIdUI : selectedEngineUI === 'vosk' ? selectedVoskIdUI : selectedSherpaIdUI;
        const engineName = selectedEngineUI === 'whisper' ? 'Whisper' : 'Vosk';
        if (!confirm(`${t('delete-confirm')} ${engineName} ${targetModelId}?`)) return;
        const ws = new WebSocket('ws://localhost:8765');
        ws.onopen = () => ws.send(JSON.stringify({ type: "delete_model", model: targetModelId }));
        ws.onmessage = () => { checkAllModelsInstant(); ws.close(); };
    });

    document.getElementById('open-model-folder-btn')?.addEventListener('click', () => {
        const targetModelId = selectedEngineUI === 'whisper' ? selectedModelIdUI : selectedEngineUI === 'vosk' ? selectedVoskIdUI : selectedSherpaIdUI;
        const ws = new WebSocket('ws://localhost:8765');
        ws.onopen = () => { ws.send(JSON.stringify({ type: "open_folder", model: targetModelId })); setTimeout(() => ws.close(), 500); };
    });
    document.getElementById('open-llm-folder-btn')?.addEventListener('click', () => { const ws = new WebSocket('ws://localhost:8765'); ws.onopen = () => { ws.send(JSON.stringify({ type: "open_llm_folder", model: selectedLlmIdUI })); setTimeout(() => ws.close(), 500); }; });

    document.getElementById('settings-btn')?.addEventListener('click', async () => {
        isModalOpen = true; adjustWindowSize();
        const saved = loadSettings();
        selectedDeviceIdUI = saved.micDeviceId; selectedModelIdUI = saved.aiModel; selectedLlmIdUI = saved.llmModel;

        selectedEngineUI = saved.sttEngine || 'whisper';
        selectedVoskIdUI = saved.voskModel || '';
        selectedSherpaIdUI = saved.sherpaModel || '';

        const whisperRadio = document.getElementById('stt-whisper') as HTMLInputElement;
        const voskRadio = document.getElementById('stt-vosk') as HTMLInputElement;
        const sherpaRadio = document.getElementById('stt-sherpa') as HTMLInputElement;

        if (whisperRadio) whisperRadio.checked = selectedEngineUI === 'whisper';
        if (voskRadio) voskRadio.checked = selectedEngineUI === 'vosk';
        if (sherpaRadio) sherpaRadio.checked = selectedEngineUI === 'sherpa';

        const noiseCheckbox = document.getElementById('noise-suppression-checkbox') as HTMLInputElement;
        if (noiseCheckbox) noiseCheckbox.checked = saved.noiseSuppression !== false;

        whisperRadio?.addEventListener('change', () => { selectedEngineUI = 'whisper'; populateModelList(modelStatuses, voskStatuses, sherpaStatuses); });
        voskRadio?.addEventListener('change', () => { selectedEngineUI = 'vosk'; populateModelList(modelStatuses, voskStatuses, sherpaStatuses); });
        sherpaRadio?.addEventListener('change', () => { selectedEngineUI = 'sherpa'; populateModelList(modelStatuses, voskStatuses, sherpaStatuses); });

        loadPromptFromServer();

        (document.getElementById('temp-slider') as HTMLInputElement).value = saved.temperature.toString(); document.getElementById('temp-val')!.innerText = saved.temperature.toString();
        (document.getElementById('topp-slider') as HTMLInputElement).value = saved.topP.toString(); document.getElementById('topp-val')!.innerText = saved.topP.toString();
        (document.getElementById('tokens-slider') as HTMLInputElement).value = saved.maxTokens.toString(); document.getElementById('tokens-val')!.innerText = saved.maxTokens.toString();
        (document.getElementById('ctx-slider') as HTMLInputElement).value = saved.nCtx.toString(); document.getElementById('ctx-val')!.innerText = saved.nCtx.toString();
        (document.getElementById('history-limit-slider') as HTMLInputElement).value = saved.historyLimit.toString();
        document.getElementById('history-limit-val')!.innerText = saved.historyLimit.toString();
        (document.getElementById('hw-gpu') as HTMLInputElement).checked = saved.useGpu;
        (document.getElementById('hw-cpu') as HTMLInputElement).checked = !saved.useGpu;
        (document.getElementById('flash-attn-checkbox') as HTMLInputElement).checked = saved.flashAttn;

        let loadedThreads = saved.nThreads;
        const currentMaxCores = navigator.hardwareConcurrency || 8;
        if (loadedThreads > currentMaxCores) loadedThreads = currentMaxCores;

        (document.getElementById('threads-slider') as HTMLInputElement).value = loadedThreads.toString();
        document.getElementById('threads-val')!.innerText = loadedThreads.toString();

        checkAllModelsInstant(); await populateMicList(); modal?.classList.add('show');
    });

    document.getElementById('modal-close-btn')?.addEventListener('mousedown', closeModal);
    document.getElementById('settings-save-btn')?.addEventListener('click', saveSettings);

    document.getElementById('settings-modal')?.addEventListener('mousedown', (e) => {
        if (e.target === document.getElementById('settings-modal')) {
            closeModal();
        }
    });

    function stopSession() {
        isSessionActive = false; statusDot?.classList.remove('active'); statusText!.innerText = t('status-stopped');

        const livePreview = document.getElementById('live-transcript-preview');
        if (livePreview) { livePreview.innerText = ""; livePreview.classList.remove('show'); }

        micTargetAmps.fill(0);
        sysTargetAmps.fill(0);

        if (ws) { ws.close(); ws = null; }
    }

    document.getElementById('session-toggle')?.addEventListener('click', () => {
        if (isSessionActive) return stopSession();
        const cfg = loadSettings();
        const targetModel = cfg.sttEngine === 'sherpa' ? cfg.sherpaModel : (cfg.sttEngine === 'vosk' ? cfg.voskModel : cfg.aiModel);
        if (!targetModel || targetModel === '') { alert(t('alert-select-model')); return; }

        isSessionActive = true; statusDot?.classList.add('active'); statusText!.innerText = t('status-connecting');
        ws = new WebSocket('ws://localhost:8765');

        ws.onopen = () => {
            statusText!.innerText = t('status-config');
            ws!.send(JSON.stringify({
                type: "configure", deviceId: cfg.micDeviceId,
                model: targetModel, sttEngine: cfg.sttEngine,
                llmModel: cfg.llmModel,
                noiseSuppression: cfg.noiseSuppression,
                temperature: cfg.temperature, topP: cfg.topP,
                maxTokens: cfg.maxTokens, nCtx: cfg.nCtx,
                historyLimit: cfg.historyLimit,
                useGpu: cfg.useGpu, flashAttn: cfg.flashAttn, nThreads: cfg.nThreads
            }));
            ws!.send(JSON.stringify({ type: "toggle_mute", muted: isMicMuted }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "error") { alert(data.message); return stopSession(); }
                if (data.type === "confirmed") { statusText!.innerText = t('status-active'); return; }

                if (data.type === "stt_partial") {
                    (window as any).updateInterimTranscript(data.speaker, data.text);
                    return;
                }

                if (data.type === "transcript") {
                    (window as any).appendTranscript(data.speaker, data.text);
                    lastTranscript = data.text;
                    const autoReply = (document.getElementById('auto-reply-checkbox') as HTMLInputElement)?.checked;
                    if (autoReply && !isLlmGenerating) {
                        (window as any).prepareLlmCard(lastTranscript);
                        ws!.send(JSON.stringify({ type: "ask_llm", prompt: lastTranscript, lang: currentLang }));
                    }
                    return;
                }

                if (data.type === "llm_token") { (window as any).appendLlmToken(data.text); return; }
                if (data.type === "llm_complete") { (window as any).finishLlmAnswer(); return; }

                if (data.mic_volume !== undefined && data.sys_volume !== undefined) {
                    if (statusText!.innerText === t('status-config')) statusText!.innerText = t('status-active');

                    if (micCtx) updateTargets(micTargetAmps, data.mic_volume, micCanvas.height);
                    if (sysCtx) updateTargets(sysTargetAmps, data.sys_volume, sysCanvas.height);
                }
            } catch (err) { }
        };
        ws.onerror = () => { alert(t('alert-core-fail')); stopSession(); };
        ws.onclose = () => { if (isSessionActive) stopSession(); };
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const transcriptBox = document.getElementById('transcript-box');
    const answersBox = document.getElementById('answers-box');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            if (targetId) {
                document.getElementById(targetId)?.classList.add('active');
            }
            adjustWindowSize();
        });
    });

    function getLastSentence(text: string): string {
        if (!text) return "";
        const sentences = text.trim().split(/(?<=[.!?])\s+/);
        return sentences[sentences.length - 1].trim();
    }

    const manualInput = document.getElementById('manual-prompt-input') as HTMLInputElement;
    const manualWrapper = document.getElementById('manual-input-wrapper');
    const manualSubmitBtn = document.getElementById('manual-submit-btn');

    let manualModeBaseText = "";
    let isManualMode = false;
    let currentInterimForInput = "";
    let pendingAppends = "";
    let lastSubmitTime = 0;                

    function renderInputUI() {
        const liveOverlay = document.getElementById('live-transcript-overlay');
        if (!liveOverlay || !manualInput) return;
        if (document.activeElement === manualInput) return;

        let html = "";
        let combinedText = "";

        if (isManualMode) {
            if (manualModeBaseText) {
                html += `<span style="color: #34495e; font-weight: 600;">${manualModeBaseText}</span>`;
                combinedText += manualModeBaseText;
            }
            if (currentInterimForInput) {
                const space = combinedText ? " " : "";
                html += `${space}<span style="color: #95a5a6; font-weight: 400; font-style: italic;">${currentInterimForInput}</span>`;
                combinedText += space + currentInterimForInput;
            }
        } else {
            if (currentInterimForInput) {
                html += `<span style="color: #95a5a6; font-weight: 400; font-style: italic;">${currentInterimForInput}</span>`;
                combinedText = currentInterimForInput;
            } else if (manualModeBaseText) {
                html += `<span style="color: #34495e; font-weight: 600;">${manualModeBaseText}</span>`;
                combinedText = manualModeBaseText;
            }
        }

        liveOverlay.innerHTML = html;
        manualInput.value = combinedText;

        if (html !== "") manualWrapper?.classList.add('has-preview');
        else manualWrapper?.classList.remove('has-preview');

        manualInput.scrollLeft = manualInput.scrollWidth;
    }

    manualInput?.addEventListener('focus', () => manualWrapper?.classList.add('is-focused'));

    manualInput?.addEventListener('blur', () => {
        manualWrapper?.classList.remove('is-focused');
        if (isManualMode) {
            manualModeBaseText = manualInput.value.trim() + pendingAppends;
            pendingAppends = "";
            renderInputUI();
        }
    });

    manualInput?.addEventListener('input', () => {
        isManualMode = true;
        if (manualInput.value.trim() !== '') manualWrapper?.classList.add('has-text');
        else manualWrapper?.classList.remove('has-text');
    });

    manualInput?.addEventListener('scroll', () => {
        const liveOverlay = document.getElementById('live-transcript-overlay');
        if (liveOverlay) liveOverlay.scrollLeft = manualInput.scrollLeft;
    });

    const submitManualQuery = () => {
        const text = (manualInput?.value.trim() + pendingAppends).trim();
        if (text && text !== "" && !isLlmGenerating && ws && ws.readyState === WebSocket.OPEN) {
            (window as any).prepareLlmCard(text);
            ws.send(JSON.stringify({ type: "ask_llm", prompt: text, lang: currentLang }));

            manualInput.value = '';
            manualModeBaseText = '';
            currentInterimForInput = '';
            pendingAppends = '';
            isManualMode = false;
            lastSubmitTime = Date.now();

            manualWrapper?.classList.remove('has-text');

            manualInput.blur();
            renderInputUI();

        } else if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert(t('alert-core-fail'));
        }
    };

    manualInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); submitManualQuery(); }
    });
    manualSubmitBtn?.addEventListener('click', submitManualQuery);

    tabContents.forEach(content => {
        content.addEventListener('scroll', () => {
            const isAtBottom = content.scrollHeight - content.scrollTop <= content.clientHeight + 30;
            autoScrollEnabled = isAtBottom;
        });
    });

    let lastTranscript = "";
    let isLlmGenerating = false;
    let currentLlmSpan: HTMLElement | null = null;
    let autoScrollEnabled = true;
    let rawLlmText = "";
    let currentStopBtn: HTMLButtonElement | null = null;
    let activeActionsContainer: HTMLElement | null = null;

    (window as any).prepareLlmCard = (prompt: string) => {
        if (!answersBox) return;
        isLlmGenerating = true;
        autoScrollEnabled = true;

        const placeholder = answersBox.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        const card = document.createElement('div');
        card.className = 'llm-message-card';

        let currentPromptText = prompt;

        const promptSection = document.createElement('div');
        promptSection.className = 'llm-prompt-echo';
        promptSection.innerHTML = `
            <button class="prompt-edit-btn">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <span class="prompt-text-editable" spellcheck="false">${prompt}</span>`;

        const editBtn = promptSection.querySelector('.prompt-edit-btn') as HTMLButtonElement;
        const textEditable = promptSection.querySelector('.prompt-text-editable') as HTMLElement;
        let isEditing = false;

        const toggleEdit = () => {
            if (!isEditing) {
                isEditing = true;
                textEditable.contentEditable = "true";
                textEditable.classList.add('editing');
                textEditable.focus();

                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(textEditable);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);

                editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                editBtn.classList.add('save-mode');
            } else {
                saveEdit();
            }
        };

        const saveEdit = () => {
            if (!isEditing) return;
            isEditing = false;
            textEditable.contentEditable = "false";
            textEditable.classList.remove('editing');

            editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
            editBtn.classList.remove('save-mode');

            const newText = textEditable.innerText.trim();
            if (newText !== currentPromptText && newText !== "") {
                currentPromptText = newText;
                startRegeneration("");
            } else {
                textEditable.innerText = currentPromptText;
            }
        };

        editBtn.addEventListener('click', toggleEdit);

        textEditable.addEventListener('click', () => {
            if (!isEditing) {
                toggleEdit();
            }
        });

        textEditable.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();                      
                saveEdit();
            }
        });

        const responseSpan = document.createElement('div');
        responseSpan.className = 'llm-text markdown-body';
        currentLlmSpan = responseSpan;

        const stopBtn = document.createElement('button');
        stopBtn.className = 'stop-llm-btn';
        stopBtn.title = 'Остановить генерацию';
        stopBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>`;
        currentStopBtn = stopBtn;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'llm-actions-container';
        activeActionsContainer = actionsContainer;

        const regenBtn = document.createElement('button');
        regenBtn.className = 'llm-action-btn regen-normal-btn';
        regenBtn.title = "Сгенерировать ответ заново";
        regenBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;

        const shorterBtn = document.createElement('button');
        shorterBtn.className = 'llm-action-btn regen-shorter-btn';
        shorterBtn.title = "Сделать ответ короче";
        shorterBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 14h9v-2H4v2zm0-7v2h16V7H4z"></path></svg>`;

        const longerBtn = document.createElement('button');
        longerBtn.className = 'llm-action-btn regen-longer-btn';
        longerBtn.title = "Сделать ответ подробнее";
        longerBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"></path></svg>`;

        const appendBtn = document.createElement('button');
        appendBtn.className = 'llm-action-btn append-btn';
        appendBtn.title = "Дополнить ответ (продолжить мысль)";
        appendBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

        actionsContainer.appendChild(appendBtn);
        actionsContainer.appendChild(longerBtn);
        actionsContainer.appendChild(shorterBtn);
        actionsContainer.appendChild(regenBtn);

        stopBtn.onclick = () => {
            if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "stop_llm" }));
            stopBtn.style.display = 'none';
            actionsContainer.style.display = 'flex';
        };

        const startRegeneration = (hiddenInstruction: string, isAppend: boolean = false) => {
            if (isLlmGenerating) return;
            isLlmGenerating = true;
            currentLlmSpan = responseSpan;
            currentStopBtn = stopBtn;
            activeActionsContainer = actionsContainer;

            if (!isAppend) {
                rawLlmText = "";
                responseSpan.innerHTML = "";
            } else {
                if (!rawLlmText.endsWith(" ") && !rawLlmText.endsWith("\n")) {
                    rawLlmText += " ";
                }
            }

            actionsContainer.style.display = 'none';
            stopBtn.style.display = 'flex';

            if (ws && ws.readyState === WebSocket.OPEN) {
                if (isAppend) {
                    ws.send(JSON.stringify({ type: "ask_llm", prompt: hiddenInstruction, lang: currentLang }));
                } else {
                    ws.send(JSON.stringify({ type: "ask_llm", prompt: currentPromptText + " " + hiddenInstruction, lang: currentLang }));
                }
            }
        };

        appendBtn.onclick = () => startRegeneration(t('prompt-append'), true);
        regenBtn.onclick = () => startRegeneration("");
        shorterBtn.onclick = () => startRegeneration(t('prompt-shorter'));
        longerBtn.onclick = () => startRegeneration(t('prompt-longer'));

        card.appendChild(promptSection);
        card.appendChild(stopBtn);
        card.appendChild(actionsContainer);
        card.appendChild(responseSpan);
        answersBox.appendChild(card);

        rawLlmText = "";
        const tabBtn = document.querySelector('.tab-btn[data-target="tab-answers"]') as HTMLElement;
        if (tabBtn && !tabBtn.classList.contains('active')) tabBtn.click();

        setTimeout(() => {
            const activeTab = document.querySelector('.tab-content.active') as HTMLElement;
            if (activeTab && autoScrollEnabled) activeTab.scrollTop = activeTab.scrollHeight;
            adjustWindowSize();
        }, 50);
    };

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            if (isSessionActive && ws && ws.readyState === WebSocket.OPEN && lastTranscript.trim() !== "" && !isLlmGenerating) {
                (window as any).prepareLlmCard(lastTranscript);          
                ws.send(JSON.stringify({ type: "ask_llm", prompt: lastTranscript, lang: currentLang }));
            }
        }
    });

    let currentSpeaker = ""; let currentParagraph: HTMLElement | null = null;
    let currentTextSpan: HTMLElement | null = null; let currentInterimSpan: HTMLElement | null = null;

    (window as any).updateInterimTranscript = (speaker: 'mic' | 'sys', text: string) => {
        if (!transcriptBox) return;

        const placeholder = transcriptBox.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        if (currentSpeaker !== speaker || !currentParagraph) {
            if (currentParagraph && currentInterimSpan && currentTextSpan) {
                currentInterimSpan.innerText = "";
                if (currentTextSpan.innerText.trim() === "") {
                    currentParagraph.remove();
                }
            }
            currentParagraph = document.createElement('div'); currentParagraph.className = 'transcript-paragraph';
            const nameSpan = document.createElement('span'); nameSpan.className = `speaker-name ${speaker === 'mic' ? 'speaker-mic' : 'speaker-sys'}`;
            nameSpan.innerText = `${speaker === 'mic' ? t('speaker-you') : t('speaker-interlocutor')}:`;

            currentTextSpan = document.createElement('span'); currentTextSpan.className = 'speaker-text';
            currentInterimSpan = document.createElement('span'); currentInterimSpan.className = 'speaker-text interim';

            currentParagraph.appendChild(nameSpan); currentParagraph.appendChild(currentTextSpan); currentParagraph.appendChild(currentInterimSpan);
            transcriptBox.appendChild(currentParagraph); currentSpeaker = speaker;
        }

        const space = currentTextSpan!.innerText.length > 0 ? " " : "";
        currentInterimSpan!.innerText = text ? space + text : "";

        if (Date.now() - lastSubmitTime > 1500) {
            currentInterimForInput = text ? text.trim() : "";
            renderInputUI();
        }

        const activeTab = document.querySelector('.tab-content.active') as HTMLElement;
        if (activeTab && autoScrollEnabled) activeTab.scrollTop = activeTab.scrollHeight;
        adjustWindowSize();
    };

    (window as any).appendTranscript = (speaker: 'mic' | 'sys', text: string) => {
        if (!text) return;
        if (!transcriptBox) return;

        const placeholder = transcriptBox.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();

        if (currentSpeaker !== speaker || !currentParagraph) {
            if (currentParagraph && currentInterimSpan && currentTextSpan) {
                currentInterimSpan.innerText = "";
                if (currentTextSpan.innerText.trim() === "") {
                    currentParagraph.remove();
                }
            }
            currentParagraph = document.createElement('div');
            currentParagraph.className = 'transcript-paragraph';

            const nameSpan = document.createElement('span');
            nameSpan.className = `speaker-name ${speaker === 'mic' ? 'speaker-mic' : 'speaker-sys'}`;
            nameSpan.innerText = `${speaker === 'mic' ? t('speaker-you') : t('speaker-interlocutor')}:`;

            currentTextSpan = document.createElement('span');
            currentTextSpan.className = 'speaker-text';

            currentInterimSpan = document.createElement('span');
            currentInterimSpan.className = 'speaker-text interim';

            currentParagraph.appendChild(nameSpan);
            currentParagraph.appendChild(currentTextSpan);
            currentParagraph.appendChild(currentInterimSpan);

            transcriptBox.appendChild(currentParagraph);
            currentSpeaker = speaker;
        }

        if (currentInterimSpan) currentInterimSpan.innerText = "";

        const cleanText = text.trim();
        const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];

        sentences.forEach(sentence => {
            const span = document.createElement('span');
            span.className = 'transcript-sentence';
            span.innerText = sentence.trim() + ' ';

            span.addEventListener('mouseenter', () => {
                if (isSessionActive) {
                    span.classList.add('sentence-hover');
                } else {

                }
            });

            span.addEventListener('mouseleave', () => {
                span.classList.remove('sentence-hover');
            });

            span.addEventListener('click', () => {
                const textToAsk = span.innerText.trim();
                if (textToAsk !== "" && !isLlmGenerating && isSessionActive && ws && ws.readyState === WebSocket.OPEN) {
                    (window as any).prepareLlmCard(textToAsk);
                    ws.send(JSON.stringify({ type: "ask_llm", prompt: textToAsk, lang: currentLang }));
                }
            });

            currentTextSpan!.appendChild(span);
        });

        const incomingText = text.trim();
        if (incomingText) {
            if (isManualMode) {
                if (document.activeElement === document.getElementById('manual-prompt-input')) {
                    pendingAppends += (pendingAppends ? " " : " ") + incomingText;
                } else {
                    manualModeBaseText += (manualModeBaseText ? " " : "") + incomingText;
                }
            } else {
                if (Date.now() - lastSubmitTime > 1500) {
                    manualModeBaseText = getLastSentence(incomingText);
                }
            }
        }

        currentInterimForInput = "";
        renderInputUI();

        const activeTab = document.querySelector('.tab-content.active') as HTMLElement;
        if (activeTab && autoScrollEnabled) activeTab.scrollTop = activeTab.scrollHeight;
        adjustWindowSize();
    };

    (window as any).appendLlmToken = async (text: string) => {
        if (currentLlmSpan) {
            rawLlmText += text;

            let parseText = rawLlmText;

            parseText = parseText.replace(/([^\n])(```)/g, '$1\n$2');

            if ((parseText.match(/\*\*/g) || []).length % 2 !== 0) parseText += '**';
            if ((parseText.match(/```/g) || []).length % 2 !== 0) parseText += '\n```';

            currentLlmSpan.innerHTML = await marked.parse(parseText);

            currentLlmSpan.querySelectorAll('pre code').forEach((block) => {
                try { hljs.highlightElement(block as HTMLElement); } catch (e) { }
            });

            const activeTab = document.querySelector('.tab-content.active') as HTMLElement;
            if (activeTab && autoScrollEnabled) activeTab.scrollTop = activeTab.scrollHeight;
            adjustWindowSize();
        }
    };

    (window as any).finishLlmAnswer = () => {
        isLlmGenerating = false;
        if (currentStopBtn) currentStopBtn.style.display = 'none';
        if (activeActionsContainer) activeActionsContainer.style.display = 'flex';                
    };

    function startTelemetry() {
        const loaderText = document.getElementById('loader-text');
        if (loaderText && !document.getElementById('startup-loader')?.classList.contains('hidden')) {
            loaderText.innerText = t('loader-connecting');
        }

        const ws = new WebSocket('ws://localhost:8765');

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "start_telemetry" }));
            document.getElementById('system-stats')?.classList.remove('hidden');

            setTimeout(() => {
                const loader = document.getElementById('startup-loader');
                if (loader && !loader.classList.contains('hidden')) {
                    loader.classList.add('hidden');
                }
            }, 800);
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === "telemetry") {
                    const cpuEl = document.getElementById('cpu-stat'); const gpuEl = document.getElementById('gpu-stat');
                    if (cpuEl) cpuEl.innerText = `CPU: ${data.cpu}%`; if (gpuEl) gpuEl.innerText = `GPU: ${data.gpu}%`;
                }
            } catch (err) { }
        };

        ws.onclose = () => {
            document.getElementById('system-stats')?.classList.add('hidden');

            if (loaderText && !document.getElementById('startup-loader')?.classList.contains('hidden')) {
                loaderText.innerText = t('loader-waiting');
            }

            setTimeout(startTelemetry, 2000);                
        };

        ws.onerror = () => ws.close();
    }

    const dropdownTypes = ['model', 'llm', 'mic'];
    const modalBodyForScroll = document.querySelector('.modal-body') as HTMLElement;

    dropdownTypes.forEach(type => {
        const selectedEl = document.getElementById(`${type}-dropdown-selected`);
        const containerEl = document.getElementById(`${type}-dropdown-container`);
        const optionsEl = document.getElementById(`${type}-dropdown-options`);

        if (selectedEl && containerEl && optionsEl && modalBodyForScroll) {
            selectedEl.addEventListener('click', () => {
                setTimeout(() => {
                    if (containerEl.classList.contains('open')) {
                        const optionsRect = optionsEl.getBoundingClientRect();
                        const modalRect = modalBodyForScroll.getBoundingClientRect();

                        if (optionsRect.bottom > modalRect.bottom) {
                            const scrollAmount = optionsRect.bottom - modalRect.bottom + 15;
                            modalBodyForScroll.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                        }
                    }
                }, 50);
            });
        }
    });

    startTelemetry();
});