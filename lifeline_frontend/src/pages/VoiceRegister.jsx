import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// Simplified field set for voice mode (see WEEK_5_6_FRONTEND_GUIDE.md for why
// the full donor eligibility checklist isn't read aloud field-by-field here).
const DONOR_STEPS = [
  { key: "username", prompt: { en: "What username would you like?", ur: "آپ کون سا صارف نام چاہتے ہیں؟" }, type: "text" },
  { key: "email", prompt: { en: "What is your email address?", ur: "آپ کا ای میل ایڈریس کیا ہے؟" }, type: "text" },
  { key: "cnic", prompt: { en: "Please say or type your CNIC number.", ur: "براہ کرم اپنا شناختی کارڈ نمبر بولیں یا لکھیں۔" }, type: "text" },
  { key: "phone_number", prompt: { en: "What is your phone number?", ur: "آپ کا فون نمبر کیا ہے؟" }, type: "text" },
  { key: "blood_group", prompt: { en: "What is your blood group? For example, O positive.", ur: "آپ کا خون کا گروپ کیا ہے؟" }, type: "text" },
  { key: "city", prompt: { en: "Which city are you in?", ur: "آپ کس شہر میں ہیں؟" }, type: "text" },
  { key: "age", prompt: { en: "What is your age?", ur: "آپ کی عمر کیا ہے؟" }, type: "number" },
  { key: "weight_kg", prompt: { en: "What is your weight in kilograms?", ur: "آپ کا وزن کلوگرام میں کیا ہے؟" }, type: "number" },
];

const PATIENT_STEPS = [
  { key: "username", prompt: { en: "What username would you like?", ur: "آپ کون سا صارف نام چاہتے ہیں؟" }, type: "text" },
  { key: "email", prompt: { en: "What is your email address?", ur: "آپ کا ای میل ایڈریس کیا ہے؟" }, type: "text" },
  { key: "cnic", prompt: { en: "Please say or type your CNIC number.", ur: "براہ کرم اپنا شناختی کارڈ نمبر بولیں یا لکھیں۔" }, type: "text" },
  { key: "phone_number", prompt: { en: "What is your phone number?", ur: "آپ کا فون نمبر کیا ہے؟" }, type: "text" },
  { key: "patient_name", prompt: { en: "Who is this request for? Please say their name.", ur: "یہ درخواست کس کے لیے ہے؟ ان کا نام بتائیں۔" }, type: "text" },
  { key: "blood_group", prompt: { en: "What blood group is needed?", ur: "کون سا خون کا گروپ درکار ہے؟" }, type: "text" },
  { key: "units_required", prompt: { en: "How many units are required?", ur: "کتنے یونٹس درکار ہیں؟" }, type: "number" },
  { key: "hospital_name_freetext", prompt: { en: "Which hospital?", ur: "کون سا ہسپتال؟" }, type: "text" },
  { key: "urgency_level", prompt: { en: "How urgent is this — low, medium, high, or critical?", ur: "یہ کتنا فوری ہے؟" }, type: "text" },
];

function speak(text, lang) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ur" ? "ur-PK" : "en-US";
    utter.onend = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
}

function listenOnce(lang) {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionAPI) { reject(new Error("not-supported")); return; }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "ur" ? "ur-PK" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => resolve(e.results[0][0].transcript);
    recognition.onerror = (e) => reject(e);
    recognition.onend = () => {};
    recognition.start();
  });
}

export default function VoiceRegister() {
  const { lang, setLang } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState("language"); // language -> role -> fields -> review -> submitting -> done
  const [voiceLang, setVoiceLang] = useState(lang || "en");
  const [role, setRole] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [unsupported] = useState(!SpeechRecognitionAPI);

  const steps = role === "donor" ? DONOR_STEPS : PATIENT_STEPS;
  const currentStep = steps[stepIndex];

  const askLanguage = useCallback(async () => {
    await speak("Say or tap: English, or Urdu.", "en");
  }, []);

  useEffect(() => { if (stage === "language") askLanguage(); }, [stage, askLanguage]);

  const chooseLanguageByVoice = async () => {
    setListening(true); setError(null);
    try {
      const heard = await listenOnce("en");
      const lower = heard.toLowerCase();
      const chosen = lower.includes("urdu") ? "ur" : "en";
      setVoiceLang(chosen);
      setLang(chosen);
      setStage("role");
    } catch {
      setError("Didn't catch that — you can also just tap a button below.");
    } finally {
      setListening(false);
    }
  };

  const askRole = async () => {
    await speak(voiceLang === "ur" ? "کیا آپ عطیہ دہندہ ہیں یا مریض؟" : "Are you a donor, or a patient?", voiceLang);
  };
  useEffect(() => { if (stage === "role") askRole(); /* eslint-disable-next-line */ }, [stage]);

  const chooseRoleByVoice = async () => {
    setListening(true); setError(null);
    try {
      const heard = await listenOnce(voiceLang);
      const lower = heard.toLowerCase();
      const chosenRole = (lower.includes("patient") || lower.includes("مریض")) ? "patient" : "donor";
      setRole(chosenRole);
      setStage("fields");
      setStepIndex(0);
    } catch {
      setError("Didn't catch that — tap a button below instead.");
    } finally {
      setListening(false);
    }
  };

  const askCurrentField = useCallback(async () => {
    if (!currentStep) return;
    await speak(currentStep.prompt[voiceLang] || currentStep.prompt.en, voiceLang);
  }, [currentStep, voiceLang]);

  useEffect(() => {
    if (stage === "fields" && currentStep) askCurrentField();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, stepIndex]);

  const listenForField = async () => {
    setListening(true); setError(null);
    try {
      const heard = await listenOnce(voiceLang);
      setPendingTranscript(heard);
      setConfirming(true);
      await speak(
        voiceLang === "ur" ? `میں نے سنا: ${heard}۔ کیا یہ درست ہے؟` : `I heard: ${heard}. Is that correct?`,
        voiceLang
      );
    } catch {
      setError("Didn't catch that — you can type it below instead.");
    } finally {
      setListening(false);
    }
  };

  const confirmYes = () => {
    setAnswers((a) => ({ ...a, [currentStep.key]: pendingTranscript }));
    setConfirming(false);
    setPendingTranscript("");
    advanceStep();
  };

  const confirmNo = () => {
    setConfirming(false);
    setPendingTranscript("");
    // stay on the same step, will re-prompt via the effect on next render if we bump a retry key
    askCurrentField();
  };

  const submitManual = () => {
    if (!manualInput.trim()) return;
    setAnswers((a) => ({ ...a, [currentStep.key]: manualInput.trim() }));
    setManualInput("");
    advanceStep();
  };

  const advanceStep = () => {
    if (stepIndex + 1 < steps.length) {
      setStepIndex((i) => i + 1);
    } else {
      setStage("review");
    }
  };

  const submit = async () => {
    setStage("submitting");
    setError(null);
    try {
      if (role === "donor") {
        const payload = {
          username: answers.username, email: answers.email, password,
          cnic: answers.cnic, phone_number: answers.phone_number,
          preferred_language: voiceLang,
          blood_group: normalizeBloodGroup(answers.blood_group),
          city: answers.city, age: Number(answers.age) || 18, weight_kg: Number(answers.weight_kg) || 50,
          travel_radius_km: 15,
          has_recent_tattoo_or_piercing: false, has_recent_major_surgery: false,
          on_blood_thinners: false, hiv_positive: false, hepatitis_b_or_c: false,
          has_chronic_illness: false, recent_malaria_endemic_travel: false,
          is_pregnant_or_recent_childbirth: false,
        };
        const data = await api.post("/api/donors/register/", payload, { auth: false });
        await applyTokensAndLoadUser(data);
      } else {
        const payload = {
          username: answers.username, email: answers.email, password,
          cnic: answers.cnic, phone_number: answers.phone_number,
          preferred_language: voiceLang,
          patient_name: answers.patient_name,
          blood_group: normalizeBloodGroup(answers.blood_group),
          units_required: Number(answers.units_required) || 1,
          hospital_name_freetext: answers.hospital_name_freetext,
          urgency_level: normalizeUrgency(answers.urgency_level),
        };
        const data = await api.post("/api/patients/register/", payload, { auth: false });
        await applyTokensAndLoadUser(data);
      }
      setStage("done");
      await speak(voiceLang === "ur" ? "رجسٹریشن مکمل ہو گئی۔" : "Registration complete.", voiceLang);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(formatError(err));
      setStage("review");
    }
  };

  return (
    <div className="page page-narrow">
      <h1>{voiceLang === "ur" ? "آواز کا موڈ" : "Voice Mode"}</h1>

      {unsupported && (
        <div className="error-box">
          Your browser doesn't support speech recognition (this works best in Chrome or Edge).
          You can still complete every step below by typing.
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {stage === "language" && (
        <div className="voice-stage">
          <button className={`voice-mic-btn ${listening ? "listening" : ""}`} onClick={chooseLanguageByVoice}>🎤</button>
          <p className="voice-transcript">{listening ? "Listening…" : "Tap the mic and say 'English' or 'Urdu'"}</p>
          <div className="voice-confirm-buttons">
            <button className="btn btn-outline" onClick={() => { setVoiceLang("en"); setLang("en"); setStage("role"); }}>English</button>
            <button className="btn btn-outline" onClick={() => { setVoiceLang("ur"); setLang("ur"); setStage("role"); }}>اردو</button>
          </div>
        </div>
      )}

      {stage === "role" && (
        <div className="voice-stage">
          <button className={`voice-mic-btn ${listening ? "listening" : ""}`} onClick={chooseRoleByVoice}>🎤</button>
          <p className="voice-transcript">{listening ? "Listening…" : "Tap the mic and say 'donor' or 'patient'"}</p>
          <div className="voice-confirm-buttons">
            <button className="btn btn-outline" onClick={() => { setRole("donor"); setStage("fields"); setStepIndex(0); }}>Donor</button>
            <button className="btn btn-outline" onClick={() => { setRole("patient"); setStage("fields"); setStepIndex(0); }}>Patient</button>
          </div>
        </div>
      )}

      {stage === "fields" && currentStep && (
        <div className="voice-stage">
          <p className="card-meta">Step {stepIndex + 1} of {steps.length}</p>
          <p style={{ fontWeight: 600 }}>{currentStep.prompt[voiceLang] || currentStep.prompt.en}</p>

          {!confirming && (
            <>
              <button className={`voice-mic-btn ${listening ? "listening" : ""}`} onClick={listenForField}>🎤</button>
              <p className="voice-transcript">{listening ? "Listening…" : "Tap the mic to answer, or type below"}</p>
              <div className="form-row" style={{ marginTop: 12 }}>
                <input
                  type={currentStep.type === "number" ? "number" : "text"}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Type your answer instead"
                />
                <button className="btn" onClick={submitManual}>OK</button>
              </div>
            </>
          )}

          {confirming && (
            <>
              <p className="voice-transcript">"{pendingTranscript}"</p>
              <div className="voice-confirm-buttons">
                <button className="btn" onClick={confirmYes}>Yes, correct</button>
                <button className="btn btn-outline" onClick={confirmNo}>No, try again</button>
              </div>
            </>
          )}
        </div>
      )}

      {stage === "review" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Review before submitting</h2>
          {steps.map((s) => (
            <p key={s.key} className="card-meta"><strong>{s.key}:</strong> {answers[s.key]}</p>
          ))}
          <label>Password (please type — never spoken aloud, for your privacy)</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-red" style={{ marginTop: 12 }} onClick={submit} disabled={!password || password.length < 8}>
            Submit registration
          </button>
        </div>
      )}

      {stage === "submitting" && <p>{voiceLang === "ur" ? "جمع کروایا جا رہا ہے…" : "Submitting…"}</p>}
      {stage === "done" && <div className="success-box">Registration complete — redirecting to your dashboard.</div>}
    </div>
  );
}

function normalizeBloodGroup(raw) {
  if (!raw) return "O+";
  const cleaned = raw.toUpperCase().replace(/\s/g, "");
  const match = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].find((bg) =>
    cleaned.includes(bg) || cleaned.includes(bg.replace("+", "POSITIVE")) || cleaned.includes(bg.replace("-", "NEGATIVE"))
  );
  return match || "O+";
}

function normalizeUrgency(raw) {
  if (!raw) return "medium";
  const lower = raw.toLowerCase();
  if (lower.includes("critical")) return "critical";
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  return "medium";
}

function formatError(err) {
  if (err.data && typeof err.data === "object") {
    return Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
  }
  return err.message || "Something went wrong.";
}
