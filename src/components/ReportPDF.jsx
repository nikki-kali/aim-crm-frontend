import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#06babe', padding: 20, marginBottom: 20, borderRadius: 6 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 6, border: '1px solid #f3f4f6' },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#06babe' },
  kpiLabel: { fontSize: 8, color: '#9ca3af', marginTop: 2, textTransform: 'uppercase' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827', borderBottom: '2px solid #06babe', paddingBottom: 4, marginBottom: 8 },
  table: { border: '1px solid #f3f4f6', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: '6 10' },
  tableRow: { flexDirection: 'row', padding: '5 10', borderTop: '1px solid #f3f4f6' },
  th: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' },
  td: { flex: 1, fontSize: 9, color: '#374151' },
  tdBold: { flex: 1, fontSize: 9, fontWeight: 'bold', color: '#111827' },
  tdTeal: { flex: 1, fontSize: 9, fontWeight: 'bold', color: '#06babe' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
  alertBox: { backgroundColor: '#fff8f0', border: '1px solid #fed7aa', borderRadius: 6, padding: 10, marginTop: 12 },
  alertText: { fontSize: 9, color: '#92400e' },
})

function ReportDocument({ data, month }) {
  const { kpis, ytd, brandRevenue, topClients, coldCount, overdueCount } = data
  const total = Number(ytd?.ytd_leads || 0)
  const won = Number(ytd?.ytd_won || 0)
  const convRate = total > 0 ? Math.round((won / total) * 100) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aim Dental Laboratory CRM</Text>
          <Text style={styles.headerSub}>Summary Report — {month}</Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Active Leads', value: kpis?.active_leads ?? 0 },
            { label: 'Total Clients', value: kpis?.total_clients ?? 0 },
            { label: 'Total Revenue', value: `$${Number(kpis?.total_revenue || 0).toLocaleString()}` },
            { label: 'Conversion', value: `${convRate}%` },
          ].map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* YTD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year-to-Date Performance</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Metric</Text><Text style={styles.th}>Value</Text>
            </View>
            {[
              ['Total Leads Generated', total],
              ['Leads Won', won],
              ['Leads Lost', Number(ytd?.ytd_lost || 0)],
              ['Conversion Rate', `${convRate}%`],
            ].map(([label, value]) => (
              <View key={label} style={styles.tableRow}>
                <Text style={styles.td}>{label}</Text>
                <Text style={styles.tdBold}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue by Brand */}
        {brandRevenue?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue by Brand</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.th}>Brand</Text><Text style={styles.th}>Revenue</Text>
              </View>
              {brandRevenue.map(b => (
                <View key={b.brand} style={styles.tableRow}>
                  <Text style={styles.td}>{b.brand}</Text>
                  <Text style={styles.tdTeal}>${Number(b.revenue || b.total_revenue || 0).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Clients */}
        {topClients?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Clients by Revenue</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.th}>#</Text>
                <Text style={{ ...styles.th, flex: 2 }}>Doctor</Text>
                <Text style={styles.th}>Revenue</Text>
              </View>
              {topClients.slice(0, 5).map((c, i) => (
                <View key={c.id || i} style={styles.tableRow}>
                  <Text style={styles.td}>{i + 1}</Text>
                  <Text style={{ ...styles.tdBold, flex: 2 }}>{c.doctor_name}</Text>
                  <Text style={styles.tdTeal}>${Number(c.total_revenue || 0).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Alerts */}
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠  {coldCount ?? 0} cold leads need follow-up (no contact in 14+ days)   ·   {overdueCount ?? 0} overdue cases past due date
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Aim Dental Laboratory CRM · Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadReportPDF(data) {
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const blob = await pdf(<ReportDocument data={data} month={month} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aim-dental-report-${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Rep Personal Report PDF ──────────────────────────────────────────────────

function RepReportDocument({ data, month }) {
  const { rep, week, month: m, allTime, eos } = data
  const totalRocks = (eos?.rocks?.on_track || 0) + (eos?.rocks?.off_track || 0) + (eos?.rocks?.done || 0)

  const tableRows = (rows) => rows.map(([label, value]) => (
    <View key={label} style={styles.tableRow}>
      <Text style={styles.td}>{label}</Text>
      <Text style={styles.tdBold}>{value}</Text>
    </View>
  ))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance Report — {rep?.name}</Text>
          <Text style={styles.headerSub}>Aim Dental Laboratory · {month}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.kpiRow}>
            {[
              { label: 'Leads Created', value: week?.leads_created ?? 0 },
              { label: 'Contacted', value: week?.contacted ?? 0 },
              { label: 'Proposals', value: week?.proposals ?? 0 },
              { label: 'Wins', value: week?.wins ?? 0 },
            ].map(k => (
              <View key={k.label} style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Metric</Text>
              <Text style={styles.th}>Value</Text>
            </View>
            {tableRows([
              ['Leads Created', m?.leads_created ?? 0],
              ['Wins', m?.wins ?? 0],
              ['Proposals Sent', m?.proposals ?? 0],
              ['Revenue', `$${Number(m?.revenue || 0).toLocaleString()}`],
              ['Conversion Rate', `${m?.conversion_rate ?? 0}%`],
            ])}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All-Time Performance</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Metric</Text>
              <Text style={styles.th}>Value</Text>
            </View>
            {tableRows([
              ['Total Leads', allTime?.total_leads ?? 0],
              ['Active Leads', allTime?.active_leads ?? 0],
              ['Total Wins', allTime?.total_wins ?? 0],
              ['Total Revenue', `$${Number(allTime?.total_revenue || 0).toLocaleString()}`],
              ['Conversion Rate', `${allTime?.conversion_rate ?? 0}%`],
            ])}
          </View>
        </View>

        {eos && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EOS Track</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.th}>Area</Text>
                <Text style={{ ...styles.th, flex: 2 }}>Status</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Rocks (90-day)</Text>
                <Text style={{ ...styles.tdBold, flex: 2 }}>
                  {totalRocks === 0
                    ? 'No rocks assigned'
                    : `${eos.rocks.on_track} On Track · ${eos.rocks.off_track} Off Track · ${eos.rocks.done} Done`}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Weekly To-Dos</Text>
                <Text style={{ ...styles.tdBold, flex: 2 }}>
                  {eos.todos.done} / {eos.todos.total} completed this week
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Open Issues</Text>
                <Text style={{ ...(eos.open_issues > 0 ? { ...styles.tdBold, color: '#f59e0b' } : styles.tdBold), flex: 2 }}>
                  {eos.open_issues} open issue{eos.open_issues !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Aim Dental Laboratory CRM · {rep?.name} · Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadRepReportPDF(data) {
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const blob = await pdf(<RepReportDocument data={data} month={month} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (data.rep?.name || 'report').toLowerCase().replace(/\s+/g, '-')
  a.download = `${safeName}-report-${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
