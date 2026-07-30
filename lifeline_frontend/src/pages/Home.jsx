import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  Droplet, Activity, ShieldCheck, Clock, PhoneCall,
  Users, Building2, Heart, ChevronDown, Mic, MapPin
} from "lucide-react";

const S = {
  hero: {
    position:"relative", minHeight:"100svh", display:"flex", alignItems:"center",
    paddingTop:80, overflow:"hidden", background:"#0D0D0D",
  },
  heroBg: {
    position:"absolute", inset:0, zIndex:0,
  },
  heroBgImg: {
    width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", opacity:.35,
  },
  heroOverlay1: {
    position:"absolute", inset:0,
    background:"linear-gradient(to bottom,rgba(13,13,13,.85) 0%,rgba(13,13,13,.45) 50%,rgba(13,13,13,1) 100%)",
  },
  heroOverlay2: {
    position:"absolute", inset:0,
    background:"radial-gradient(ellipse at center,rgba(139,0,0,.15) 0%,rgba(13,13,13,1) 75%)",
  },
  heroContent: {
    position:"relative", zIndex:1, maxWidth:1200, width:"100%",
    margin:"0 auto", padding:"0 32px",
    display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center",
  },
  h1: {
    fontFamily:"'Oswald',sans-serif",
    fontSize:"clamp(3rem,9vw,6.5rem)",
    fontWeight:700,
    textTransform:"uppercase",
    letterSpacing:"-.01em",
    lineHeight:1,
    color:"white",
    margin:"24px 0 8px",
  },
  h1Red: {
    background:"linear-gradient(180deg,#e74c3c 0%,#8B0000 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    textShadow:"none",
    filter:"drop-shadow(0 0 20px rgba(192,57,43,.6))",
  },
  tagline: {
    fontSize:"clamp(1rem,2.5vw,1.3rem)", color:"#ccc", fontWeight:300,
    maxWidth:600, lineHeight:1.7, margin:"0 auto",
  },
  ctaRow: {
    display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", marginTop:36,
  },
  btnPrimary: {
    display:"flex", alignItems:"center", gap:8,
    padding:"16px 36px",
    background:"linear-gradient(135deg,#C0392B,#8B0000)",
    color:"white", border:"none", borderRadius:3,
    fontFamily:"'Oswald',sans-serif", fontWeight:700,
    fontSize:"1.05rem", letterSpacing:".12em", textTransform:"uppercase",
    cursor:"pointer", transition:"all .2s",
    textDecoration:"none",
  },
  btnSecondary: {
    display:"flex", alignItems:"center", gap:8,
    padding:"16px 36px",
    background:"rgba(255,255,255,.04)",
    color:"white", border:"1px solid rgba(192,57,43,.5)", borderRadius:3,
    fontFamily:"'Oswald',sans-serif", fontWeight:700,
    fontSize:"1.05rem", letterSpacing:".12em", textTransform:"uppercase",
    cursor:"pointer", transition:"all .2s",
    textDecoration:"none",
  },
  statsBar: {
    marginTop:60, paddingTop:28,
    borderTop:"1px solid rgba(255,255,255,.08)",
    width:"100%", maxWidth:700,
    display:"flex", justifyContent:"space-around",
  },
  statNum: {
    fontFamily:"'Oswald',sans-serif", fontSize:"1.8rem", fontWeight:700, color:"white",
  },
  statLabel: {
    fontSize:".72rem", color:"#555", textTransform:"uppercase", letterSpacing:".1em", marginTop:4,
  },
  sectionDark: {
    padding:"96px 32px", background:"#111",
  },
  sectionDarker: {
    padding:"96px 32px", background:"#0D0D0D",
  },
  sectionInner: {
    maxWidth:1200, margin:"0 auto",
  },
  sectionTitle: {
    fontFamily:"'Oswald',sans-serif",
    fontSize:"clamp(2rem,4vw,3rem)",
    fontWeight:700, textTransform:"uppercase",
    color:"white", marginBottom:8,
  },
  sectionRed: { color:"#C0392B" },
  sectionSub: { color:"#666", fontSize:"1rem", marginTop:0, marginBottom:60 },
  timelineWrap: { position:"relative", maxWidth:700, margin:"0 auto" },
  timelineLine: {
    position:"absolute", left:20,
    top:0, bottom:0, width:2,
    background:"linear-gradient(to bottom,#8B0000,#C0392B,rgba(192,57,43,0))",
    borderRadius:2,
  },
  step: {
    display:"flex", gap:28, paddingLeft:60, marginBottom:52, position:"relative",
  },
  stepDot: {
    position:"absolute", left:11, top:4,
    width:20, height:20, borderRadius:"50%",
    background:"#111", border:"3px solid #C0392B",
    boxShadow:"0 0 12px rgba(192,57,43,.7)",
  },
  stepNum: {
    fontFamily:"'Oswald',sans-serif", color:"#C0392B", fontWeight:700,
    fontSize:"1rem", letterSpacing:".2em", marginBottom:4,
  },
  stepTitle: { color:"white", fontWeight:600, fontSize:"1.2rem", marginBottom:6 },
  stepText: { color:"#777", lineHeight:1.7, margin:0 },
  featureGrid: {
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
    gap:16, marginTop:48,
  },
  featureCard: {
    background:"#141414", border:"1px solid #222",
    borderRadius:4, padding:28,
    transition:"border-color .2s",
    cursor:"default",
  },
  featureIcon: { color:"#C0392B", marginBottom:16 },
  featureTitle: { color:"white", fontWeight:600, fontSize:"1rem", marginBottom:8, marginTop:0 },
  featureText: { color:"#666", fontSize:".88rem", lineHeight:1.7, margin:0 },
  communitySection: {
    padding:"80px 32px", background:"#0D0D0D",
    borderTop:"1px solid rgba(90,16,16,.4)",
  },
  communityInner: {
    maxWidth:1200, margin:"0 auto",
    display:"flex", alignItems:"center", gap:56,
    flexWrap:"wrap",
  },
  communityImg: {
    flex:"1 1 420px", borderRadius:4,
    border:"1px solid rgba(90,16,16,.5)",
    boxShadow:"0 0 60px rgba(139,0,0,.25)",
    overflow:"hidden", position:"relative",
  },
  statsSection: {
    padding:"80px 32px",
    background:"linear-gradient(to bottom,#0a0a0a,#100000)",
    borderTop:"1px solid rgba(90,16,16,.35)",
    textAlign:"center",
  },
  statsGrid: {
    display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
    gap:40, maxWidth:800, margin:"48px auto 0",
  },
  bigNum: {
    fontFamily:"'Oswald',sans-serif",
    fontSize:"clamp(3.5rem,7vw,6rem)",
    fontWeight:700, color:"white",
    background:"linear-gradient(180deg,#fff 0%,#666 100%)",
    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
    lineHeight:1, marginBottom:12,
  },
  bigLabel: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    color:"#C0392B", fontWeight:600, fontSize:".82rem",
    letterSpacing:".12em", textTransform:"uppercase",
  },
  ctaSection: {
    padding:"80px 32px",
    background:"#0D0D0D",
    borderTop:"1px solid rgba(90,16,16,.35)",
    textAlign:"center",
  },
  footer: {
    background:"#050505", padding:"64px 32px 32px",
    borderTop:"1px solid rgba(90,16,16,.4)",
  },
  footerGrid: {
    maxWidth:1200, margin:"0 auto",
    display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
    gap:40, marginBottom:40,
  },
  footerHead: {
    fontFamily:"'Oswald',sans-serif", fontWeight:700,
    color:"white", letterSpacing:".15em", textTransform:"uppercase",
    fontSize:".85rem", marginBottom:20, marginTop:0,
  },
  footerLink: { color:"#555", fontSize:".88rem", display:"block", marginBottom:10, textDecoration:"none" },
  footerBottom: {
    maxWidth:1200, margin:"28px auto 0",
    paddingTop:24, borderTop:"1px solid #1a1a1a",
    display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
  },
};

export default function Home() {
  const { t, lang } = useLanguage();

  return (
    <div style={{ background:"#0D0D0D", minHeight:"100vh" }}>

      {/* ── HERO ────────────────────────────────── */}
      <section style={S.hero}>
        <div style={S.heroBg}>
          <img src="/images/lifeline-crimson-hero.png" alt="" style={S.heroBgImg} />
          <div style={S.heroOverlay1} />
          <div style={S.heroOverlay2} />
        </div>

        <div style={S.heroContent}>
          <div style={{ position:"relative", marginBottom:16 }}>
            <Droplet size={88} style={{ color:"#C0392B", fill:"#C0392B" }} className="pulse-drop" />
            <div style={{ position:"absolute", inset:0, background:"#C0392B", filter:"blur(40px)", opacity:.25, borderRadius:"50%" }} />
          </div>

          <h1 style={S.h1}>
            Your Blood.{" "}
            <span style={S.h1Red}>Their Life.</span>
          </h1>

          <p style={S.tagline}>
            Pakistan's first verified emergency blood network. Real-time matching. Zero delays.
          </p>
          <p className="font-urdu" style={{ color:"#C0392B", fontSize:"clamp(1.4rem,3vw,2rem)", margin:"12px 0 0", opacity:.9 }} dir="rtl">
            آپ کا خون، کسی کی زندگی
          </p>

          <div style={S.ctaRow}>
            <Link to="/register/donor" style={S.btnPrimary} className="pulse-glow">
              <Droplet size={18} style={{ fill:"white" }} /> Donate Blood
            </Link>
            <Link to="/register/patient" style={S.btnSecondary}>
              <Activity size={18} /> Request Blood
            </Link>
          </div>

          <div style={S.statsBar}>
            {[["Sindh · Punjab","Active Regions"],["< 15 min","Avg Match Time"],["24 / 7","Emergency"]].map(([n,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={S.statNum}>{n}</div>
                <div style={S.statLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:4, opacity:.4, animation:"bounce 2s infinite" }}>
          <span style={{ fontSize:10, letterSpacing:".15em", textTransform:"uppercase" }}>Scroll</span>
          <ChevronDown size={14} />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section style={S.sectionDark} id="how-it-works">
        <div style={S.sectionInner}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <h2 style={{ ...S.sectionTitle, fontFamily:"'Oswald',sans-serif" }}>
              Every Second <span style={S.sectionRed}>Counts</span>
            </h2>
            <p style={S.sectionSub}>
              Our streamlined process connects patients with compatible donors instantly — no middlemen, no delays.
            </p>
            <p className="font-urdu" style={{ color:"#C0392B", fontSize:"1.4rem", opacity:.8 }} dir="rtl">ہمارا مقصد: بروقت مدد</p>
          </div>

          <div style={S.timelineWrap}>
            <div style={S.timelineLine} />
            {[
              ["01","Register or Request","Patients post urgent requirements with hospital details. Donors register once with their NADRA CNIC for verified identity."],
              ["02","Intelligent Matching","Our system alerts nearby eligible donors based on blood group and location, factoring in a strict 90-day donation cooldown."],
              ["03","Secure Connection","Donor and patient connect via masked calls. Hospital staff verifies the donor upon arrival. Lives saved — privacy intact."],
            ].map(([num,title,text])=>(
              <div key={num} style={S.step}>
                <div style={S.stepDot} />
                <div>
                  <div style={S.stepNum}>STEP {num}</div>
                  <div style={S.stepTitle}>{title}</div>
                  <p style={S.stepText}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────── */}
      <section style={S.sectionDarker} id="features">
        <div style={S.sectionInner}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"1px solid rgba(90,16,16,.35)", paddingBottom:28, marginBottom:8, flexWrap:"wrap", gap:16 }}>
            <div>
              <h2 style={{ ...S.sectionTitle, marginBottom:8 }}>
                Built for <span style={S.sectionRed}>Trust</span> &amp; Speed
              </h2>
              <p style={{ color:"#555", margin:0 }}>In emergencies, hesitation costs lives. LifeLine removes friction while maintaining absolute security.</p>
            </div>
            <p className="font-urdu" style={{ color:"#444", fontSize:"1.4rem" }} dir="rtl">اعتبار اور تیز ترین رابطہ</p>
          </div>

          <div style={S.featureGrid}>
            {[
              [ShieldCheck,"Verified Identity","Every user authenticated via NADRA integration — eliminating spam and protecting vulnerable patients."],
              [Activity,"Donor Cooldown","Automated tracking prevents donors from being requested within 90 days of their last donation. Health first."],
              [PhoneCall,"Masked Calling","Call donors or patients directly through the platform without exposing personal phone numbers. Privacy by design."],
              [Mic,"Voice Accessibility","Bilingual voice-prompt interface in Urdu and English for users who prefer speaking over typing."],
              [MapPin,"Location Matching","Geolocation-based donor discovery finds the nearest compatible blood group within minutes."],
              [Building2,"Hospital Portal","Dedicated dashboard for hospital staff to broadcast requests and track all active patient matches in real time."],
            ].map(([Icon,title,text])=>(
              <div key={title} style={S.featureCard}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#5a1010"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#222"}>
                <Icon size={36} style={S.featureIcon} />
                <h3 style={S.featureTitle}>{title}</h3>
                <p style={S.featureText}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY IMAGE ─────────────────────── */}
      <section style={S.communitySection}>
        <div style={S.communityInner}>
          <div style={S.communityImg}>
            <img src="/images/lifeline-urdu-hero.png" alt="Pakistani blood donation community"
              style={{ width:"100%", height:"auto", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to left,rgba(13,13,13,.35),transparent)", pointerEvents:"none" }} />
          </div>

          <div style={{ flex:"1 1 320px" }}>
            <span style={{ fontFamily:"'Oswald',sans-serif", color:"#C0392B", fontSize:".8rem", fontWeight:700, letterSpacing:".25em", textTransform:"uppercase" }}>
              Our Community
            </span>
            <h2 style={{ ...S.sectionTitle, marginTop:12, marginBottom:8, fontSize:"clamp(1.8rem,3.5vw,2.8rem)" }}>
              Pakistan's <span style={S.sectionRed}>Beating</span> Heart
            </h2>
            <p className="font-urdu" style={{ color:"#C0392B", fontSize:"1.6rem", opacity:.85, margin:"8px 0 20px" }} dir="rtl">
              خون کا عطیہ، زندگی کا تحفہ
            </p>
            <p style={{ color:"#666", lineHeight:1.8, fontSize:"1rem", marginBottom:28 }}>
              Thousands of ordinary Pakistanis — students, professionals, families — are already saving lives through LifeLine.
              Your single donation can save up to three lives. Join the movement.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, borderTop:"1px solid #222", paddingTop:24 }}>
              {[["14.2k","Donors"],["8,450","Lives Saved"],["112","Hospitals"]].map(([n,l])=>(
                <div key={l}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1.6rem", fontWeight:700, color:"white" }}>{n}</div>
                  <div style={{ color:"#555", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".08em", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────── */}
      <section style={S.statsSection} id="impact">
        <h2 style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1rem", color:"#444", letterSpacing:".3em", textTransform:"uppercase", margin:0 }}>
          The Impact So Far
        </h2>
        <div style={S.statsGrid}>
          {[
            [Users,"14.2k","Registered Donors"],
            [Heart,"8,450","Lives Saved"],
            [Building2,"112","Partner Hospitals"],
          ].map(([Icon,n,l])=>(
            <div key={l} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={S.bigNum}>{n}</div>
              <div style={S.bigLabel}><Icon size={16}/>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section style={S.ctaSection}>
        <Droplet size={56} style={{ color:"#C0392B", fill:"#C0392B", opacity:.45, marginBottom:24 }} />
        <h2 style={{ ...S.sectionTitle, fontSize:"clamp(2rem,5vw,4rem)", marginBottom:12 }}>
          Be The <span style={S.sectionRed}>Difference</span>
        </h2>
        <p style={{ color:"#666", fontSize:"1.05rem", marginBottom:36, fontWeight:300 }}>
          Register today. Someone might need you tomorrow.
        </p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
          <Link to="/register/donor" style={S.btnPrimary} className="pulse-glow">
            <Droplet size={18} style={{ fill:"white" }} /> Register as Donor
          </Link>
          <Link to="/register/patient" style={S.btnSecondary}>
            <Activity size={18} /> Request Blood
          </Link>
        </div>
        <p style={{ marginTop:20 }}>
          <Link to="/voice-register" style={{ color:"#555", fontSize:".85rem" }}>
            🎤 Can't type? Use Voice Mode →
          </Link>
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerGrid}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <Droplet size={22} style={{ color:"#C0392B", fill:"#C0392B" }} />
              <span style={{ fontFamily:"'Oswald',sans-serif", fontSize:"1.2rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"white" }}>
                Life<span style={{ color:"#C0392B" }}>Line</span>
              </span>
            </div>
            <p style={{ color:"#444", fontSize:".85rem", lineHeight:1.7, margin:"0 0 12px" }}>
              A non-profit initiative bridging the gap between blood donors and patients across Pakistan.
            </p>
            <p className="font-urdu" style={{ color:"#444", fontSize:"1rem" }} dir="rtl">انسانیت کی خدمت</p>
          </div>

          <div>
            <h4 style={S.footerHead}>Platform</h4>
            <Link to="/register/patient" style={S.footerLink}>Find Blood</Link>
            <Link to="/register/donor" style={S.footerLink}>Register as Donor</Link>
            <Link to="/register/hospital" style={S.footerLink}>Hospital Portal</Link>
            <Link to="/hospitals" style={S.footerLink}>Hospital Directory</Link>
          </div>

          <div>
            <h4 style={S.footerHead}>Register</h4>
            <Link to="/register/donor" style={S.footerLink}>Donor Registration</Link>
            <Link to="/register/patient" style={S.footerLink}>Patient Registration</Link>
            <Link to="/register/hospital" style={S.footerLink}>Hospital Registration</Link>
            <Link to="/voice-register" style={S.footerLink}>Voice Mode</Link>
          </div>

          <div>
            <h4 style={S.footerHead}>Emergency</h4>
            <div style={{ background:"#111", padding:16, border:"1px solid rgba(90,16,16,.3)", borderRadius:3 }}>
              <p style={{ color:"#555", fontSize:".72rem", textTransform:"uppercase", letterSpacing:".1em", margin:"0 0 6px" }}>24/7 Helpline</p>
              <p style={{ fontFamily:"'Oswald',sans-serif", color:"white", fontSize:"1.3rem", fontWeight:700, margin:"0 0 12px" }}>111-BLOOD-PK</p>
              <p style={{ color:"#444", fontSize:".75rem", margin:0, lineHeight:1.6 }}>
                For life-threatening emergencies, dial 1122 or Edhi 115 first.
              </p>
            </div>
          </div>
        </div>

        <div style={S.footerBottom}>
          <p style={{ color:"#333", fontSize:".78rem", margin:0 }}>
            © {new Date().getFullYear()} LifeLine Pakistan. All rights reserved.
          </p>
          <div style={{ display:"flex", gap:20 }}>
            {["Twitter","Facebook","Instagram"].map(s=>(
              <a key={s} href="#" style={{ color:"#333", fontSize:".78rem", letterSpacing:".08em", textTransform:"uppercase" }}
                onMouseEnter={e=>e.target.style.color="#C0392B"}
                onMouseLeave={e=>e.target.style.color="#333"}>{s}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
