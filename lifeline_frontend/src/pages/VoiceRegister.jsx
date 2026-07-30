import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Mic, MicOff, CheckCircle, XCircle, Volume2 } from "lucide-react";

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const DONOR_STEPS = [
  { key:"username",     prompt:{ en:"What username would you like?",           ur:"آپ کون سا صارف نام چاہتے ہیں؟" },             type:"text" },
  { key:"email",        prompt:{ en:"What is your email address?",              ur:"آپ کا ای میل ایڈریس کیا ہے؟" },              type:"text" },
  { key:"cnic",         prompt:{ en:"Please say or type your CNIC number.",     ur:"براہ کرم اپنا شناختی کارڈ نمبر بولیں یا لکھیں۔" }, type:"text" },
  { key:"phone_number", prompt:{ en:"What is your phone number?",               ur:"آپ کا فون نمبر کیا ہے؟" },                   type:"text" },
  { key:"blood_group",  prompt:{ en:"What is your blood group? For example, O positive.", ur:"آپ کا خون کا گروپ کیا ہے؟" },      type:"text" },
  { key:"city",         prompt:{ en:"Which city are you in?",                   ur:"آپ کس شہر میں ہیں؟" },                        type:"text" },
  { key:"age",          prompt:{ en:"What is your age?",                        ur:"آپ کی عمر کیا ہے؟" },                         type:"number" },
  { key:"weight_kg",    prompt:{ en:"What is your weight in kilograms?",        ur:"آپ کا وزن کلوگرام میں کیا ہے؟" },            type:"number" },
];

const PATIENT_STEPS = [
  { key:"username",              prompt:{ en:"What username would you like?",               ur:"آپ کون سا صارف نام چاہتے ہیں؟" }, type:"text" },
  { key:"email",                 prompt:{ en:"What is your email address?",                  ur:"آپ کا ای میل ایڈریس کیا ہے؟" },  type:"text" },
  { key:"cnic",                  prompt:{ en:"Please say or type your CNIC number.",         ur:"براہ کرم اپنا شناختی کارڈ نمبر بولیں۔" }, type:"text" },
  { key:"phone_number",          prompt:{ en:"What is your phone number?",                   ur:"آپ کا فون نمبر کیا ہے؟" },       type:"text" },
  { key:"patient_name",          prompt:{ en:"Who is this request for? Please say their name.", ur:"یہ درخواست کس کے لیے ہے؟" }, type:"text" },
  { key:"blood_group",           prompt:{ en:"What blood group is needed?",                  ur:"کون سا خون کا گروپ درکار ہے؟" },  type:"text" },
  { key:"units_required",        prompt:{ en:"How many units are required?",                 ur:"کتنے یونٹس درکار ہیں؟" },         type:"number" },
  { key:"hospital_name_freetext",prompt:{ en:"Which hospital?",                             ur:"کون سا ہسپتال؟" },                 type:"text" },
  { key:"urgency_level",         prompt:{ en:"How urgent is this — low, medium, high, or critical?", ur:"یہ کتنا فوری ہے؟" },    type:"text" },
];

/* ── speak helper ── */
function speak(text, lang) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel(); // stop any current speech first
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = lang === "ur" ? "ur-PK" : "en-US";
    utter.rate  = 0.92;
    utter.pitch = 1;
    utter.onend = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
}

/* ── listenOnce (fixed) ──
   Properly handles: no-speech timeout, end without result, permission denied */
function listenOnce(lang, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionAPI) {
      reject(new Error("not-supported"));
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "ur" ? "ur-PK" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    let gotResult = false;
    let done = false;

    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timerId);
      try { recognition.abort(); } catch (_) {}
      fn();
    };

    // Timeout: if no speech detected within timeoutMs, fail gracefully
    const timerId = setTimeout(() => {
      finish(() => reject(new Error("timeout")));
    }, timeoutMs);

    recognition.onresult = (e) => {
      gotResult = true;
      const transcript = e.results[0][0].transcript;
      finish(() => resolve(transcript));
    };

    recognition.onerror = (e) => {
      finish(() => reject(new Error(e.error || "recognition-error")));
    };

    // onend fires when recognition stops — if we didn't get a result, it's a "no-speech"
    recognition.onend = () => {
      if (!gotResult) {
        finish(() => reject(new Error("no-speech")));
      }
    };

    try {
      recognition.start();
    } catch (err) {
      finish(() => reject(err));
    }
  });
}

function voiceErrorMessage(err, lang) {
  const code = err?.message || "";
  if (code === "not-supported") return "Speech recognition isn't supported in your browser. Please use Chrome or Edge, or type your answers below.";
  if (code === "not-allowed" || code === "permission-denied") return lang === "ur" ? "مائیکروفون کی اجازت نہیں ملی۔ براہ کرم اجازت دیں۔" : "Microphone permission was denied. Please allow microphone access and try again.";
  if (code === "no-speech" || code === "timeout") return lang === "ur" ? "آواز نہیں سنی گئی۔ دوبارہ کوشش کریں یا نیچے ٹائپ کریں۔" : "No speech detected. Please speak clearly into your microphone, or type your answer below.";
  if (code === "network") return "Network error during speech recognition. Please check your connection.";
  if (code === "audio-capture") return "No microphone found. Please connect a microphone and try again.";
  return lang === "ur" ? "آواز نہیں سنی گئی — نیچے ٹائپ کر سکتے ہیں۔" : "Didn't catch that — you can type your answer below instead.";
}

export default function VoiceRegister() {
  const { lang, setLang } = useLanguage();
  const { applyTokensAndLoadUser } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState("language");
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
    await speak("Welcome to LifeLine Voice Mode. Say 'English' or 'Urdu' to choose your language.", "en");
  }, []);

  useEffect(() => { if (stage === "language") askLanguage(); }, [stage, askLanguage]);

  const chooseLanguageByVoice = async () => {
    setListening(true); setError(null);
    try {
      const heard = await listenOnce("en");
      const lower = heard.toLowerCase();
      const chosen = lower.includes("urdu") || lower.includes("اردو") ? "ur" : "en";
      setVoiceLang(chosen); setLang(chosen); setStage("role");
    } catch (err) {
      setError(voiceErrorMessage(err, "en"));
    } finally { setListening(false); }
  };

  const askRole = useCallback(async () => {
    await speak(voiceLang === "ur" ? "کیا آپ عطیہ دہندہ ہیں یا مریض؟" : "Are you a donor or a patient?", voiceLang);
  }, [voiceLang]);

  useEffect(() => { if (stage === "role") askRole(); }, [stage, askRole]);

  const chooseRoleByVoice = async () => {
    setListening(true); setError(null);
    try {
      const heard = await listenOnce(voiceLang);
      const lower = heard.toLowerCase();
      const chosenRole = (lower.includes("patient") || lower.includes("مریض")) ? "patient" : "donor";
      setRole(chosenRole); setStage("fields"); setStepIndex(0);
    } catch (err) {
      setError(voiceErrorMessage(err, voiceLang));
    } finally { setListening(false); }
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
      setPendingTranscript(heard); setConfirming(true);
      await speak(
        voiceLang === "ur" ? `میں نے سنا: ${heard}۔ کیا یہ درست ہے؟` : `I heard: "${heard}". Is that correct?`,
        voiceLang
      );
    } catch (err) {
      setError(voiceErrorMessage(err, voiceLang));
    } finally { setListening(false); }
  };

  const confirmYes = () => {
    setAnswers((a) => ({ ...a, [currentStep.key]: pendingTranscript }));
    setConfirming(false); setPendingTranscript(""); advanceStep();
  };

  const confirmNo = () => {
    setConfirming(false); setPendingTranscript(""); askCurrentField();
  };

  const submitManual = () => {
    if (!manualInput.trim()) return;
    setAnswers((a) => ({ ...a, [currentStep.key]: manualInput.trim() }));
    setManualInput(""); advanceStep();
  };

  const advanceStep = () => {
    if (stepIndex + 1 < steps.length) setStepIndex((i) => i + 1);
    else setStage("review");
  };

  const submit = async () => {
    setStage("submitting"); setError(null);
    try {
      if (role === "donor") {
        const payload = {
          username:answers.username, email:answers.email, password,
          cnic:answers.cnic, phone_number:answers.phone_number,
          preferred_language:voiceLang,
          blood_group:normalizeBloodGroup(answers.blood_group),
          city:answers.city, age:Number(answers.age)||18, weight_kg:Number(answers.weight_kg)||50,
          travel_radius_km:15,
          has_recent_tattoo_or_piercing:false, has_recent_major_surgery:false,
          on_blood_thinners:false, hiv_positive:false, hepatitis_b_or_c:false,
          has_chronic_illness:false, recent_malaria_endemic_travel:false,
          is_pregnant_or_recent_childbirth:false,
        };
        const data = await api.post("/api/donors/register/", payload, { auth:false });
        await applyTokensAndLoadUser(data);
      } else {
        const payload = {
          username:answers.username, email:answers.email, password,
          cnic:answers.cnic, phone_number:answers.phone_number,
          preferred_language:voiceLang,
          patient_name:answers.patient_name,
          blood_group:normalizeBloodGroup(answers.blood_group),
          units_required:Number(answers.units_required)||1,
          hospital_name_freetext:answers.hospital_name_freetext,
          urgency_level:normalizeUrgency(answers.urgency_level),
        };
        const data = await api.post("/api/patients/register/", payload, { auth:false });
        await applyTokensAndLoadUser(data);
      }
      setStage("done");
      await speak(voiceLang === "ur" ? "رجسٹریشن مکمل ہو گئی۔" : "Registration complete. Welcome to LifeLine.", voiceLang);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(formatError(err));
      setStage("review");
    }
  };

  return (
    <div className="page page-narrow">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <Mic size={24} style={{ color:"#C0392B" }} />
        <h1 style={{ margin:0 }}>{voiceLang === "ur" ? "آواز کا موڈ" : "Voice Mode"}</h1>
      </div>
      <p className="subtitle">Register hands-free in English or Urdu using your voice.</p>

      {unsupported && (
        <div className="info-box" style={{ marginBottom:16 }}>
          <MicOff size={14} style={{ display:"inline", marginRight:6 }} />
          Speech recognition requires Chrome or Edge. You can still complete every step by typing below.
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom:16 }}>
          <XCircle size={14} style={{ display:"inline", marginRight:6 }} />
          {error}
        </div>
      )}

      {/* Progress */}
      {stage === "fields" && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ color:"#666", fontSize:".78rem", textTransform:"uppercase", letterSpacing:".08em" }}>Step {stepIndex+1} of {steps.length}</span>
            <span style={{ color:"#444", fontSize:".78rem" }}>{Math.round(((stepIndex+1)/steps.length)*100)}%</span>
          </div>
          <div style={{ height:3, background:"#1e1e1e", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${((stepIndex+1)/steps.length)*100}%`, background:"#C0392B", borderRadius:2, transition:"width .3s" }} />
          </div>
        </div>
      )}

      {/* ── LANGUAGE STAGE ── */}
      {stage === "language" && (
        <div className="card">
          <div className="voice-stage">
            <Volume2 size={20} style={{ color:"#C0392B", marginBottom:12 }} />
            <button className={`voice-mic-btn ${listening?"listening":""}`} onClick={chooseLanguageByVoice} disabled={listening}>
              🎤
            </button>
            <p className="voice-transcript">
              {listening ? (voiceLang==="ur"?"سن رہا ہوں…":"Listening…") : "Tap the mic and say 'English' or 'Urdu'"}
            </p>
            <div className="voice-confirm-buttons">
              <button className="btn btn-outline" onClick={()=>{ setVoiceLang("en"); setLang("en"); setStage("role"); }}>English</button>
              <button className="btn btn-outline" style={{ fontFamily:"'Noto Nastaliq Urdu',serif", fontSize:"1.1rem" }}
                onClick={()=>{ setVoiceLang("ur"); setLang("ur"); setStage("role"); }}>اردو</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE STAGE ── */}
      {stage === "role" && (
        <div className="card">
          <div className="voice-stage">
            <p style={{ color:"#aaa", marginBottom:16, fontSize:".95rem" }}>
              {voiceLang==="ur"?"کیا آپ عطیہ دہندہ ہیں یا مریض؟":"Are you a donor or a patient?"}
            </p>
            <button className={`voice-mic-btn ${listening?"listening":""}`} onClick={chooseRoleByVoice} disabled={listening}>
              🎤
            </button>
            <p className="voice-transcript">{listening ? "Listening…" : "Tap the mic and say 'donor' or 'patient'"}</p>
            <div className="voice-confirm-buttons">
              <button className="btn" onClick={()=>{ setRole("donor"); setStage("fields"); setStepIndex(0); }}>
                {voiceLang==="ur"?"عطیہ دہندہ":"Donor"}
              </button>
              <button className="btn btn-red" onClick={()=>{ setRole("patient"); setStage("fields"); setStepIndex(0); }}>
                {voiceLang==="ur"?"مریض":"Patient"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIELDS STAGE ── */}
      {stage === "fields" && currentStep && (
        <div className="card">
          <div className="voice-stage">
            <p style={{ fontWeight:600, color:"white", fontSize:"1.05rem", marginBottom:20 }}>
              {currentStep.prompt[voiceLang] || currentStep.prompt.en}
            </p>

            {!confirming && (
              <>
                <button className={`voice-mic-btn ${listening?"listening":""}`} onClick={listenForField} disabled={listening}>
                  🎤
                </button>
                <p className="voice-transcript">
                  {listening
                    ? (voiceLang==="ur"?"سن رہا ہوں…":"Listening… speak clearly")
                    : (voiceLang==="ur"?"مائیکروفون دبائیں یا نیچے لکھیں":"Tap the mic to answer, or type below")}
                </p>
                <div style={{ display:"flex", gap:8, marginTop:16, maxWidth:340, margin:"16px auto 0" }}>
                  <input
                    type={currentStep.type==="number"?"number":"text"}
                    value={manualInput}
                    onChange={(e)=>setManualInput(e.target.value)}
                    onKeyDown={(e)=>e.key==="Enter"&&submitManual()}
                    placeholder={voiceLang==="ur"?"جواب لکھیں":"Type your answer"}
                    style={{ flex:1 }}
                  />
                  <button className="btn btn-sm" onClick={submitManual} disabled={!manualInput.trim()}>OK</button>
                </div>
              </>
            )}

            {confirming && (
              <>
                <p style={{ color:"#C0392B", fontSize:"1.1rem", fontWeight:600, margin:"0 0 16px" }}>
                  "{pendingTranscript}"
                </p>
                <p style={{ color:"#888", fontSize:".9rem", margin:"0 0 16px" }}>
                  {voiceLang==="ur"?"کیا یہ درست ہے؟":"Is that correct?"}
                </p>
                <div className="voice-confirm-buttons">
                  <button className="btn" onClick={confirmYes} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <CheckCircle size={15}/> {voiceLang==="ur"?"ہاں، درست":"Yes, correct"}
                  </button>
                  <button className="btn btn-outline" onClick={confirmNo} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <XCircle size={15}/> {voiceLang==="ur"?"نہیں، دوبارہ":"No, try again"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW STAGE ── */}
      {stage === "review" && (
        <div className="card">
          <h2 style={{ marginTop:0 }}>Review Before Submitting</h2>
          <div style={{ marginBottom:20 }}>
            {steps.map((s) => (
              <div key={s.key} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1e1e1e" }}>
                <span style={{ color:"#666", fontSize:".82rem", textTransform:"uppercase", letterSpacing:".06em" }}>{s.key.replace(/_/g," ")}</span>
                <span style={{ color:answers[s.key]?"white":"#444", fontSize:".88rem" }}>{answers[s.key]||"—"}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
            <label>Password <span style={{ color:"#555", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(type only — never spoken aloud)</span></label>
            <input type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Choose a password (min 8 chars)" />
          </div>

          <button className="btn btn-red" style={{ width:"100%" }} onClick={submit} disabled={!password||password.length<8}>
            Submit Registration
          </button>
        </div>
      )}

      {stage === "submitting" && (
        <div style={{ textAlign:"center", padding:40 }}>
          <div className="pulse-drop" style={{ display:"inline-block" }}>🔴</div>
          <p style={{ color:"#888", marginTop:12 }}>
            {voiceLang==="ur"?"جمع کروایا جا رہا ہے…":"Submitting your registration…"}
          </p>
        </div>
      )}

      {stage === "done" && (
        <div className="success-box" style={{ textAlign:"center", padding:28 }}>
          <CheckCircle size={32} style={{ color:"#58d68d", marginBottom:12 }} />
          <p style={{ margin:0, fontWeight:600 }}>Registration complete — taking you to your dashboard.</p>
        </div>
      )}
    </div>
  );
}

function normalizeBloodGroup(raw) {
  if (!raw) return "O+";
  const cleaned = raw.toUpperCase().replace(/\s+/g,"").replace(/POSITIVE/g,"+").replace(/NEGATIVE/g,"-").replace(/PLUS/g,"+").replace(/MINUS/g,"-");
  const groups = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
  return groups.find((bg) => cleaned.includes(bg)) || "O+";
}

function normalizeUrgency(raw) {
  if (!raw) return "medium";
  const l = raw.toLowerCase();
  if (l.includes("critical")||l.includes("فوری")) return "critical";
  if (l.includes("high")||l.includes("زیادہ")) return "high";
  if (l.includes("low")||l.includes("کم")) return "low";
  return "medium";
}

function formatError(err) {
  if (err.data && typeof err.data === "object")
    return Object.entries(err.data).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(", "):v}`).join(" | ");
  return err.message || "Something went wrong.";
}
