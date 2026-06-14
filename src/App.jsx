import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Trash2, LayoutDashboard, PlusCircle, List } from 'lucide-react'

const C = {
  bg: '#FBF8F3', income: '#1F6F5C', incomeBg: '#EAF4F0',
  expense: '#C75D3A', expenseBg: '#FAF0EB',
  border: '#E8E0D5', text: '#2D2A26', muted: '#8C8178',
  card: '#FFFFFF', warn: '#D97706', warnBg: '#FEF3C7',
}

const INCOME_CATS  = ['バイト代', '給与', 'ボーナス', '副業', 'その他']
const EXPENSE_CATS = ['食費', '交通費', '娯楽', 'ショッピング', '光熱費', '通信費', '医療費', '日用品', 'その他']

const SAMPLE = [
  { id:1,  type:'income',  amount:85000, date:'2026-06-05', category:'バイト代',     memo:'6月前半シフト' },
  { id:2,  type:'income',  amount:5000,  date:'2026-06-12', category:'その他',       memo:'フリマ売上' },
  { id:3,  type:'expense', amount:4200,  date:'2026-06-06', category:'食費',         memo:'スーパー' },
  { id:4,  type:'expense', amount:3100,  date:'2026-06-08', category:'交通費',       memo:'定期代' },
  { id:5,  type:'expense', amount:8500,  date:'2026-06-09', category:'ショッピング', memo:'Tシャツ' },
  { id:6,  type:'expense', amount:2800,  date:'2026-06-11', category:'食費',         memo:'外食' },
  { id:7,  type:'expense', amount:5000,  date:'2026-06-13', category:'娯楽',         memo:'カラオケ' },
  { id:8,  type:'expense', amount:1500,  date:'2026-06-14', category:'日用品',       memo:'シャンプー' },
  { id:9,  type:'income',  amount:42000, date:'2026-05-20', category:'バイト代',     memo:'5月後半' },
  { id:10, type:'expense', amount:6200,  date:'2026-05-22', category:'食費',         memo:'コンビニ+スーパー' },
  { id:11, type:'expense', amount:12000, date:'2026-05-25', category:'娯楽',         memo:'ゲーム購入' },
]

const fmt     = n => '¥' + Math.abs(n).toLocaleString('ja-JP')
const fmtDate = s => { const d = new Date(s); return `${d.getMonth()+1}/${d.getDate()}` }

function TxnRow({ t, onDelete }) {
  const color = t.type === 'income' ? C.income : C.expense
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.9rem', fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {t.category}{t.memo ? ` — ${t.memo}` : ''}
        </div>
        <div style={{ fontSize:'0.72rem', color:C.muted }}>{fmtDate(t.date)}</div>
      </div>
      <div style={{ fontFamily:'monospace', fontWeight:700, color, flexShrink:0, fontSize:'0.95rem' }}>
        {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
      </div>
      <button onClick={() => onDelete(t.id)}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#C8C0B6', padding:4, flexShrink:0, lineHeight:0 }}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function App() {
  const today = new Date()
  const [txns, setTxns]     = useState(SAMPLE)
  const [budget, setBudget] = useState(80000)
  const [cur, setCur]       = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [tab, setTab]       = useState('dash')
  const [editBudget, setEditBudget]   = useState(false)
  const [budgetDraft, setBudgetDraft] = useState('')
  const [form, setForm] = useState({
    type:'expense', amount:'', date:today.toISOString().split('T')[0], category:'食費', memo:'',
  })

  const monthTxns = useMemo(() =>
    txns
      .filter(t => { const d = new Date(t.date); return d.getFullYear()===cur.getFullYear() && d.getMonth()===cur.getMonth() })
      .sort((a,b) => new Date(b.date) - new Date(a.date)),
    [txns, cur]
  )

  const income  = useMemo(() => monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),  [monthTxns])
  const expense = useMemo(() => monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0), [monthTxns])
  const balance   = income - expense
  const remaining = budget - expense
  const tankPct   = budget > 0 ? Math.max(0, Math.min(100, (remaining/budget)*100)) : 0
  const tankColor = tankPct > 50 ? C.income : tankPct > 25 ? C.warn : C.expense
  const tankBg    = tankPct > 50 ? C.incomeBg : tankPct > 25 ? C.warnBg : C.expenseBg

  const catExp = useMemo(() => {
    const map = {}
    monthTxns.filter(t=>t.type==='expense').forEach(t => { map[t.category]=(map[t.category]||0)+t.amount })
    return Object.entries(map).sort((a,b)=>b[1]-a[1])
  }, [monthTxns])
  const maxCat = catExp.length > 0 ? catExp[0][1] : 1

  const setField = (k, v) => setForm(f => {
    const next = { ...f, [k]:v }
    if (k==='type') next.category = v==='income' ? INCOME_CATS[0] : EXPENSE_CATS[0]
    return next
  })

  const addTxn = () => {
    const amt = parseInt(form.amount)
    if (!amt || !form.date || !form.category) return
    setTxns(p => [...p, { id:Date.now(), type:form.type, amount:amt, date:form.date, category:form.category, memo:form.memo }])
    setForm(f => ({ ...f, amount:'', memo:'' }))
    setTab('dash')
  }

  const card   = { background:C.card, borderRadius:12, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }
  const secttl = { fontFamily:'Georgia, serif', fontSize:'0.78rem', color:C.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.07em' }
  const inp    = { width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, background:C.bg, color:C.text, outline:'none' }
  const navBtn = { background:'none', border:`1px solid ${C.border}`, borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.muted }

  return (
    <div style={{ background:C.bg, minHeight:'100vh', maxWidth:430, margin:'0 auto', paddingBottom:80 }}>

      {/* HEADER */}
      <div style={{ background:C.bg, padding:'16px 16px 0', paddingTop:'calc(16px + env(safe-area-inset-top))', position:'sticky', top:0, zIndex:10, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <button style={navBtn} onClick={() => setCur(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}><ChevronLeft size={16}/></button>
          <span style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:700, color:C.text }}>{cur.getFullYear()}年{cur.getMonth()+1}月</span>
          <button style={navBtn} onClick={() => setCur(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}><ChevronRight size={16}/></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:6, paddingBottom:10, alignItems:'center' }}>
          <div style={{ background:C.incomeBg, borderRadius:10, padding:'10px 8px', borderTop:`3px solid ${C.income}` }}>
            <div style={{ fontSize:'0.68rem', color:C.muted, marginBottom:3 }}>収入</div>
            <div style={{ fontFamily:'monospace', fontWeight:700, color:C.income }}>{fmt(income)}</div>
          </div>
          <div style={{ color:C.border, fontSize:'1.2rem', textAlign:'center' }}>→</div>
          <div style={{ background:balance>=0?'#F0F4F2':C.expenseBg, borderRadius:10, padding:'10px 8px', borderTop:`3px solid ${balance>=0?C.income:C.expense}` }}>
            <div style={{ fontSize:'0.68rem', color:C.muted, marginBottom:3 }}>残額</div>
            <div style={{ fontFamily:'monospace', fontWeight:700, color:balance>=0?C.income:C.expense }}>{balance<0?'−':''}{fmt(balance)}</div>
          </div>
        </div>
        <div style={{ background:C.expenseBg, borderRadius:8, padding:'7px 10px', marginBottom:12, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:'0.75rem', color:C.muted }}>支出合計</span>
          <span style={{ fontFamily:'monospace', fontWeight:700, color:C.expense }}>{fmt(expense)}</span>
        </div>
      </div>

      {/* DASHBOARD */}
      {tab==='dash' && (
        <div style={{ padding:'16px 16px 0' }}>
          {/* 予算タンク */}
          <div style={{ marginBottom:20 }}>
            <div style={secttl}>予算タンク</div>
            <div style={card}>
              <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                <div style={{ flexShrink:0 }}>
                  <div style={{ width:44, height:180, background:'#EDE8E2', borderRadius:22, overflow:'hidden', position:'relative', border:`2px solid ${C.border}` }}>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${tankPct}%`, background:tankColor, borderRadius:'0 0 20px 20px', transition:'height 0.6s ease, background 0.6s ease' }} />
                  </div>
                  <div style={{ textAlign:'center', marginTop:6, fontSize:'0.7rem', color:C.muted }}>{Math.round(tankPct)}%</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'monospace', fontSize:'1.6rem', fontWeight:700, color:tankColor, lineHeight:1 }}>{fmt(Math.max(0,remaining))}</div>
                  <div style={{ fontSize:'0.75rem', color:C.muted, marginTop:4 }}>残り予算</div>
                  <div style={{ display:'inline-block', marginTop:8, padding:'3px 10px', borderRadius:20, background:tankBg, color:tankColor, fontSize:'0.75rem', fontWeight:600 }}>
                    予算 {fmt(budget)} のうち {Math.round(tankPct)}% 残
                  </div>
                  {editBudget ? (
                    <div style={{ marginTop:10, display:'flex', gap:6 }}>
                      <input type="number" inputMode="numeric" value={budgetDraft}
                        onChange={e => setBudgetDraft(e.target.value)}
                        style={{ ...inp, width:120, padding:'6px 10px', fontSize:14 }} placeholder="金額" />
                      <button onClick={() => { const v=parseInt(budgetDraft); if(v>0) setBudget(v); setEditBudget(false) }}
                        style={{ padding:'6px 14px', background:C.income, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>OK</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditBudget(true); setBudgetDraft(budget.toString()) }}
                      style={{ display:'block', marginTop:10, background:'none', border:'none', cursor:'pointer', fontSize:'0.75rem', color:C.muted, textDecoration:'underline' }}>
                      予算を変更
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* カテゴリ別支出 */}
          {catExp.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={secttl}>カテゴリ別支出</div>
              <div style={card}>
                {catExp.map(([cat, amt]) => (
                  <div key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ width:60, fontSize:'0.75rem', color:C.text, flexShrink:0, textAlign:'right' }}>{cat}</div>
                    <div style={{ flex:1, background:'#F0EBE4', borderRadius:4, height:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.round((amt/maxCat)*100)}%`, background:C.expense, borderRadius:4, transition:'width 0.4s' }} />
                    </div>
                    <div style={{ width:76, fontSize:'0.75rem', fontFamily:'monospace', color:C.muted, textAlign:'right', flexShrink:0 }}>{fmt(amt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 直近の記録 */}
          <div style={{ marginBottom:20 }}>
            <div style={secttl}>直近の記録</div>
            {monthTxns.length===0
              ? <div style={{ textAlign:'center', padding:'32px 0', color:C.muted }}>記録がありません</div>
              : <div style={card}>
                  {monthTxns.slice(0,5).map(t => <TxnRow key={t.id} t={t} onDelete={id => setTxns(p=>p.filter(t=>t.id!==id))} />)}
                  {monthTxns.length > 5 && (
                    <button onClick={() => setTab('list')}
                      style={{ display:'block', width:'100%', textAlign:'center', marginTop:10, background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', color:C.muted, textDecoration:'underline' }}>
                      すべて見る（{monthTxns.length}件）
                    </button>
                  )}
                </div>
            }
          </div>
        </div>
      )}

      {/* ADD FORM */}
      {tab==='add' && (
        <div style={{ padding:'16px' }}>
          <div style={card}>
            <div style={{ display:'flex', background:'#F0EBE4', borderRadius:10, padding:3, gap:3, marginBottom:16 }}>
              {['expense','income'].map(type => (
                <button key={type} onClick={() => setField('type', type)}
                  style={{ flex:1, padding:'10px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600,
                    background:form.type===type?(type==='income'?C.income:C.expense):'transparent',
                    color:form.type===type?'#fff':C.muted, transition:'all 0.2s' }}>
                  {type==='income'?'収入':'支出'}
                </button>
              ))}
            </div>
            {[
              { label:'金額', key:'amount', type:'number', inputMode:'numeric', placeholder:'0' },
              { label:'日付', key:'date',   type:'date' },
            ].map(({ label, key, type, inputMode, placeholder }) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:'0.8rem', color:C.muted, marginBottom:6, fontWeight:600 }}>{label}</label>
                <input type={type} inputMode={inputMode} placeholder={placeholder} value={form[key]}
                  onChange={e => setField(key, e.target.value)} style={inp} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'0.8rem', color:C.muted, marginBottom:6, fontWeight:600 }}>カテゴリ</label>
              <select value={form.category} onChange={e => setField('category', e.target.value)} style={inp}>
                {(form.type==='income'?INCOME_CATS:EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:'0.8rem', color:C.muted, marginBottom:6, fontWeight:600 }}>メモ（任意）</label>
              <input type="text" placeholder="メモを入力..." value={form.memo}
                onChange={e => setField('memo', e.target.value)} style={inp} />
            </div>
            <button onClick={addTxn}
              style={{ width:'100%', padding:'14px', background:form.type==='income'?C.income:C.expense,
                color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
              記録する
            </button>
          </div>
        </div>
      )}

      {/* LIST */}
      {tab==='list' && (
        <div style={{ padding:'16px' }}>
          {monthTxns.length===0
            ? <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>記録がありません</div>
            : <div style={card}>{monthTxns.map(t => <TxnRow key={t.id} t={t} onDelete={id => setTxns(p=>p.filter(t=>t.id!==id))} />)}</div>
          }
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'#fff', borderTop:`1px solid ${C.border}`, display:'flex', zIndex:20, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {[
          { id:'dash', label:'ホーム', Icon:LayoutDashboard },
          { id:'add',  label:'記録',   Icon:PlusCircle },
          { id:'list', label:'一覧',   Icon:List },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 0', background:'none', border:'none', cursor:'pointer', color:tab===id?C.income:C.muted, gap:3 }}>
            <Icon size={20} />
            <span style={{ fontSize:'0.65rem', fontWeight:600 }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
