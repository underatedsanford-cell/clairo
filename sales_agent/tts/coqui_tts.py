import torch

try:
  from TTS.api import TTS  # type: ignore
  TTS_AVAILABLE = True
except Exception:
  TTS = None
  TTS_AVAILABLE = False

# Get device
device = "cuda" if torch.cuda.is_available() else "cpu"

tts = None
if TTS_AVAILABLE:
  try:
    # Init TTS
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
  except Exception:
    tts = None
    TTS_AVAILABLE = False

def synthesize_speech(text, speaker_wav, language, file_path):
  """Synthesizes speech from text and saves it to a file."""
  if not TTS_AVAILABLE or tts is None:
    raise RuntimeError("TTS is not available. Please install the 'TTS' package and ensure the model is accessible.")
  tts.tts_to_file(text=text, speaker_wav=speaker_wav, language=language, file_path=file_path)