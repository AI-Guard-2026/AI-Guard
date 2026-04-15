'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'

function useScrollReveal() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return { ref, inView }
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { isSignedIn } = useAuth()
  const [typeIndex, setTypeIndex] = useState(0)
  const [particles, setParticles] = useState<Array<{id:number;x:number;y:number;duration:number;delay:number;size:number}>>([])
  const [stars, setStars] = useState<Array<{id:number;x:number;y:number;duration:number;delay:number;size:number;green:boolean}>>([])
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60])

  const words = ['hours', '90 minutes', 'one afternoon']

  useEffect(() => {
    setMounted(true)
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 6,
      size: Math.random() > 0.7 ? 3 : 2,
    })))
    setStars(Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      size: Math.random() > 0.8 ? 2 : 1,
      green: Math.random() > 0.75,
    })))
    const interval = setInterval(() => setTypeIndex(i => (i + 1) % words.length), 3000)
    return () => clearInterval(interval)
  }, [])

  const s1 = useScrollReveal()
  const s2 = useScrollReveal()
  const s3 = useScrollReveal()
  const s4 = useScrollReveal()
  const s5 = useScrollReveal()
  const s6 = useScrollReveal()

  const features = [
    { title: 'AI System Inventory', desc: 'Catalogue all AI systems via CSV or manual entry. Risk-scored automatically.', color: '#30d158', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1" y="4" width="20" height="14" rx="3" stroke="#30d158" strokeWidth="1.5"/><path d="M5 9h12M5 12.5h8" stroke="#30d158" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { title: 'Risk Classifier', desc: '5 questions → exact Annex III article reference with full legal reasoning.', color: '#0071e3', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L18 6V12C18 16 15 19 11 20C7 19 4 16 4 12V6L11 2Z" stroke="#0071e3" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
    { title: 'Annex IV Generator', desc: '90-minute interview → complete technical documentation. What consultants charge €5,000 for.', color: '#ff9500', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 2h11l5 5v13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#ff9500" strokeWidth="1.5"/><path d="M15 2v6h6M6 10h10M6 13h8" stroke="#ff9500" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { title: 'Hash-chained Audit Log', desc: 'Every action SHA256 hash-chained and court-admissible. Regulator audit? One click.', color: '#ff3b30', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L18 6V12C18 16 15 19 11 20C7 19 4 16 4 12V6L11 2Z" stroke="#ff3b30" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 11l2 2 4-4" stroke="#ff3b30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { title: 'PDF Export', desc: 'Download regulator-ready PDFs instantly. Branded, structured, legally formatted.', color: '#aeaeb2', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="#aeaeb2" strokeWidth="1.5"/><rect x="12" y="3" width="7" height="7" rx="2" stroke="#aeaeb2" strokeWidth="1.5"/><rect x="3" y="12" width="7" height="7" rx="2" stroke="#aeaeb2" strokeWidth="1.5"/><rect x="12" y="12" width="7" height="7" rx="2" stroke="#aeaeb2" strokeWidth="1.5"/></svg> },
    { title: 'Continuous Monitoring', desc: 'Auto-notifications when regulations change. Re-classification alerts for affected systems.', color: '#30d158', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#30d158" strokeWidth="1.5"/><path d="M11 7v4l3 3" stroke="#30d158" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]

  const steps = [
    { n: '1', title: 'Add your AI systems', desc: 'Import via CSV or add manually. Takes 10 minutes for most companies. Risk-scored immediately.' },
    { n: '2', title: 'Classify risk tier', desc: 'Answer 5 plain-English questions. AIGuard returns the exact Annex III article with full legal reasoning.' },
    { n: '3', title: 'Generate Annex IV documentation', desc: '90-minute guided interview. AIGuard drafts your complete technical documentation package.' },
    { n: '4', title: 'Legal review and export', desc: 'Send the draft to your lawyers for sign-off. Download regulator-ready PDFs. Done.' },
  ]

  const plans = [
    { name: 'Starter', price: '€399', features: ['5 AI systems', 'Risk classification', 'Annex IV generation', 'PDF export', '1 user'], hot: false },
    { name: 'Professional', price: '€999', features: ['20 AI systems', 'Everything in Starter', 'Audit log export', '5 users', 'Priority support'], hot: true },
    { name: 'Scale', price: '€2,499', features: ['Unlimited systems', 'Everything in Pro', 'API access', '20 users', 'Dedicated support'], hot: false },
  ]

  return (
    <div style={{ background: 'linear-gradient(180deg,#020b04 0%,#000510 30%,#000 60%)', minHeight: '100vh', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif", overflowX: 'hidden' }}>

      {/* NAV */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 100 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(48,209,88,0.3)', '0 0 40px rgba(48,209,88,0.7)', '0 0 20px rgba(48,209,88,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#30d158,#25a244)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="9" cy="9" r="2.5" fill="#fff"/></svg>
          </motion.div>
          <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.3px' }}>AIGuard</span>
        </div>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Product', 'Pricing', 'Docs', 'Blog'].map(link => (
            <motion.span key={link} whileHover={{ color: '#fff' }} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'color 0.2s' }}>{link}</motion.span>
          ))}
        </div>
        <motion.a
          href={isSignedIn ? '/dashboard' : '/sign-in'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ background: '#fff', color: '#000', padding: '8px 20px', borderRadius: '980px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
        >
          Get started →
        </motion.a>
      </motion.nav>

      {/* HERO */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY, padding: '110px 48px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Stars */}
        {mounted && stars.map(star => (
          <motion.div
            key={`star-${star.id}`}
            animate={{ opacity: [0.1, star.green ? 0.9 : 0.7, 0.1] }}
            transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }}
            style={{ position: 'absolute', left: `${star.x}%`, top: `${star.y}%`, width: `${star.size}px`, height: `${star.size}px`, background: star.green ? '#30d158' : '#fff', borderRadius: '50%', pointerEvents: 'none' }}
          />
        ))}

        {/* Scanline */}
        <motion.div
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(48,209,88,0.3),transparent)', pointerEvents: 'none' }}
        />

        {/* Glow */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse,rgba(48,209,88,0.15) 0%,rgba(0,113,227,0.05) 40%,transparent 70%)', pointerEvents: 'none' }}
        />

        {/* Particles */}
        {mounted && particles.map(p => (
          <motion.div
            key={p.id}
            animate={{ y: [-20, -120], x: [0, (Math.random() - 0.5) * 40], opacity: [0, 0.8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, background: '#30d158', borderRadius: '50%', pointerEvents: 'none' }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(48,209,88,0.1)', border: '0.5px solid rgba(48,209,88,0.4)', padding: '7px 16px', borderRadius: '980px', marginBottom: '28px', position: 'relative', zIndex: 1 }}
        >
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#30d158' }} />
          <span style={{ fontSize: '12px', color: '#30d158', fontWeight: 500 }}>EU AI Act enforcement starts August 2026 — <strong>109 days left</strong></span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: '68px', fontWeight: 700, letterSpacing: '-2.5px', lineHeight: 1.02, marginBottom: '22px', position: 'relative', zIndex: 1 }}
        >
          EU AI Act compliance<br />in{' '}
          <AnimatePresence mode="wait">
            <motion.span
              key={typeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ color: '#30d158', display: 'inline-block', position: 'relative' }}
            >
              {words[typeIndex]}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', bottom: '-4px', left: 0, height: '2px', background: 'linear-gradient(90deg,#30d158,#25a244)', borderRadius: '1px' }}
              />
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '540px', lineHeight: 1.65, marginBottom: '38px', position: 'relative', zIndex: 1 }}
        >
          AIGuard automates classification, Annex IV documentation and tamper-proof audit trails. Built for the 65,000+ companies who can't afford €500K in legal fees.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '56px', position: 'relative', zIndex: 1 }}
        >
          <motion.a
            href={isSignedIn ? '/dashboard' : '/sign-up'}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            style={{ background: '#fff', color: '#000', padding: '14px 28px', borderRadius: '980px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
          >
            Start free trial →
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.97 }}
            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', padding: '14px 28px', borderRadius: '980px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', border: '0.5px solid rgba(255,255,255,0.12)' }}
          >
            Watch 2-min demo
          </motion.button>
        </motion.div>

        {/* Mini stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}
        >
          {[
            { label: 'Systems classified', value: '247', color: '#30d158', bar: 78 },
            { label: 'Docs generated', value: '183', color: '#0071e3', bar: 60 },
            { label: 'Hours saved', value: '14,600h', color: '#ff9500', bar: 95 },
            { label: 'Avg cost', value: '€999', color: '#fff', bar: 2 },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              whileHover={{ y: -6, borderColor: 'rgba(48,209,88,0.4)' }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px', minWidth: '160px', textAlign: 'left', cursor: 'default', transition: 'border-color 0.2s' }}
            >
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', color: card.color }}>{card.value}</div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${card.bar}%` }} transition={{ duration: 1.5, delay: 0.8 + i * 0.1 }} style={{ height: '100%', background: card.color, borderRadius: '2px' }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* STATS BAR */}
      <motion.div
        ref={s1.ref}
        variants={stagger}
        initial="hidden"
        animate={s1.inView ? 'visible' : 'hidden'}
        style={{ display: 'flex', borderTop: '0.5px solid rgba(255,255,255,0.06)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {[
          { value: '65,000+', label: 'AI systems needing compliance', color: '#30d158' },
          { value: '€35M', label: 'Maximum fine for non-compliance', color: '#ff3b30' },
          { value: '90 min', label: 'To generate Annex IV docs', color: '#fff' },
          { value: '99%', label: 'Gross margin on AI layer', color: '#0071e3' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ background: 'rgba(255,255,255,0.02)' }}
            style={{ flex: 1, padding: '28px', textAlign: 'center', borderRight: '0.5px solid rgba(255,255,255,0.06)', cursor: 'default', transition: 'background 0.2s' }}
          >
            <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* FEATURES */}
      <motion.div
        ref={s2.ref}
        initial="hidden"
        animate={s2.inView ? 'visible' : 'hidden'}
        variants={stagger}
        style={{ padding: '80px 48px' }}
      >
        <motion.div variants={fadeUp} style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#30d158', marginBottom: '12px' }}>Features</div>
          <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '14px' }}>Everything compliance<br />requires. Automated.</div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '460px', lineHeight: 1.65 }}>Stop paying lawyers €300/hr to fill out templates. AIGuard does the heavy lifting in hours.</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              variants={fadeUp}
              whileHover={{ background: '#050505' }}
              style={{ background: '#000', padding: '32px', cursor: 'default', position: 'relative', overflow: 'hidden' }}
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', background: `${feat.color}18` }}
              >
                {feat.icon}
              </motion.div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{feat.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{feat.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* HOW IT WORKS */}
      <motion.div
        ref={s3.ref}
        initial="hidden"
        animate={s3.inView ? 'visible' : 'hidden'}
        variants={stagger}
        style={{ padding: '80px 48px', textAlign: 'center' }}
      >
        <motion.div variants={fadeUp}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#30d158', marginBottom: '12px' }}>How it works</div>
          <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '48px' }}>Zero to compliant<br />in one afternoon</div>
        </motion.div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              whileHover={{ x: 8 }}
              style={{ display: 'flex', gap: '20px', paddingBottom: '36px', position: 'relative', cursor: 'default', textAlign: 'left' }}
            >
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={s3.inView ? { height: '100%' } : { height: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
                  style={{ position: 'absolute', left: '15px', top: '32px', width: '0.5px', background: 'linear-gradient(to bottom,rgba(48,209,88,0.5),rgba(48,209,88,0.05))', bottom: 0 }}
                />
              )}
              <motion.div
                whileHover={{ background: 'rgba(48,209,88,0.15)', borderColor: '#30d158', boxShadow: '0 0 16px rgba(48,209,88,0.3)' }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '0.5px solid rgba(48,209,88,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#30d158', flexShrink: 0, background: '#000', transition: 'all 0.2s' }}
              >
                {step.n}
              </motion.div>
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '5px' }}>{step.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* PRICING */}
      <motion.div
        ref={s4.ref}
        initial="hidden"
        animate={s4.inView ? 'visible' : 'hidden'}
        variants={stagger}
        style={{ padding: '80px 48px', textAlign: 'center' }}
      >
        <motion.div variants={fadeUp}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#30d158', marginBottom: '12px' }}>Pricing</div>
          <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-1px', marginBottom: '48px' }}>10x cheaper than<br />every competitor</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', maxWidth: '860px', margin: '0 auto', textAlign: 'left' }}>
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              whileHover={{ y: -8, borderColor: plan.hot ? 'rgba(48,209,88,0.8)' : 'rgba(255,255,255,0.25)' }}
              animate={plan.hot ? { borderColor: ['rgba(48,209,88,0.3)', 'rgba(48,209,88,0.7)', 'rgba(48,209,88,0.3)'] } : {}}
              transition={plan.hot ? { duration: 3, repeat: Infinity } : {}}
              style={{ background: plan.hot ? 'rgba(48,209,88,0.04)' : '#080808', border: `0.5px solid ${plan.hot ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '20px', padding: '28px', cursor: 'default' }}
            >
              {plan.hot && <div style={{ display: 'inline-block', background: 'rgba(48,209,88,0.15)', color: '#30d158', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '980px', marginBottom: '14px' }}>Most popular</div>}
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>{plan.name}</div>
              <div style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: '4px' }}>{plan.price}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '22px' }}>per month</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '24px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(48,209,88,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: '#30d158' }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <motion.a
                href={isSignedIn ? '/dashboard' : '/sign-up'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ display: 'block', width: '100%', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', textAlign: 'center', textDecoration: 'none', background: plan.hot ? '#30d158' : 'rgba(255,255,255,0.06)', color: plan.hot ? '#000' : '#fff' }}
              >
                Get started
              </motion.a>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        ref={s5.ref}
        initial="hidden"
        animate={s5.inView ? 'visible' : 'hidden'}
        variants={fadeUp}
        style={{ margin: '0 48px 80px' }}
      >
        <motion.div
          animate={{ borderColor: ['rgba(48,209,88,0.2)', 'rgba(48,209,88,0.6)', 'rgba(48,209,88,0.2)'] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ background: '#050505', border: '0.5px solid rgba(48,209,88,0.3)', borderRadius: '24px', padding: '72px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,rgba(48,209,88,0.08) 0%,transparent 65%)', pointerEvents: 'none' }}
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,59,48,0.1)', border: '0.5px solid rgba(255,59,48,0.3)', padding: '6px 14px', borderRadius: '980px', marginBottom: '24px' }}>
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b30' }} />
            <span style={{ fontSize: '12px', color: '#ff3b30', fontWeight: 500 }}>109 days until enforcement — compliance takes 6–8 weeks minimum</span>
          </div>
          <div style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: '14px', position: 'relative' }}>Don't wait until August</div>
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: 1.6, position: 'relative' }}>
            Companies starting now will be compliant in weeks.<br />Companies that wait will face €35M fines or pay €500K+ in consultants.
          </div>
          <motion.a
            href={isSignedIn ? '/dashboard' : '/sign-up'}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            style={{ background: '#fff', color: '#000', padding: '14px 36px', borderRadius: '980px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block', position: 'relative' }}
          >
            Start your free trial →
          </motion.a>
        </motion.div>
      </motion.div>

      {/* FOOTER */}
      <motion.footer
        ref={s6.ref}
        initial={{ opacity: 0 }}
        animate={s6.inView ? { opacity: 1 } : { opacity: 0 }}
        style={{ padding: '28px 48px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg,#30d158,#25a244)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="9" cy="9" r="2.5" fill="#fff"/></svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>AIGuard</span>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>© 2026 AIGuard. EU AI Act Compliance Platform. Dublin, Ireland.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <motion.span key={l} whileHover={{ color: '#fff' }} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.2s' }}>{l}</motion.span>
          ))}
        </div>
      </motion.footer>
    </div>
  )
}