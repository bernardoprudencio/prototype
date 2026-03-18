import { useState, useEffect, useRef } from "react";

// ─── Design Tokens (Kibble) ───
const T = {
  colorPrimary: "#1F2124",
  colorSecondary: "#404347",
  colorTertiary: "#62686E",
  colorSuccess: "#1B6C42",
  colorLink: "#2E67D1",
  colorWhite: "#FFFFFF",
  colorBgPrimary: "#FFFFFF",
  colorBgSecondary: "#F4F5F6",
  colorBgTertiary: "#E6E8EB",
  colorBorder: "#D7DCE0",
  colorBorderInteractive: "#C9CFD4",
  colorDisabledBg: "#F4F5F6",
  colorDisabledBorder: "#E8EBED",
  colorDisabledText: "#9EA5AC",
  colorYellow100: "#FCF6EB",
  colorYellow200: "#FFECBD",
  colorCyan100: "#E8F9FC",
  colorCyan200: "#8BE2EF",
  radiusPrimary: 8,
  radiusRound: 99999,
  shadow: "0px 1px 4px 0px rgba(27,31,35,0.24)",
  shadowMedium: "0px 2px 12px -1px rgba(27,31,35,0.24)",
};

// ─── Pet & People Images ───
const PET_IMAGES = {
  archie: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop&crop=face",
  koni: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200&h=200&fit=crop&crop=face",
  burley: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop&crop=face",
  owner: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
};

// ─── Date / Time Helpers ───
function formatHeaderDate() {
  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}
function formatLoadTime() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

// ─── SVG Icons ───
const Icons = {
  back: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke={T.colorPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={T.colorPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronUp: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 15L12 9L6 15" stroke={T.colorPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronRight: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke={T.colorTertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  more: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill={T.colorPrimary}/><circle cx="12" cy="12" r="1.5" fill={T.colorPrimary}/><circle cx="12" cy="19" r="1.5" fill={T.colorPrimary}/></svg>,
  map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke={T.colorPrimary} strokeWidth="1.5"/><circle cx="12" cy="10" r="3" stroke={T.colorPrimary} strokeWidth="1.5"/></svg>,
  paw: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 10.5C6.5 9 9.5 9 10.5 10.5C11.5 12 10 14 8 14C6 14 4.5 12 5.5 10.5Z" stroke={T.colorPrimary} strokeWidth="1.2"/><ellipse cx="4" cy="7" rx="1.5" ry="2" stroke={T.colorPrimary} strokeWidth="1.2"/><ellipse cx="7" cy="5" rx="1.3" ry="1.8" stroke={T.colorPrimary} strokeWidth="1.2"/><ellipse cx="9.5" cy="5" rx="1.3" ry="1.8" stroke={T.colorPrimary} strokeWidth="1.2"/><ellipse cx="12" cy="7" rx="1.5" ry="2" stroke={T.colorPrimary} strokeWidth="1.2"/></svg>,
  clock: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#D59418" strokeWidth="1.5"/><path d="M12 6V12L16 14" stroke="#D59418" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  edit: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={T.colorPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={T.colorPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 5" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  home: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill={T.colorPrimary}/></svg>,
  homeOutline: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={T.colorTertiary} strokeWidth="1.5"/></svg>,
  inbox: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke={T.colorTertiary} strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  rebook: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11V9a4 4 0 014-4h14" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 23l-4-4 4-4" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 13v2a4 4 0 01-4 4H3" stroke={T.colorTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  moreTab: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" stroke={T.colorTertiary} strokeWidth="1.5"/><circle cx="12" cy="12" r="1.5" stroke={T.colorTertiary} strokeWidth="1.5"/><circle cx="19" cy="12" r="1.5" stroke={T.colorTertiary} strokeWidth="1.5"/></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke={T.colorSecondary} strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" stroke={T.colorSecondary} strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke={T.colorSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ─── Pet Avatar ───
function PetAvatar({ size = 48, images = [], style = {} }) {
  const count = images.length || 1;
  return (
    <div style={{ display: "flex", position: "relative", width: count > 1 ? size + 16 : size, height: size, flexShrink: 0, ...style }}>
      {images.map((src, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: "50%",
          border: "2px solid white", position: count > 1 ? "absolute" : "relative",
          left: count > 1 ? i * 16 : 0, zIndex: 5 - i, overflow: "hidden", background: "#E8D5B7",
        }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}

function UserAvatar({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #CBD5E1, #94A3B8)", border: "1px solid white",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="5" fill="#64748B"/><path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="#64748B"/>
      </svg>
    </div>
  );
}

// ─── Button ───
function Button({ children, variant = "default", disabled = false, fullWidth = false, onClick, icon, style = {} }) {
  const base = {
    fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 14, lineHeight: "1.25",
    borderRadius: T.radiusRound, cursor: disabled ? "default" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: icon && !children ? 8 : "8px 16px",
    width: fullWidth ? "100%" : "auto", border: "2px solid",
    transition: "all 0.15s ease", flexShrink: 0, boxSizing: "border-box", whiteSpace: "nowrap",
  };
  const variants = {
    default: { background: T.colorWhite, borderColor: T.colorBorderInteractive, color: T.colorSecondary },
    primary: { background: T.colorLink, borderColor: T.colorLink, color: T.colorWhite },
    flat: { background: "transparent", borderColor: "transparent", color: T.colorLink },
    disabled: { background: T.colorDisabledBg, borderColor: T.colorDisabledBorder, color: T.colorDisabledText },
  };
  const v = disabled ? variants.disabled : variants[variant];
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...v, ...style }}>{icon}{children && <span>{children}</span>}</button>;
}

// ─── Banner Block ───
function BannerBlock({ text, link, onClick }) {
  return (
    <div style={{ background: T.colorYellow100, borderRadius: 4, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0 }}>{Icons.clock}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: T.colorPrimary, margin: 0 }}>{text}</p>
        {link && <p onClick={onClick} style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.colorLink, textDecoration: "underline", margin: "8px 0 0", cursor: "pointer" }}>{link}</p>}
      </div>
    </div>
  );
}

// ─── Chat Bubble ───
function ChatBubble({ message, time, isOwner = false, showCheck = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isOwner ? "flex-end" : "flex-start", padding: "0 0 8px" }}>
      <div style={{
        background: isOwner ? T.colorBgTertiary : T.colorBgSecondary,
        borderRadius: isOwner ? "10px 10px 0 10px" : "10px 10px 10px 0",
        padding: "8px 12px", maxWidth: "80%",
      }}>
        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: T.colorPrimary, margin: "0 0 4px" }}>{message}</p>
        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: isOwner ? "flex-end" : "flex-start" }}>
          <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 13, color: T.colorTertiary }}>{time}</span>
          {showCheck && Icons.check}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Bar ───
function TabBar({ activeTab = "home" }) {
  const tabs = [
    { id: "home", label: "HOME", icon: Icons.homeOutline, activeIcon: Icons.home },
    { id: "inbox", label: "INBOX", icon: Icons.inbox },
    { id: "calendar", label: "CALENDAR", icon: Icons.calendar },
    { id: "rebook", label: "REBOOK", icon: Icons.rebook },
    { id: "more", label: "MORE", icon: Icons.moreTab },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${T.colorBorder}`, background: T.colorWhite, flexShrink: 0 }}>
      {tabs.map(t => (
        <div key={t.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 0 4px", cursor: "pointer" }}>
          {activeTab === t.id && t.activeIcon ? t.activeIcon : t.icon}
          <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.07, color: activeTab === t.id ? T.colorPrimary : T.colorTertiary, lineHeight: "13px" }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Home Card ───
function HomeCard({ time, service, address, petNames, petImages, buttonLabel, disabled = false, onClick }) {
  return (
    <div onClick={onClick} style={{ background: T.colorWhite, borderRadius: 8, boxShadow: T.shadow, padding: "12px 20px", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: T.colorPrimary, margin: 0 }}>{time}</p>
          <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.25, color: T.colorSecondary, margin: 0 }}>{service}</p>
        </div>
        <PetAvatar size={48} images={petImages} />
      </div>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
          <span style={{ flexShrink: 0 }}>{Icons.map}</span>
          <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: T.colorPrimary }}>{address}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
          <span style={{ flexShrink: 0 }}>{Icons.paw}</span>
          <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: T.colorPrimary }}>{petNames}</span>
        </div>
        <div style={{ padding: "8px 0" }}>
          <Button variant="default" disabled={disabled} fullWidth>{buttonLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Sheet ───
function ActionSheet({ visible, onClose, onGoToConversation }) {
  if (!visible) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.3)" }} />
      <div style={{ background: T.colorWhite, borderRadius: "16px 16px 0 0", boxShadow: T.shadowMedium, padding: "32px 16px 24px", animation: "slideUp 0.25s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 36, height: 5, borderRadius: 35, background: T.colorBorderInteractive }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0 16px" }}>
          <PetAvatar size={48} images={[PET_IMAGES.archie]} />
          <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, color: T.colorPrimary, margin: 0 }}>Dog Walking: Archie</p>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: T.colorTertiary, margin: 0 }}>Yesterday · 12:00 PM to 12:30 PM</p>
          </div>
        </div>
        {[
          { label: "Review and complete" },
          { label: "Go to conversation with Owen", action: onGoToConversation },
          { label: "Reschedule walk" },
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0", borderTop: i === 0 ? `1px solid ${T.colorBgSecondary}` : "none",
            cursor: item.action ? "pointer" : "default",
          }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 600, fontSize: 16, color: T.colorPrimary, margin: 0 }}>{item.label}</p>
            {Icons.chevronRight}
          </div>
        ))}
        <div style={{ paddingTop: 16 }}><Button variant="default" fullWidth onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ───
function HomeScreen({ onOpenActionSheet, onNavigateConversation, loadTime }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.colorWhite }}>
      <div style={{ borderBottom: `1px solid ${T.colorBorder}`, padding: "24px 16px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "'Georgia', serif", fontWeight: 600, fontSize: 26, lineHeight: 1.25, color: T.colorPrimary, margin: 0 }}>Your name</h1>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: T.colorPrimary, margin: "2px 0 0" }}>{formatHeaderDate()}</p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
            <UserAvatar size={48} />
            {Icons.bell}
          </div>
        </div>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: T.colorTertiary, margin: "0 0 8px" }}>Updated at {loadTime}</p>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "24px 0 8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: T.colorPrimary, margin: 0 }}>Incomplete (1)</p>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, color: T.colorTertiary, margin: "4px 0 0" }}>Complete all services to get paid on time.</p>
          </div>
          <div style={{ flexShrink: 0 }}>{Icons.chevronUp}</div>
        </div>

        <div style={{ border: `1px solid ${T.colorBorder}`, borderRadius: T.radiusPrimary, padding: "0 16px 16px", background: T.colorWhite }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "16px 0" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: T.colorPrimary, margin: 0 }}>Dog Walking: Archie</p>
              <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.25, color: T.colorTertiary, margin: 0 }}>Yesterday · 12:00 PM to 12:30 PM</p>
            </div>
            <PetAvatar size={48} images={[PET_IMAGES.archie]} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="default" fullWidth>Review and complete</Button>
            <Button variant="default" icon={Icons.more} onClick={onOpenActionSheet} />
          </div>
        </div>

        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: T.colorPrimary, margin: "24px 0 8px" }}>Today</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <HomeCard time="9:00 – 10:00 AM" service="Dog walking" address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley" petImages={[PET_IMAGES.koni, PET_IMAGES.burley]} buttonLabel="Start Rover Card" onClick={onNavigateConversation} />
          <HomeCard time="5:00 PM – 5:30 PM" service="Dog walking" address="123 Fourth Ave, Seattle, WA" petNames="Koni, Burley" petImages={[PET_IMAGES.koni, PET_IMAGES.burley]} buttonLabel="Start Rover Card" disabled />
          <div style={{ background: T.colorWhite, borderRadius: 8, boxShadow: T.shadow, padding: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flexShrink: 0 }}>{Icons.edit}</div>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.colorPrimary, margin: 0, flex: 1 }}>Manage weekly care for this week</p>
          </div>
        </div>

        <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.25, color: T.colorPrimary, margin: "24px 0 8px" }}>Rover recommends</p>
        <div className="hide-scrollbar" style={{ display: "flex", gap: 12, paddingBottom: 24, overflowX: "auto" }}>
          {[
            { bg: T.colorYellow200, cardBg: T.colorYellow100, title: "Promote your profile", desc: "Invite new pet parents and grow your business.", cta: "Learn how", emoji: "🐕" },
            { bg: T.colorCyan200, cardBg: T.colorCyan100, title: "Share more, earn more", desc: "Earn a $100 reward for every two customers you invite who book.", cta: "Start Sharing", emoji: "💰" },
          ].map((c, i) => (
            <div key={i} style={{ width: 165, minWidth: 165, height: 269, borderRadius: 8, overflow: "hidden", boxShadow: T.shadow, background: c.bg, position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 155, background: c.cardBg, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.25, color: T.colorPrimary, margin: 0 }}>{c.title}</p>
                <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.25, color: T.colorTertiary, margin: 0 }}>{c.desc}</p>
                <Button variant="flat" style={{ padding: "8px 0", justifyContent: "flex-start" }}>{c.cta}</Button>
              </div>
              <div style={{ position: "absolute", top: 20, left: 20, fontSize: 48, opacity: 0.25 }}>{c.emoji}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar activeTab="home" />
    </div>
  );
}

// ─── CONVERSATION SCREEN ───
function ConversationScreen({ onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: T.colorWhite }}>
      <div style={{ borderBottom: `1px solid ${T.colorBorder}`, boxShadow: "0px 1px 4px 0px rgba(27,31,35,0.32)", padding: "12px 16px", flexShrink: 0, zIndex: 3 }}>
        <div style={{ display: "flex", alignItems: "center", minHeight: 62, padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0 }} onClick={onBack}>
            {Icons.back}
            <PetAvatar size={48} images={[PET_IMAGES.owner]} />
          </div>
          <div style={{ flex: 1, marginLeft: 8, minWidth: 0 }}>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.5, color: T.colorPrimary, margin: 0 }}>Owner O.</p>
            <p style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 14, lineHeight: 1.25, color: T.colorSuccess, margin: 0 }}>Ongoing</p>
          </div>
          <div style={{ cursor: "pointer", flexShrink: 0 }}>{Icons.more}</div>
        </div>
        <div className="hide-scrollbar" style={{ display: "flex", gap: 8, paddingTop: 12, overflowX: "auto" }}>
          <Button variant="primary" style={{ boxShadow: T.shadowMedium, flexShrink: 0 }}>Leave feedback</Button>
          <Button variant="default" style={{ flexShrink: 0 }}>Modify schedule</Button>
          <Button variant="default" style={{ flexShrink: 0 }}>Details</Button>
        </div>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column" }}>
        <BannerBlock text="Walk started at 8:18 PM, Mar 15" link="See Rover Card" />
        <div style={{ height: 12 }} />
        <ChatBubble message="He ok?" time="08:32 PM" />
        <ChatBubble message="Yeah he seems pretty mellow to me!" time="08:30 PM" isOwner showCheck />
        <ChatBubble message="Og good, thanks for letting me know!" time="08:32 PM" />
        <div style={{ height: 4 }} />
        <BannerBlock text="Walk ended at 8:54 PM, Mar 15" link="See Rover Card" />
        <div style={{ height: 12 }} />
        <ChatBubble message="Thank you!" time="08:56 PM" />
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: 14, color: T.colorTertiary }}>Today</span>
        </div>
        <BannerBlock text="Walk from {date at time} was marked as complete at 5:23 PM, Jan 18." />
      </div>

      <div style={{ borderTop: `1px solid ${T.colorBorder}`, padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
        <Button variant="default" icon={Icons.image} />
        <div style={{ flex: 1, border: `2px solid ${T.colorBorderInteractive}`, borderRadius: 4, height: 32, boxSizing: "border-box" }} />
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function RoverPrototype() {
  const [screen, setScreen] = useState("home");
  const [actionSheet, setActionSheet] = useState(false);
  const [transition, setTransition] = useState(false);
  const [direction, setDirection] = useState("forward");
  const [loadTime] = useState(() => formatLoadTime());

  const navigateTo = (target, dir = "forward") => {
    setDirection(dir);
    setTransition(true);
    setTimeout(() => { setScreen(target); setTransition(false); }, 200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap');
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .rover-shell { width: 375px; height: 812px; margin: 20px auto; border-radius: 32px; }
        @media (max-width: 420px) {
          .rover-shell { width: 100vw !important; height: 100dvh !important; border-radius: 0 !important; margin: 0 !important; box-shadow: none !important; }
          .rover-badge { display: none !important; }
        }
      `}</style>
      <div className="rover-shell" style={{
        overflow: "hidden", position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
        background: T.colorWhite, fontFamily: "'Nunito Sans', sans-serif",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          transition: "transform 0.25s ease, opacity 0.2s ease",
          transform: transition ? (direction === "forward" ? "translateX(-30%)" : "translateX(30%)") : "translateX(0)",
          opacity: transition ? 0 : 1,
        }}>
          {screen === "home" && <HomeScreen onOpenActionSheet={() => setActionSheet(true)} onNavigateConversation={() => navigateTo("conversation", "forward")} loadTime={loadTime} />}
          {screen === "conversation" && <ConversationScreen onBack={() => navigateTo("home", "back")} />}
        </div>
        <ActionSheet visible={actionSheet} onClose={() => setActionSheet(false)} onGoToConversation={() => { setActionSheet(false); setTimeout(() => navigateTo("conversation", "forward"), 200); }} />
        <div className="rover-badge" style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.06)", borderRadius: 99, padding: "2px 10px",
          fontSize: 10, fontWeight: 700, color: T.colorTertiary, letterSpacing: 0.5,
          textTransform: "uppercase", pointerEvents: "none",
        }}>Prototype</div>
      </div>
    </>
  );
}
