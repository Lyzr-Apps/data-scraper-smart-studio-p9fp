'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HiOutlineSearch, HiOutlineDownload, HiOutlineExternalLink, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlineOfficeBuilding, HiOutlineUsers, HiOutlineChip, HiOutlineTrendingUp, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineChevronRight, HiOutlineDatabase, HiOutlineExclamationCircle } from 'react-icons/hi'
import { CgSpinner } from 'react-icons/cg'

const AGENT_ID = '69a0047b5c89478b3d0771e1'

// ---- Types ----

interface LeadershipEntry {
  name: string
  title: string
}

interface CompanyOverview {
  company_name: string
  description: string
  industry: string
  revenue_estimate: string
  employee_count: string
  founding_year: string
  headquarters: string
  website_url: string
  company_type: string
  leadership: LeadershipEntry[]
}

interface Contact {
  name: string
  title: string
  email: string
  phone: string
  linkedin_url: string
  twitter_handle: string
  other_profiles: string
}

interface TechItem {
  technology_name: string
  category: string
  confidence: string
}

interface NewsItem {
  headline: string
  source: string
  date: string
  summary: string
}

interface FundingRound {
  round_type: string
  amount: string
  date: string
  investors: string
}

interface Competitor {
  name: string
  notes: string
}

interface IntelligenceReport {
  company_overview: CompanyOverview
  contacts: Contact[]
  tech_stack: TechItem[]
  tech_summary: string
  recent_news: NewsItem[]
  funding_rounds: FundingRound[]
  competitors: Competitor[]
  market_positioning: string
}

interface HistoryEntry {
  companyName: string
  timestamp: string
  data: IntelligenceReport
}

// ---- Sample Data ----

const SAMPLE_DATA: IntelligenceReport = {
  company_overview: {
    company_name: 'Acme Corp',
    description: 'Acme Corp is a leading enterprise SaaS company specializing in AI-driven analytics and workflow automation for mid-market and enterprise clients across North America and Europe.',
    industry: 'Enterprise Software / SaaS',
    revenue_estimate: '$120M - $150M ARR',
    employee_count: '850 - 1,000',
    founding_year: '2015',
    headquarters: 'San Francisco, CA',
    website_url: 'https://acmecorp.com',
    company_type: 'Private (Series D)',
    leadership: [
      { name: 'Jane Smith', title: 'CEO & Co-Founder' },
      { name: 'Michael Chen', title: 'CTO & Co-Founder' },
      { name: 'Sarah Williams', title: 'VP of Sales' },
      { name: 'David Park', title: 'CFO' }
    ]
  },
  contacts: [
    { name: 'Jane Smith', title: 'CEO & Co-Founder', email: 'jane@acmecorp.com', phone: '+1 (415) 555-0101', linkedin_url: 'https://linkedin.com/in/janesmith', twitter_handle: '@janesmith', other_profiles: 'GitHub: jsmith-acme' },
    { name: 'Michael Chen', title: 'CTO & Co-Founder', email: 'michael@acmecorp.com', phone: '+1 (415) 555-0102', linkedin_url: 'https://linkedin.com/in/michaelchen', twitter_handle: '@mchen_tech', other_profiles: '' },
    { name: 'Sarah Williams', title: 'VP of Sales', email: 'sarah.w@acmecorp.com', phone: '+1 (415) 555-0103', linkedin_url: 'https://linkedin.com/in/sarahwilliams', twitter_handle: '', other_profiles: '' },
    { name: 'Alex Rivera', title: 'Head of Engineering', email: 'alex.r@acmecorp.com', phone: '', linkedin_url: 'https://linkedin.com/in/alexrivera', twitter_handle: '@alexr_dev', other_profiles: 'GitHub: alexr-acme' }
  ],
  tech_stack: [
    { technology_name: 'React', category: 'Frontend', confidence: 'confirmed' },
    { technology_name: 'Next.js', category: 'Frontend', confidence: 'confirmed' },
    { technology_name: 'TypeScript', category: 'Language', confidence: 'confirmed' },
    { technology_name: 'Python', category: 'Language', confidence: 'confirmed' },
    { technology_name: 'PostgreSQL', category: 'Database', confidence: 'confirmed' },
    { technology_name: 'Redis', category: 'Database', confidence: 'likely' },
    { technology_name: 'AWS', category: 'Cloud', confidence: 'confirmed' },
    { technology_name: 'Kubernetes', category: 'Infrastructure', confidence: 'likely' },
    { technology_name: 'Snowflake', category: 'Data Warehouse', confidence: 'likely' },
    { technology_name: 'Stripe', category: 'Payments', confidence: 'confirmed' },
    { technology_name: 'Segment', category: 'Analytics', confidence: 'possible' },
    { technology_name: 'Datadog', category: 'Monitoring', confidence: 'possible' }
  ],
  tech_summary: 'Acme Corp runs a modern cloud-native stack primarily on AWS with Kubernetes orchestration. Their frontend is built with React/Next.js and TypeScript, while backend services leverage Python. They use PostgreSQL as their primary database with Redis for caching, and Snowflake for data warehousing and analytics workloads.',
  recent_news: [
    { headline: 'Acme Corp Raises $75M Series D to Expand AI Analytics Platform', source: 'TechCrunch', date: '2024-11-15', summary: 'Acme Corp announced a $75M Series D funding round led by Sequoia Capital, bringing total funding to $180M. The company plans to use the funds to expand its AI-driven analytics capabilities and enter European markets.' },
    { headline: 'Acme Corp Named to Forbes Cloud 100 List', source: 'Forbes', date: '2024-09-20', summary: 'Acme Corp was recognized on the 2024 Forbes Cloud 100 list, ranking #47 among the top private cloud companies worldwide.' },
    { headline: 'Acme Corp Partners with Snowflake for Enhanced Data Integration', source: 'Business Wire', date: '2024-08-05', summary: 'Strategic partnership enables seamless data flow between Acme Corp analytics platform and Snowflake data cloud, providing customers with unified insights.' }
  ],
  funding_rounds: [
    { round_type: 'Series D', amount: '$75M', date: '2024-11', investors: 'Sequoia Capital, Andreessen Horowitz' },
    { round_type: 'Series C', amount: '$50M', date: '2022-06', investors: 'Andreessen Horowitz, Lightspeed Venture Partners' },
    { round_type: 'Series B', amount: '$30M', date: '2020-03', investors: 'Lightspeed Venture Partners, Accel' },
    { round_type: 'Series A', amount: '$15M', date: '2018-01', investors: 'Accel, Y Combinator' },
    { round_type: 'Seed', amount: '$3M', date: '2016-06', investors: 'Y Combinator, Angel investors' }
  ],
  competitors: [
    { name: 'DataRobot', notes: 'Direct competitor in AI/ML analytics. More mature but higher price point.' },
    { name: 'Tableau (Salesforce)', notes: 'Established BI player, broader market presence but less AI-native.' },
    { name: 'Looker (Google)', notes: 'Cloud-native analytics, strong Google Cloud integration.' },
    { name: 'Sisense', notes: 'Embedded analytics focus, competing in mid-market segment.' }
  ],
  market_positioning: 'Acme Corp positions itself as the "AI-first" analytics platform for mid-market and enterprise companies. Their key differentiator is the proprietary ML engine that automates insight discovery, reducing time-to-insight by 80% compared to traditional BI tools. They compete primarily on ease-of-use and speed of deployment, targeting companies with 500-5,000 employees that need sophisticated analytics without dedicated data science teams.'
}

// ---- Helpers ----

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

// ---- Clipboard Button ----

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback
    }
  }, [text])

  return (
    <button onClick={handleCopy} className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors" title="Copy">
      {copied ? <HiOutlineCheck className="h-3 w-3 text-accent" /> : <HiOutlineClipboardCopy className="h-3 w-3 text-muted-foreground" />}
    </button>
  )
}

// ---- Collapsible Section ----

function CollapsibleSection({ title, icon, children, defaultOpen = true, count }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2.5 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {count !== undefined && count > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>
                )}
              </div>
              {open ? <HiOutlineChevronUp className="h-4 w-4 text-muted-foreground" /> : <HiOutlineChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// ---- Loading Skeleton ----

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      <div className="text-center py-6">
        <CgSpinner className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Researching across 4 intelligence sources...</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex gap-1">
            {['Firmographics', 'Contacts', 'Tech Stack', 'Market Intel'].map((label, i) => (
              <Badge key={label} variant="outline" className="text-xs animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(n => (
          <Card key={n} className="border border-border">
            <CardHeader className="py-2.5 px-4">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Company Overview Section ----

function CompanyOverviewSection({ overview }: { overview: CompanyOverview | undefined }) {
  if (!overview) return <p className="text-sm text-muted-foreground">No company overview data available.</p>
  const leadership = Array.isArray(overview.leadership) ? overview.leadership : []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBlock label="Revenue" value={overview.revenue_estimate} />
        <StatBlock label="Employees" value={overview.employee_count} />
        <StatBlock label="Founded" value={overview.founding_year} />
        <StatBlock label="HQ" value={overview.headquarters} />
      </div>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        <KVPair label="Industry" value={overview.industry} />
        <KVPair label="Company Type" value={overview.company_type} />
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="text-xs text-muted-foreground min-w-[72px]">Website</span>
          {overview.website_url ? (
            <a href={overview.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 truncate">
              {overview.website_url} <HiOutlineExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">N/A</span>
          )}
        </div>
      </div>
      {overview.description && (
        <>
          <Separator />
          <p className="text-xs text-foreground leading-relaxed">{overview.description}</p>
        </>
      )}
      {leadership.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Leadership</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {leadership.map((person, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium">{person?.name ?? 'N/A'}</span>
                  <span className="text-muted-foreground">{person?.title ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="bg-muted/40 rounded px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className="text-sm font-semibold truncate">{value || 'N/A'}</p>
    </div>
  )
}

function KVPair({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="text-xs text-muted-foreground min-w-[72px]">{label}</span>
      <span className="text-xs font-medium">{value || 'N/A'}</span>
    </div>
  )
}

// ---- Contacts Section ----

function ContactsSection({ contacts }: { contacts: Contact[] }) {
  const [sortKey, setSortKey] = useState<'name' | 'title'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: 'name' | 'title') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...contacts].sort((a, b) => {
    const aVal = (sortKey === 'name' ? a?.name : a?.title) ?? ''
    const bVal = (sortKey === 'name' ? b?.name : b?.title) ?? ''
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })

  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No contacts found.</p>
  }

  const SortIcon = ({ col }: { col: 'name' | 'title' }) => {
    if (sortKey !== col) return <HiOutlineChevronDown className="h-3 w-3 text-muted-foreground/40" />
    return sortDir === 'asc' ? <HiOutlineChevronUp className="h-3 w-3" /> : <HiOutlineChevronDown className="h-3 w-3" />
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 px-2 text-xs cursor-pointer select-none" onClick={() => handleSort('name')}>
              <div className="flex items-center gap-1">Name <SortIcon col="name" /></div>
            </TableHead>
            <TableHead className="h-8 px-2 text-xs cursor-pointer select-none" onClick={() => handleSort('title')}>
              <div className="flex items-center gap-1">Title <SortIcon col="title" /></div>
            </TableHead>
            <TableHead className="h-8 px-2 text-xs">Email</TableHead>
            <TableHead className="h-8 px-2 text-xs">Phone</TableHead>
            <TableHead className="h-8 px-2 text-xs">LinkedIn</TableHead>
            <TableHead className="h-8 px-2 text-xs">Social</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c, i) => (
            <TableRow key={i}>
              <TableCell className="py-1.5 px-2 text-xs font-medium">{c?.name ?? 'N/A'}</TableCell>
              <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">{c?.title ?? ''}</TableCell>
              <TableCell className="py-1.5 px-2 text-xs">
                {c?.email ? (
                  <span className="flex items-center gap-1">
                    <span className="truncate max-w-[140px]">{c.email}</span>
                    <CopyButton text={c.email} />
                  </span>
                ) : <span className="text-muted-foreground">--</span>}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-xs">
                {c?.phone ? (
                  <span className="flex items-center gap-1">
                    <span>{c.phone}</span>
                    <CopyButton text={c.phone} />
                  </span>
                ) : <span className="text-muted-foreground">--</span>}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-xs">
                {c?.linkedin_url ? (
                  <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Profile <HiOutlineExternalLink className="h-3 w-3" />
                  </a>
                ) : <span className="text-muted-foreground">--</span>}
              </TableCell>
              <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">
                {c?.twitter_handle || c?.other_profiles ? (
                  <span>{[c.twitter_handle, c.other_profiles].filter(Boolean).join(', ')}</span>
                ) : '--'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ---- Tech Stack Section ----

function TechStackSection({ techStack, techSummary }: { techStack: TechItem[]; techSummary: string }) {
  const grouped: Record<string, TechItem[]> = {}
  techStack.forEach(t => {
    const cat = t?.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  })

  const confidenceColor = (conf: string | undefined) => {
    const c = (conf ?? '').toLowerCase()
    if (c === 'confirmed') return 'bg-accent text-accent-foreground'
    if (c === 'likely') return 'bg-primary text-primary-foreground'
    if (c === 'possible') return 'bg-yellow-500 text-white'
    return 'bg-secondary text-secondary-foreground'
  }

  return (
    <div className="space-y-3">
      {techStack.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No tech stack data available.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 mb-1">
            <span className="flex items-center gap-1 mr-2 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-accent" /> Confirmed
            </span>
            <span className="flex items-center gap-1 mr-2 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" /> Likely
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> Possible
            </span>
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t, i) => (
                  <Badge key={i} className={cn('text-xs font-normal px-2 py-0.5', confidenceColor(t?.confidence))}>
                    {t?.technology_name ?? 'Unknown'}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {techSummary && (
        <>
          <Separator />
          <p className="text-xs text-foreground leading-relaxed">{techSummary}</p>
        </>
      )}
    </div>
  )
}

// ---- Market Intelligence Section ----

function MarketIntelSection({ news, funding, competitors, positioning }: { news: NewsItem[]; funding: FundingRound[]; competitors: Competitor[]; positioning: string }) {
  return (
    <div className="space-y-4">
      {/* Recent News */}
      {news.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent News</h4>
          <div className="space-y-2">
            {news.map((n, i) => (
              <div key={i} className="border-l-2 border-primary pl-3 py-1">
                <p className="text-xs font-semibold">{n?.headline ?? 'No headline'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{n?.source ?? ''} {n?.date ? `| ${n.date}` : ''}</p>
                {n?.summary && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funding Rounds */}
      {funding.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funding Rounds</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-7 px-2 text-xs">Round</TableHead>
                <TableHead className="h-7 px-2 text-xs">Amount</TableHead>
                <TableHead className="h-7 px-2 text-xs">Date</TableHead>
                <TableHead className="h-7 px-2 text-xs">Investors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funding.map((f, i) => (
                <TableRow key={i}>
                  <TableCell className="py-1 px-2 text-xs font-medium">{f?.round_type ?? 'N/A'}</TableCell>
                  <TableCell className="py-1 px-2 text-xs font-semibold text-accent">{f?.amount ?? 'N/A'}</TableCell>
                  <TableCell className="py-1 px-2 text-xs text-muted-foreground">{f?.date ?? ''}</TableCell>
                  <TableCell className="py-1 px-2 text-xs text-muted-foreground">{f?.investors ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Competitors */}
      {competitors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Competitors</h4>
          <div className="space-y-1.5">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{c?.name ?? 'Unknown'}</Badge>
                <p className="text-xs text-muted-foreground">{c?.notes ?? ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Positioning */}
      {positioning && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Positioning</h4>
          <div className="text-xs text-foreground leading-relaxed">{renderMarkdown(positioning)}</div>
        </div>
      )}

      {news.length === 0 && funding.length === 0 && competitors.length === 0 && !positioning && (
        <p className="text-sm text-muted-foreground py-2">No market intelligence data available.</p>
      )}
    </div>
  )
}

// ---- ErrorBoundary ----

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Main Page ----

export default function Page() {
  // State
  const [companyName, setCompanyName] = useState('')
  const [domainUrl, setDomainUrl] = useState('')
  const [contactNames, setContactNames] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<IntelligenceReport | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyFilter, setHistoryFilter] = useState('')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('prospectiq_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  // Save history to localStorage
  const saveHistory = useCallback((entries: HistoryEntry[]) => {
    setHistory(entries)
    try {
      localStorage.setItem('prospectiq_history', JSON.stringify(entries.slice(0, 50)))
    } catch {
      // ignore
    }
  }, [])

  // Research handler
  const handleResearch = async () => {
    if (!companyName.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    setActiveAgentId(AGENT_ID)

    let message = `Research the company: ${companyName.trim()}`
    if (domainUrl.trim()) message += `\nDomain: ${domainUrl.trim()}`
    if (contactNames.trim()) message += `\nKey contacts to look up: ${contactNames.trim()}`

    try {
      const result = await callAIAgent(message, AGENT_ID)
      setActiveAgentId(null)

      if (result.success && result.response?.result) {
        let data = result.response.result
        if (typeof data === 'string') {
          try { data = JSON.parse(data) } catch { /* not JSON */ }
        }

        const reportData = data as IntelligenceReport
        setReport(reportData)

        // Save to history
        const entry: HistoryEntry = {
          companyName: reportData?.company_overview?.company_name || companyName.trim(),
          timestamp: new Date().toISOString(),
          data: reportData
        }
        const newHistory = [entry, ...history.filter(h => h.companyName !== entry.companyName)]
        saveHistory(newHistory)
      } else {
        setError(result.error || result.response?.message || 'Failed to get intelligence report. Please try again.')
      }
    } catch (err) {
      setActiveAgentId(null)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Load from history
  const loadFromHistory = (entry: HistoryEntry) => {
    setReport(entry.data)
    setCompanyName(entry.companyName)
    setError(null)
  }

  // Delete history entry
  const deleteHistoryEntry = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index)
    saveHistory(newHistory)
  }

  // Export report
  const handleExport = () => {
    const dataToExport = sampleMode ? SAMPLE_DATA : report
    if (!dataToExport) return
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataToExport.company_overview?.company_name || 'report'}_intelligence.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Determine displayed data
  const displayData = sampleMode ? SAMPLE_DATA : report

  // Filtered history
  const filteredHistory = history.filter(h => h.companyName.toLowerCase().includes(historyFilter.toLowerCase()))

  // Safely extract arrays from displayData
  const contacts = Array.isArray(displayData?.contacts) ? displayData.contacts : []
  const techStack = Array.isArray(displayData?.tech_stack) ? displayData.tech_stack : []
  const recentNews = Array.isArray(displayData?.recent_news) ? displayData.recent_news : []
  const fundingRounds = Array.isArray(displayData?.funding_rounds) ? displayData.funding_rounds : []
  const competitors = Array.isArray(displayData?.competitors) ? displayData.competitors : []

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineDatabase className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold leading-tight">ProspectIQ</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">AI-Powered Company & Contact Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
            </div>
            {displayData && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs gap-1">
                <HiOutlineDownload className="h-3 w-3" /> Export
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className={cn("border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200", sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden")}>
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Research History</h2>
              <button onClick={() => setSidebarOpen(false)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted">
                <HiOutlineX className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <Input placeholder="Filter history..." value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="h-7 text-xs" />
            </div>
            <ScrollArea className="flex-1">
              <div className="px-2 pb-2">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <HiOutlineClock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">No research history yet</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredHistory.map((entry, i) => (
                      <div key={i} className="group flex items-center gap-1 rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => loadFromHistory(entry)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{entry.companyName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteHistoryEntry(i) }} className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-opacity">
                          <HiOutlineX className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Sidebar toggle (when closed) */}
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="absolute left-0 top-14 z-10 bg-card border border-border border-l-0 rounded-r px-1 py-2 hover:bg-muted transition-colors">
                <HiOutlineChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            )}

            {/* Search Bar */}
            <div className="border-b border-border bg-card px-4 py-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="company-input" className="text-xs text-muted-foreground mb-1 block">Company Name *</Label>
                  <Input id="company-input" placeholder="Enter company name..." value={companyName} onChange={e => setCompanyName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !loading) handleResearch() }} className="h-8 text-sm" disabled={loading} />
                </div>
                <Button onClick={handleResearch} disabled={loading || !companyName.trim()} className="h-8 text-xs gap-1.5 px-4">
                  {loading ? <CgSpinner className="h-3.5 w-3.5 animate-spin" /> : <HiOutlineSearch className="h-3.5 w-3.5" />}
                  {loading ? 'Researching...' : 'Research'}
                </Button>
              </div>
              {/* Advanced toggle */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-1.5 text-[10px] text-primary hover:underline flex items-center gap-0.5">
                {showAdvanced ? <HiOutlineChevronUp className="h-3 w-3" /> : <HiOutlineChevronDown className="h-3 w-3" />}
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>
              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="domain-input" className="text-xs text-muted-foreground mb-0.5 block">Domain URL</Label>
                    <Input id="domain-input" placeholder="e.g. acmecorp.com" value={domainUrl} onChange={e => setDomainUrl(e.target.value)} className="h-7 text-xs" disabled={loading} />
                  </div>
                  <div>
                    <Label htmlFor="contacts-input" className="text-xs text-muted-foreground mb-0.5 block">Key Contact Names</Label>
                    <Input id="contacts-input" placeholder="e.g. Jane Smith, John Doe" value={contactNames} onChange={e => setContactNames(e.target.value)} className="h-7 text-xs" disabled={loading} />
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Error State */}
                {error && (
                  <div className="mb-3 border border-destructive/30 bg-destructive/5 rounded px-3 py-2 flex items-start gap-2">
                    <HiOutlineExclamationCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-destructive">Research Failed</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResearch} className="h-6 text-[10px] shrink-0">Retry</Button>
                  </div>
                )}

                {/* Loading State */}
                {loading && <ReportSkeleton />}

                {/* Empty State */}
                {!loading && !displayData && !error && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="bg-muted/50 rounded-full p-4 mb-3">
                      <HiOutlineSearch className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Start Your Research</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-sm">Enter a company name above to generate a comprehensive intelligence report with firmographics, contacts, tech stack, and market analysis.</p>
                  </div>
                )}

                {/* Report Display */}
                {!loading && displayData && (
                  <div className="space-y-3">
                    {/* Company name header */}
                    {displayData.company_overview?.company_name && (
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold">{displayData.company_overview.company_name}</h2>
                        {displayData.company_overview?.industry && (
                          <Badge variant="secondary" className="text-xs">{displayData.company_overview.industry}</Badge>
                        )}
                      </div>
                    )}

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <CollapsibleSection title="Company Overview" icon={<HiOutlineOfficeBuilding className="h-4 w-4 text-primary" />}>
                        <CompanyOverviewSection overview={displayData.company_overview} />
                      </CollapsibleSection>

                      <CollapsibleSection title="Key Contacts" icon={<HiOutlineUsers className="h-4 w-4 text-primary" />} count={contacts.length}>
                        <ContactsSection contacts={contacts} />
                      </CollapsibleSection>

                      <CollapsibleSection title="Tech Stack" icon={<HiOutlineChip className="h-4 w-4 text-primary" />} count={techStack.length}>
                        <TechStackSection techStack={techStack} techSummary={displayData.tech_summary ?? ''} />
                      </CollapsibleSection>

                      <CollapsibleSection title="Market Intelligence" icon={<HiOutlineTrendingUp className="h-4 w-4 text-primary" />} count={recentNews.length + fundingRounds.length + competitors.length}>
                        <MarketIntelSection news={recentNews} funding={fundingRounds} competitors={competitors} positioning={displayData.market_positioning ?? ''} />
                      </CollapsibleSection>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Agent Status Footer */}
            <div className="border-t border-border bg-card px-4 py-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", activeAgentId ? "bg-accent animate-pulse" : "bg-muted-foreground/40")} />
                    <span className="text-[10px] text-muted-foreground">Intelligence Coordinator</span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-[10px] text-muted-foreground">4 sub-agents: Firmographics, Contacts, Tech Stack, Market Intel</span>
                </div>
                {activeAgentId && (
                  <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <CgSpinner className="h-3 w-3 animate-spin" /> Processing...
                  </span>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
