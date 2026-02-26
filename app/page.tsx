'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  HiOutlineSearch, HiOutlineDownload, HiOutlineExternalLink,
  HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineX, HiOutlineClock,
  HiOutlineOfficeBuilding, HiOutlineUsers, HiOutlineChip, HiOutlineTrendingUp,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineChevronRight,
  HiOutlineDatabase, HiOutlineExclamationCircle, HiOutlineGlobe,
  HiOutlineDocumentDownload, HiOutlineFilter, HiOutlineUserGroup,
  HiOutlineBriefcase, HiOutlineLocationMarker
} from 'react-icons/hi'
import { CgSpinner } from 'react-icons/cg'

const MANAGER_AGENT_ID = '69a0047b5c89478b3d0771e1'
const LEAD_FINDER_AGENT_ID = '69a0087d5b61f44b7feefc77'

// ==================== TYPES ====================

interface LeadershipEntry { name: string; title: string }

interface CompanyOverview {
  company_name: string; description: string; industry: string
  revenue_estimate: string; employee_count: string; founding_year: string
  headquarters: string; website_url: string; company_type: string
  leadership: LeadershipEntry[]
}

interface Contact {
  name: string; title: string; email: string; phone: string
  linkedin_url: string; twitter_handle: string; other_profiles: string
}

interface TechItem { technology_name: string; category: string; confidence: string }
interface NewsItem { headline: string; source: string; date: string; summary: string }
interface FundingRound { round_type: string; amount: string; date: string; investors: string }
interface Competitor { name: string; notes: string }

interface IntelligenceReport {
  company_overview: CompanyOverview; contacts: Contact[]
  tech_stack: TechItem[]; tech_summary: string
  recent_news: NewsItem[]; funding_rounds: FundingRound[]
  competitors: Competitor[]; market_positioning: string
}

interface HistoryEntry { companyName: string; timestamp: string; data: IntelligenceReport }

interface LeadCompany {
  company_name: string; industry: string; city: string
  employee_size_range: string; website: string; designation_found: string
  contact_person: string; source: string
}

interface LeadFinderResult {
  search_query: string; designation: string; employee_size: string
  geography: string; total_results: number; companies: LeadCompany[]
  summary: string
}

interface LeadHistoryEntry {
  designation: string; employeeSize: string; timestamp: string
  data: LeadFinderResult
}

// ==================== EXCEL EXPORT UTILITY ====================

function generateExcelXML(companies: LeadCompany[], designation: string, employeeSize: string): string {
  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const rows = companies.map(c => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(c.company_name || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.industry || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.city || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.employee_size_range || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.website || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.designation_found || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.contact_person || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(c.source || '')}</Data></Cell>
    </Row>`).join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Size="11"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Default">
   <Font ss:Size="10"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Leads - ${escapeXml(designation)}">
  <Table>
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Company Name</Data></Cell>
    <Cell><Data ss:Type="String">Industry</Data></Cell>
    <Cell><Data ss:Type="String">City</Data></Cell>
    <Cell><Data ss:Type="String">Employee Size</Data></Cell>
    <Cell><Data ss:Type="String">Website</Data></Cell>
    <Cell><Data ss:Type="String">Designation Found</Data></Cell>
    <Cell><Data ss:Type="String">Contact Person</Data></Cell>
    <Cell><Data ss:Type="String">Source</Data></Cell>
   </Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`
}

function downloadExcel(companies: LeadCompany[], designation: string, employeeSize: string) {
  const xml = generateExcelXML(companies, designation, employeeSize)
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads_${designation.replace(/\s+/g, '_')}_${employeeSize.replace(/\s+/g, '_')}_india.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== SAMPLE DATA ====================

const SAMPLE_INTEL: IntelligenceReport = {
  company_overview: {
    company_name: 'Acme Corp', description: 'Acme Corp is a leading enterprise SaaS company specializing in AI-driven analytics and workflow automation for mid-market and enterprise clients across North America and Europe.',
    industry: 'Enterprise Software / SaaS', revenue_estimate: '$120M - $150M ARR', employee_count: '850 - 1,000', founding_year: '2015',
    headquarters: 'San Francisco, CA', website_url: 'https://acmecorp.com', company_type: 'Private (Series D)',
    leadership: [{ name: 'Jane Smith', title: 'CEO & Co-Founder' }, { name: 'Michael Chen', title: 'CTO & Co-Founder' }, { name: 'Sarah Williams', title: 'VP of Sales' }, { name: 'David Park', title: 'CFO' }]
  },
  contacts: [
    { name: 'Jane Smith', title: 'CEO & Co-Founder', email: 'jane@acmecorp.com', phone: '+1 (415) 555-0101', linkedin_url: 'https://linkedin.com/in/janesmith', twitter_handle: '@janesmith', other_profiles: 'GitHub: jsmith-acme' },
    { name: 'Michael Chen', title: 'CTO & Co-Founder', email: 'michael@acmecorp.com', phone: '+1 (415) 555-0102', linkedin_url: 'https://linkedin.com/in/michaelchen', twitter_handle: '@mchen_tech', other_profiles: '' },
    { name: 'Sarah Williams', title: 'VP of Sales', email: 'sarah.w@acmecorp.com', phone: '+1 (415) 555-0103', linkedin_url: 'https://linkedin.com/in/sarahwilliams', twitter_handle: '', other_profiles: '' },
    { name: 'Alex Rivera', title: 'Head of Engineering', email: 'alex.r@acmecorp.com', phone: '', linkedin_url: 'https://linkedin.com/in/alexrivera', twitter_handle: '@alexr_dev', other_profiles: 'GitHub: alexr-acme' }
  ],
  tech_stack: [
    { technology_name: 'React', category: 'Frontend', confidence: 'confirmed' }, { technology_name: 'Next.js', category: 'Frontend', confidence: 'confirmed' },
    { technology_name: 'TypeScript', category: 'Language', confidence: 'confirmed' }, { technology_name: 'Python', category: 'Language', confidence: 'confirmed' },
    { technology_name: 'PostgreSQL', category: 'Database', confidence: 'confirmed' }, { technology_name: 'Redis', category: 'Database', confidence: 'likely' },
    { technology_name: 'AWS', category: 'Cloud', confidence: 'confirmed' }, { technology_name: 'Kubernetes', category: 'Infrastructure', confidence: 'likely' },
    { technology_name: 'Snowflake', category: 'Data Warehouse', confidence: 'likely' }, { technology_name: 'Stripe', category: 'Payments', confidence: 'confirmed' },
    { technology_name: 'Segment', category: 'Analytics', confidence: 'possible' }, { technology_name: 'Datadog', category: 'Monitoring', confidence: 'possible' }
  ],
  tech_summary: 'Acme Corp runs a modern cloud-native stack primarily on AWS with Kubernetes orchestration. Their frontend is built with React/Next.js and TypeScript, while backend services leverage Python.',
  recent_news: [
    { headline: 'Acme Corp Raises $75M Series D', source: 'TechCrunch', date: '2024-11-15', summary: 'Acme Corp announced a $75M Series D round led by Sequoia Capital.' },
    { headline: 'Acme Corp Named to Forbes Cloud 100', source: 'Forbes', date: '2024-09-20', summary: 'Recognized on the 2024 Forbes Cloud 100 list, ranking #47.' },
    { headline: 'Acme Corp Partners with Snowflake', source: 'Business Wire', date: '2024-08-05', summary: 'Strategic partnership for enhanced data integration.' }
  ],
  funding_rounds: [
    { round_type: 'Series D', amount: '$75M', date: '2024-11', investors: 'Sequoia Capital, Andreessen Horowitz' },
    { round_type: 'Series C', amount: '$50M', date: '2022-06', investors: 'Andreessen Horowitz, Lightspeed' },
    { round_type: 'Series B', amount: '$30M', date: '2020-03', investors: 'Lightspeed, Accel' }
  ],
  competitors: [
    { name: 'DataRobot', notes: 'Direct competitor in AI/ML analytics.' },
    { name: 'Tableau (Salesforce)', notes: 'Established BI player.' },
    { name: 'Looker (Google)', notes: 'Cloud-native analytics.' }
  ],
  market_positioning: 'Acme Corp positions itself as the "AI-first" analytics platform for mid-market and enterprise companies.'
}

const SAMPLE_LEADS: LeadFinderResult = {
  search_query: 'CTO at Indian companies with 200-500 employees',
  designation: 'CTO', employee_size: '201-500', geography: 'India', total_results: 8,
  companies: [
    { company_name: 'Razorpay', industry: 'FinTech', city: 'Bangalore', employee_size_range: '201-500', website: 'https://razorpay.com', designation_found: 'CTO', contact_person: 'Shashank Kumar', source: 'LinkedIn' },
    { company_name: 'Postman', industry: 'Developer Tools', city: 'Bangalore', employee_size_range: '201-500', website: 'https://postman.com', designation_found: 'CTO', contact_person: 'Ankit Sobti', source: 'Crunchbase' },
    { company_name: 'Freshworks', industry: 'SaaS', city: 'Chennai', employee_size_range: '201-500', website: 'https://freshworks.com', designation_found: 'CTO', contact_person: 'Not publicly available', source: 'Company Website' },
    { company_name: 'Zerodha', industry: 'FinTech', city: 'Bangalore', employee_size_range: '201-500', website: 'https://zerodha.com', designation_found: 'CTO', contact_person: 'Kailash Nadh', source: 'LinkedIn' },
    { company_name: 'Chargebee', industry: 'SaaS / Billing', city: 'Chennai', employee_size_range: '201-500', website: 'https://chargebee.com', designation_found: 'CTO', contact_person: 'Not publicly available', source: 'Inc42' },
    { company_name: 'Druva', industry: 'Cloud Data Protection', city: 'Pune', employee_size_range: '201-500', website: 'https://druva.com', designation_found: 'CTO', contact_person: 'Not publicly available', source: 'YourStory' },
    { company_name: 'CleverTap', industry: 'MarTech', city: 'Mumbai', employee_size_range: '201-500', website: 'https://clevertap.com', designation_found: 'CTO', contact_person: 'Not publicly available', source: 'LinkedIn' },
    { company_name: 'Browserstack', industry: 'Developer Tools', city: 'Mumbai', employee_size_range: '201-500', website: 'https://browserstack.com', designation_found: 'CTO', contact_person: 'Not publicly available', source: 'Crunchbase' }
  ],
  summary: 'Found 8 Indian companies with 201-500 employees that have a CTO or equivalent role, spanning FinTech, SaaS, Developer Tools, and MarTech sectors.'
}

// ==================== EMPLOYEE SIZE OPTIONS ====================

const EMPLOYEE_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']

// ==================== HELPERS ====================

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

// ==================== SHARED COMPONENTS ====================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    if (!text) return
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* fallback */ }
  }, [text])
  return (
    <button onClick={handleCopy} className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors" title="Copy">
      {copied ? <HiOutlineCheck className="h-3 w-3 text-accent" /> : <HiOutlineClipboardCopy className="h-3 w-3 text-muted-foreground" />}
    </button>
  )
}

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
                {count !== undefined && count > 0 && <Badge variant="secondary" className="text-xs px-1.5 py-0">{count}</Badge>}
              </div>
              {open ? <HiOutlineChevronUp className="h-4 w-4 text-muted-foreground" /> : <HiOutlineChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      <div className="text-center py-6">
        <CgSpinner className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Researching across 4 intelligence sources...</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex gap-1">
            {['Firmographics', 'Contacts', 'Tech Stack', 'Market Intel'].map((label, i) => (
              <Badge key={label} variant="outline" className="text-xs animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>{label}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(n => (
          <Card key={n} className="border border-border">
            <CardHeader className="py-2.5 px-4"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-4/6" /><Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function LeadsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="text-center py-8">
        <CgSpinner className="h-7 w-7 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm font-medium text-foreground">Searching Indian companies...</p>
        <p className="text-xs text-muted-foreground mt-1">Scanning LinkedIn, Crunchbase, Inc42, AmbitionBox and more</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          {['IT/Software', 'FinTech', 'Manufacturing', 'BFSI', 'Healthcare', 'E-commerce'].map((s, i) => (
            <Badge key={s} variant="outline" className="text-[10px] animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>{s}</Badge>
          ))}
        </div>
      </div>
      <Card className="border border-border">
        <CardContent className="p-4 space-y-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="flex gap-3 items-center">
              <Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== INTEL SUB-COMPONENTS ====================

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
          ) : <span className="text-xs text-muted-foreground">N/A</span>}
        </div>
      </div>
      {overview.description && (<><Separator /><p className="text-xs text-foreground leading-relaxed">{overview.description}</p></>)}
      {leadership.length > 0 && (
        <><Separator />
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

function ContactsSection({ contacts }: { contacts: Contact[] }) {
  const [sortKey, setSortKey] = useState<'name' | 'title'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const handleSort = (key: 'name' | 'title') => {
    if (sortKey === key) { setSortDir(prev => prev === 'asc' ? 'desc' : 'asc') } else { setSortKey(key); setSortDir('asc') }
  }
  const sorted = [...contacts].sort((a, b) => {
    const aVal = (sortKey === 'name' ? a?.name : a?.title) ?? ''; const bVal = (sortKey === 'name' ? b?.name : b?.title) ?? ''
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })
  if (contacts.length === 0) return <p className="text-sm text-muted-foreground py-2">No contacts found.</p>
  const SortIcon = ({ col }: { col: 'name' | 'title' }) => {
    if (sortKey !== col) return <HiOutlineChevronDown className="h-3 w-3 text-muted-foreground/40" />
    return sortDir === 'asc' ? <HiOutlineChevronUp className="h-3 w-3" /> : <HiOutlineChevronDown className="h-3 w-3" />
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 px-2 text-xs cursor-pointer select-none" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Name <SortIcon col="name" /></div></TableHead>
            <TableHead className="h-8 px-2 text-xs cursor-pointer select-none" onClick={() => handleSort('title')}><div className="flex items-center gap-1">Title <SortIcon col="title" /></div></TableHead>
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
              <TableCell className="py-1.5 px-2 text-xs">{c?.email ? <span className="flex items-center gap-1"><span className="truncate max-w-[140px]">{c.email}</span><CopyButton text={c.email} /></span> : <span className="text-muted-foreground">--</span>}</TableCell>
              <TableCell className="py-1.5 px-2 text-xs">{c?.phone ? <span className="flex items-center gap-1"><span>{c.phone}</span><CopyButton text={c.phone} /></span> : <span className="text-muted-foreground">--</span>}</TableCell>
              <TableCell className="py-1.5 px-2 text-xs">{c?.linkedin_url ? <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">Profile <HiOutlineExternalLink className="h-3 w-3" /></a> : <span className="text-muted-foreground">--</span>}</TableCell>
              <TableCell className="py-1.5 px-2 text-xs text-muted-foreground">{c?.twitter_handle || c?.other_profiles ? <span>{[c.twitter_handle, c.other_profiles].filter(Boolean).join(', ')}</span> : '--'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TechStackSection({ techStack, techSummary }: { techStack: TechItem[]; techSummary: string }) {
  const grouped: Record<string, TechItem[]> = {}
  techStack.forEach(t => { const cat = t?.category || 'Other'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(t) })
  const confidenceColor = (conf: string | undefined) => {
    const c = (conf ?? '').toLowerCase()
    if (c === 'confirmed') return 'bg-accent text-accent-foreground'
    if (c === 'likely') return 'bg-primary text-primary-foreground'
    if (c === 'possible') return 'bg-yellow-500 text-white'
    return 'bg-secondary text-secondary-foreground'
  }
  return (
    <div className="space-y-3">
      {techStack.length === 0 ? <p className="text-sm text-muted-foreground py-2">No tech stack data available.</p> : (
        <>
          <div className="flex flex-wrap gap-1 mb-1">
            <span className="flex items-center gap-1 mr-2 text-[10px] text-muted-foreground"><span className="inline-block w-2 h-2 rounded-full bg-accent" /> Confirmed</span>
            <span className="flex items-center gap-1 mr-2 text-[10px] text-muted-foreground"><span className="inline-block w-2 h-2 rounded-full bg-primary" /> Likely</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500" /> Possible</span>
          </div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t, i) => <Badge key={i} className={cn('text-xs font-normal px-2 py-0.5', confidenceColor(t?.confidence))}>{t?.technology_name ?? 'Unknown'}</Badge>)}
              </div>
            </div>
          ))}
        </>
      )}
      {techSummary && (<><Separator /><p className="text-xs text-foreground leading-relaxed">{techSummary}</p></>)}
    </div>
  )
}

function MarketIntelSection({ news, funding, competitors, positioning }: { news: NewsItem[]; funding: FundingRound[]; competitors: Competitor[]; positioning: string }) {
  return (
    <div className="space-y-4">
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
      {funding.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Funding Rounds</h4>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="h-7 px-2 text-xs">Round</TableHead><TableHead className="h-7 px-2 text-xs">Amount</TableHead>
              <TableHead className="h-7 px-2 text-xs">Date</TableHead><TableHead className="h-7 px-2 text-xs">Investors</TableHead>
            </TableRow></TableHeader>
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

// ==================== ERROR BOUNDARY ====================

class PageErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false, error: '' } }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error: error.message } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ==================== MAIN PAGE ====================

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>('leads')

  // Intel states
  const [companyName, setCompanyName] = useState('')
  const [domainUrl, setDomainUrl] = useState('')
  const [contactNames, setContactNames] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [intelLoading, setIntelLoading] = useState(false)
  const [intelError, setIntelError] = useState<string | null>(null)
  const [report, setReport] = useState<IntelligenceReport | null>(null)
  const [intelHistory, setIntelHistory] = useState<HistoryEntry[]>([])
  const [intelHistoryFilter, setIntelHistoryFilter] = useState('')
  const [sampleIntelMode, setSampleIntelMode] = useState(false)

  // Lead Finder states
  const [designation, setDesignation] = useState('')
  const [employeeSize, setEmployeeSize] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)
  const [leadResult, setLeadResult] = useState<LeadFinderResult | null>(null)
  const [leadHistory, setLeadHistory] = useState<LeadHistoryEntry[]>([])
  const [leadHistoryFilter, setLeadHistoryFilter] = useState('')
  const [sampleLeadMode, setSampleLeadMode] = useState(false)
  const [industryFilter, setIndustryFilter] = useState<string>('all')

  // Shared
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  useEffect(() => {
    try { const s = localStorage.getItem('prospectiq_history'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setIntelHistory(p) } } catch {}
    try { const s = localStorage.getItem('prospectiq_lead_history'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setLeadHistory(p) } } catch {}
  }, [])

  const saveIntelHistory = useCallback((entries: HistoryEntry[]) => {
    setIntelHistory(entries); try { localStorage.setItem('prospectiq_history', JSON.stringify(entries.slice(0, 50))) } catch {}
  }, [])

  const saveLeadHistory = useCallback((entries: LeadHistoryEntry[]) => {
    setLeadHistory(entries); try { localStorage.setItem('prospectiq_lead_history', JSON.stringify(entries.slice(0, 50))) } catch {}
  }, [])

  // Intel research
  const handleResearch = async () => {
    if (!companyName.trim()) return
    setIntelLoading(true); setIntelError(null); setReport(null); setActiveAgentId(MANAGER_AGENT_ID)
    let message = `Research the company: ${companyName.trim()}`
    if (domainUrl.trim()) message += `\nDomain: ${domainUrl.trim()}`
    if (contactNames.trim()) message += `\nKey contacts to look up: ${contactNames.trim()}`
    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)
      setActiveAgentId(null)
      if (result.success && result.response?.result) {
        let data = result.response.result
        if (typeof data === 'string') { try { data = JSON.parse(data) } catch {} }
        const reportData = data as IntelligenceReport; setReport(reportData)
        const entry: HistoryEntry = { companyName: reportData?.company_overview?.company_name || companyName.trim(), timestamp: new Date().toISOString(), data: reportData }
        saveIntelHistory([entry, ...intelHistory.filter(h => h.companyName !== entry.companyName)])
      } else { setIntelError(result.error || result.response?.message || 'Failed to get intelligence report.') }
    } catch (err) { setActiveAgentId(null); setIntelError(err instanceof Error ? err.message : 'An unexpected error occurred.') }
    finally { setIntelLoading(false) }
  }

  // Lead search
  const handleLeadSearch = async () => {
    if (!designation.trim() || !employeeSize) return
    setLeadLoading(true); setLeadError(null); setLeadResult(null); setActiveAgentId(LEAD_FINDER_AGENT_ID); setIndustryFilter('all')
    const message = `Find Indian companies with the designation "${designation.trim()}" and employee size range "${employeeSize}". Geography: India only. Search across all industries. Return as many companies as possible with company name, industry, city, employee size, website, designation found, and contact person name.`
    try {
      const result = await callAIAgent(message, LEAD_FINDER_AGENT_ID)
      setActiveAgentId(null)
      if (result.success && result.response?.result) {
        let data = result.response.result
        if (typeof data === 'string') { try { data = JSON.parse(data) } catch {} }
        const leadData = data as LeadFinderResult
        if (!Array.isArray(leadData.companies)) { leadData.companies = [] }
        setLeadResult(leadData)
        const entry: LeadHistoryEntry = { designation: designation.trim(), employeeSize, timestamp: new Date().toISOString(), data: leadData }
        saveLeadHistory([entry, ...leadHistory.filter(h => !(h.designation === entry.designation && h.employeeSize === entry.employeeSize))])
      } else { setLeadError(result.error || result.response?.message || 'Failed to find leads.') }
    } catch (err) { setActiveAgentId(null); setLeadError(err instanceof Error ? err.message : 'An unexpected error occurred.') }
    finally { setLeadLoading(false) }
  }

  const loadIntelHistory = (entry: HistoryEntry) => { setReport(entry.data); setCompanyName(entry.companyName); setIntelError(null) }
  const deleteIntelHistory = (i: number) => saveIntelHistory(intelHistory.filter((_, idx) => idx !== i))
  const loadLeadHistory = (entry: LeadHistoryEntry) => { setLeadResult(entry.data); setDesignation(entry.designation); setEmployeeSize(entry.employeeSize); setLeadError(null); setIndustryFilter('all') }
  const deleteLeadHistory = (i: number) => saveLeadHistory(leadHistory.filter((_, idx) => idx !== i))

  const handleExportIntel = () => {
    const d = sampleIntelMode ? SAMPLE_INTEL : report; if (!d) return
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url
    a.download = `${d.company_overview?.company_name || 'report'}_intelligence.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleExportLeads = () => {
    const d = sampleLeadMode ? SAMPLE_LEADS : leadResult
    if (!d || !Array.isArray(d.companies) || d.companies.length === 0) return
    const filtered = industryFilter === 'all' ? d.companies : d.companies.filter(c => c.industry === industryFilter)
    downloadExcel(filtered, d.designation || designation, d.employee_size || employeeSize)
  }

  // Derived
  const displayIntel = sampleIntelMode ? SAMPLE_INTEL : report
  const displayLeads = sampleLeadMode ? SAMPLE_LEADS : leadResult
  const contacts = Array.isArray(displayIntel?.contacts) ? displayIntel.contacts : []
  const techStack = Array.isArray(displayIntel?.tech_stack) ? displayIntel.tech_stack : []
  const recentNews = Array.isArray(displayIntel?.recent_news) ? displayIntel.recent_news : []
  const fundingRounds = Array.isArray(displayIntel?.funding_rounds) ? displayIntel.funding_rounds : []
  const competitors = Array.isArray(displayIntel?.competitors) ? displayIntel.competitors : []
  const leadCompanies = Array.isArray(displayLeads?.companies) ? displayLeads.companies : []
  const filteredLeadCompanies = industryFilter === 'all' ? leadCompanies : leadCompanies.filter(c => c.industry === industryFilter)
  const uniqueIndustries = [...new Set(leadCompanies.map(c => c.industry).filter(Boolean))]
  const filteredIntelHistory = intelHistory.filter(h => h.companyName.toLowerCase().includes(intelHistoryFilter.toLowerCase()))
  const filteredLeadHistory = leadHistory.filter(h => h.designation.toLowerCase().includes(leadHistoryFilter.toLowerCase()))

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <HiOutlineDatabase className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold leading-tight">ProspectIQ</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">AI-Powered Company & Lead Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={activeTab === 'leads' ? sampleLeadMode : sampleIntelMode} onCheckedChange={v => activeTab === 'leads' ? setSampleLeadMode(v) : setSampleIntelMode(v)} />
            </div>
            {activeTab === 'intel' && displayIntel && (
              <Button variant="outline" size="sm" onClick={handleExportIntel} className="h-7 text-xs gap-1"><HiOutlineDownload className="h-3 w-3" /> Export</Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className={cn("border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200", sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden")}>
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {activeTab === 'leads' ? 'Lead Search History' : 'Research History'}
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted">
                <HiOutlineX className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>

            {activeTab === 'leads' ? (
              <>
                <div className="px-3 pb-2"><Input placeholder="Filter by designation..." value={leadHistoryFilter} onChange={e => setLeadHistoryFilter(e.target.value)} className="h-7 text-xs" /></div>
                <ScrollArea className="flex-1">
                  <div className="px-2 pb-2">
                    {filteredLeadHistory.length === 0 ? (
                      <div className="text-center py-6"><HiOutlineClock className="h-5 w-5 text-muted-foreground mx-auto mb-1" /><p className="text-xs text-muted-foreground">No lead searches yet</p></div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredLeadHistory.map((entry, i) => (
                          <div key={i} className="group flex items-center gap-1 rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => loadLeadHistory(entry)}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{entry.designation}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.employeeSize} emp | {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteLeadHistory(i) }} className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-opacity">
                              <HiOutlineX className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <>
                <div className="px-3 pb-2"><Input placeholder="Filter history..." value={intelHistoryFilter} onChange={e => setIntelHistoryFilter(e.target.value)} className="h-7 text-xs" /></div>
                <ScrollArea className="flex-1">
                  <div className="px-2 pb-2">
                    {filteredIntelHistory.length === 0 ? (
                      <div className="text-center py-6"><HiOutlineClock className="h-5 w-5 text-muted-foreground mx-auto mb-1" /><p className="text-xs text-muted-foreground">No research history yet</p></div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredIntelHistory.map((entry, i) => (
                          <div key={i} className="group flex items-center gap-1 rounded px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => loadIntelHistory(entry)}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{entry.companyName}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteIntelHistory(i) }} className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-opacity">
                              <HiOutlineX className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </aside>

          {/* Main */}
          <main className="flex-1 flex flex-col min-w-0">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="absolute left-0 top-14 z-10 bg-card border border-border border-l-0 rounded-r px-1 py-2 hover:bg-muted transition-colors">
                <HiOutlineChevronRight className="h-3 w-3 text-muted-foreground" />
              </button>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="border-b border-border bg-card px-4">
                <TabsList className="h-9 bg-transparent gap-2 p-0">
                  <TabsTrigger value="leads" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-3 py-1.5 gap-1.5">
                    <HiOutlineUserGroup className="h-3.5 w-3.5" /> Lead Finder
                  </TabsTrigger>
                  <TabsTrigger value="intel" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-3 py-1.5 gap-1.5">
                    <HiOutlineOfficeBuilding className="h-3.5 w-3.5" /> Company Intel
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* LEAD FINDER TAB */}
              <TabsContent value="leads" className="flex-1 flex flex-col min-h-0 m-0">
                <div className="border-b border-border bg-card px-4 py-3">
                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <Label htmlFor="designation-input" className="text-xs text-muted-foreground mb-1 block">Designation / Job Title *</Label>
                      <Input id="designation-input" placeholder="e.g. CTO, VP of Sales, Head of Marketing..." value={designation} onChange={e => setDesignation(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !leadLoading && employeeSize) handleLeadSearch() }} className="h-8 text-sm" disabled={leadLoading} />
                    </div>
                    <div className="w-[180px]">
                      <Label htmlFor="size-select" className="text-xs text-muted-foreground mb-1 block">Employee Size *</Label>
                      <select id="size-select" value={employeeSize} onChange={e => setEmployeeSize(e.target.value)} className="w-full h-8 text-sm rounded border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring" disabled={leadLoading}>
                        <option value="">Select size...</option>
                        {EMPLOYEE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 pb-0.5">
                      <HiOutlineLocationMarker className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">India</span>
                    </div>
                    <Button onClick={handleLeadSearch} disabled={leadLoading || !designation.trim() || !employeeSize} className="h-8 text-xs gap-1.5 px-4">
                      {leadLoading ? <CgSpinner className="h-3.5 w-3.5 animate-spin" /> : <HiOutlineSearch className="h-3.5 w-3.5" />}
                      {leadLoading ? 'Searching...' : 'Find Leads'}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {leadError && (
                      <div className="mb-3 border border-destructive/30 bg-destructive/5 rounded px-3 py-2 flex items-start gap-2">
                        <HiOutlineExclamationCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium text-destructive">Search Failed</p><p className="text-xs text-muted-foreground mt-0.5">{leadError}</p></div>
                        <Button variant="outline" size="sm" onClick={handleLeadSearch} className="h-6 text-[10px] shrink-0">Retry</Button>
                      </div>
                    )}

                    {leadLoading && <LeadsSkeleton />}

                    {!leadLoading && !displayLeads && !leadError && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-muted/50 rounded-full p-5 mb-4"><HiOutlineGlobe className="h-10 w-10 text-muted-foreground" /></div>
                        <h3 className="text-sm font-semibold mb-1">Find Companies Across India</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-md">Enter a designation and employee size to discover Indian companies matching your criteria. Results are downloadable as an Excel file.</p>
                        <div className="flex gap-2 mt-4">
                          {['CTO', 'VP Sales', 'Head of Marketing', 'CFO'].map(d => (
                            <Badge key={d} variant="outline" className="text-xs cursor-pointer hover:bg-muted" onClick={() => setDesignation(d)}>{d}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {!leadLoading && displayLeads && leadCompanies.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h2 className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineBriefcase className="h-4 w-4 text-primary" />
                              {displayLeads.designation} - {displayLeads.employee_size} employees
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{leadCompanies.length} companies found in India | {uniqueIndustries.length} industries</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <HiOutlineFilter className="h-3.5 w-3.5 text-muted-foreground" />
                              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                                <option value="all">All Industries ({leadCompanies.length})</option>
                                {uniqueIndustries.map(ind => <option key={ind} value={ind}>{ind} ({leadCompanies.filter(c => c.industry === ind).length})</option>)}
                              </select>
                            </div>
                            <Button onClick={handleExportLeads} className="h-7 text-xs gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                              <HiOutlineDocumentDownload className="h-3.5 w-3.5" /> Download Excel ({filteredLeadCompanies.length})
                            </Button>
                          </div>
                        </div>

                        {displayLeads.summary && (
                          <div className="bg-muted/30 rounded px-3 py-2 text-xs text-foreground leading-relaxed border border-border">{displayLeads.summary}</div>
                        )}

                        <Card className="border border-border">
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">#</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Company Name</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Industry</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">City</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Employees</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Designation</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Contact</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Website</TableHead>
                                    <TableHead className="h-8 px-3 text-xs font-semibold">Source</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredLeadCompanies.map((c, i) => (
                                    <TableRow key={i} className="hover:bg-muted/20">
                                      <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{i + 1}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs font-medium">{c.company_name || 'N/A'}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs"><Badge variant="outline" className="text-[10px] font-normal">{c.industry || 'N/A'}</Badge></TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{c.city || 'N/A'}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs text-muted-foreground">{c.employee_size_range || 'N/A'}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs">{c.designation_found || 'N/A'}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs">{c.contact_person && c.contact_person !== 'Not publicly available' ? <span className="font-medium">{c.contact_person}</span> : <span className="text-muted-foreground">--</span>}</TableCell>
                                      <TableCell className="py-1.5 px-3 text-xs">
                                        {c.website ? <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 max-w-[140px] truncate">{c.website.replace(/https?:\/\//, '')} <HiOutlineExternalLink className="h-3 w-3 shrink-0" /></a> : <span className="text-muted-foreground">--</span>}
                                      </TableCell>
                                      <TableCell className="py-1.5 px-3 text-[10px] text-muted-foreground">{c.source || '--'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>

                        {uniqueIndustries.length > 1 && (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1 self-center">Industries:</span>
                            {uniqueIndustries.map(ind => (
                              <Badge key={ind} variant={industryFilter === ind ? 'default' : 'secondary'} className="text-[10px] cursor-pointer" onClick={() => setIndustryFilter(industryFilter === ind ? 'all' : ind)}>
                                {ind} ({leadCompanies.filter(c => c.industry === ind).length})
                              </Badge>
                            ))}
                            {industryFilter !== 'all' && (
                              <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => setIndustryFilter('all')}>
                                <HiOutlineX className="h-2.5 w-2.5 mr-0.5" /> Clear
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!leadLoading && displayLeads && leadCompanies.length === 0 && (
                      <div className="text-center py-10">
                        <HiOutlineExclamationCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No companies found matching your criteria. Try adjusting the designation or employee size.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* COMPANY INTEL TAB */}
              <TabsContent value="intel" className="flex-1 flex flex-col min-h-0 m-0">
                <div className="border-b border-border bg-card px-4 py-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="company-input" className="text-xs text-muted-foreground mb-1 block">Company Name *</Label>
                      <Input id="company-input" placeholder="Enter company name..." value={companyName} onChange={e => setCompanyName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !intelLoading) handleResearch() }} className="h-8 text-sm" disabled={intelLoading} />
                    </div>
                    <Button onClick={handleResearch} disabled={intelLoading || !companyName.trim()} className="h-8 text-xs gap-1.5 px-4">
                      {intelLoading ? <CgSpinner className="h-3.5 w-3.5 animate-spin" /> : <HiOutlineSearch className="h-3.5 w-3.5" />}
                      {intelLoading ? 'Researching...' : 'Research'}
                    </Button>
                  </div>
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-1.5 text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    {showAdvanced ? <HiOutlineChevronUp className="h-3 w-3" /> : <HiOutlineChevronDown className="h-3 w-3" />}
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                  </button>
                  {showAdvanced && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div><Label htmlFor="domain-input" className="text-xs text-muted-foreground mb-0.5 block">Domain URL</Label><Input id="domain-input" placeholder="e.g. acmecorp.com" value={domainUrl} onChange={e => setDomainUrl(e.target.value)} className="h-7 text-xs" disabled={intelLoading} /></div>
                      <div><Label htmlFor="contacts-input" className="text-xs text-muted-foreground mb-0.5 block">Key Contact Names</Label><Input id="contacts-input" placeholder="e.g. Jane Smith, John Doe" value={contactNames} onChange={e => setContactNames(e.target.value)} className="h-7 text-xs" disabled={intelLoading} /></div>
                    </div>
                  )}
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {intelError && (
                      <div className="mb-3 border border-destructive/30 bg-destructive/5 rounded px-3 py-2 flex items-start gap-2">
                        <HiOutlineExclamationCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium text-destructive">Research Failed</p><p className="text-xs text-muted-foreground mt-0.5">{intelError}</p></div>
                        <Button variant="outline" size="sm" onClick={handleResearch} className="h-6 text-[10px] shrink-0">Retry</Button>
                      </div>
                    )}
                    {intelLoading && <ReportSkeleton />}
                    {!intelLoading && !displayIntel && !intelError && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-muted/50 rounded-full p-4 mb-3"><HiOutlineSearch className="h-8 w-8 text-muted-foreground" /></div>
                        <h3 className="text-sm font-semibold mb-1">Start Your Research</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-sm">Enter a company name above to generate a comprehensive intelligence report.</p>
                      </div>
                    )}
                    {!intelLoading && displayIntel && (
                      <div className="space-y-3">
                        {displayIntel.company_overview?.company_name && (
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-semibold">{displayIntel.company_overview.company_name}</h2>
                            {displayIntel.company_overview?.industry && <Badge variant="secondary" className="text-xs">{displayIntel.company_overview.industry}</Badge>}
                          </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <CollapsibleSection title="Company Overview" icon={<HiOutlineOfficeBuilding className="h-4 w-4 text-primary" />}>
                            <CompanyOverviewSection overview={displayIntel.company_overview} />
                          </CollapsibleSection>
                          <CollapsibleSection title="Key Contacts" icon={<HiOutlineUsers className="h-4 w-4 text-primary" />} count={contacts.length}>
                            <ContactsSection contacts={contacts} />
                          </CollapsibleSection>
                          <CollapsibleSection title="Tech Stack" icon={<HiOutlineChip className="h-4 w-4 text-primary" />} count={techStack.length}>
                            <TechStackSection techStack={techStack} techSummary={displayIntel.tech_summary ?? ''} />
                          </CollapsibleSection>
                          <CollapsibleSection title="Market Intelligence" icon={<HiOutlineTrendingUp className="h-4 w-4 text-primary" />} count={recentNews.length + fundingRounds.length + competitors.length}>
                            <MarketIntelSection news={recentNews} funding={fundingRounds} competitors={competitors} positioning={displayIntel.market_positioning ?? ''} />
                          </CollapsibleSection>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="border-t border-border bg-card px-4 py-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", activeAgentId ? "bg-accent animate-pulse" : "bg-muted-foreground/40")} />
                    <span className="text-[10px] text-muted-foreground">
                      {activeAgentId === LEAD_FINDER_AGENT_ID ? 'India Lead Finder' : activeAgentId === MANAGER_AGENT_ID ? 'Intelligence Coordinator' : 'Ready'}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-[10px] text-muted-foreground">
                    {activeTab === 'leads' ? 'Perplexity sonar-pro | India-focused search' : '4 sub-agents: Firmographics, Contacts, Tech Stack, Market Intel'}
                  </span>
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
    </PageErrorBoundary>
  )
}
