import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Dashboard from '@/components/Dashboard'
import Summary from '@/components/Summary'
import Settings from '@/components/Settings'
import { Calendar, BarChart3, Settings as SettingsIcon, Activity } from 'lucide-react'

function App() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [singleDayData, setSingleDayData] = useState(null)
  const [multiDayData, setMultiDayData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('settings')
  const [config, setConfig] = useState({ decryptionKey: '', employeeId: '' })

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    setLoading(true)

    try {
      // Load config first to check if settings are configured
      const configResult = await window.electronAPI.getConfig()
      if (configResult.success && configResult.config) {
        setConfig({
          decryptionKey: configResult.config.decryptionKey || '',
          employeeId: configResult.config.employeeId || ''
        })
      }

      // Discover and export database
      await window.electronAPI.discoverDatabase()
      await window.electronAPI.exportToJson()

      // Load available dates
      const result = await window.electronAPI.getAvailableDates()
      if (result.success && result.dates) {
        setDates(result.dates)
        if (result.dates.length > 0) {
          // Select the most recent date by default
          const mostRecent = result.dates[result.dates.length - 1]
          setSelectedDate(mostRecent)
          await loadSingleDayData(mostRecent)
          await loadMultiDayData(result.dates)
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
    }

    setLoading(false)
  }

  const loadSingleDayData = async (date: string) => {
    console.log('[App] loadSingleDayData called with date:', date)
    const result = await window.electronAPI.analyzeSingleDate(date)
    console.log('[App] analyzeSingleDate result:', result)
    if (result.success && result.data) {
      setSingleDayData(result.data)
      console.log('[App] Single day data set:', result.data)
    } else {
      console.error('[App] Failed to load single day data:', result.error)
    }
  }

  const loadMultiDayData = async (datesToAnalyze: string[]) => {
    console.log('[App] loadMultiDayData called with dates:', datesToAnalyze)
    const result = await window.electronAPI.analyzeMultiDate(datesToAnalyze)
    console.log('[App] analyzeMultiDate result:', result)
    if (result.success && result.data) {
      setMultiDayData(result.data)
      console.log('[App] Multi day data set:', result.data)
    } else {
      console.error('[App] Failed to load multi day data:', result.error)
    }
  }

  const handleDateSelect = async (date: string) => {
    console.log('[App] handleDateSelect called with date:', date)
    setSelectedDate(date)
    await loadSingleDayData(date)
  }

  const handleConfigUpdate = async () => {
    await initializeApp()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <Activity className="w-16 h-16 mx-auto animate-pulse text-primary" />
          <p className="text-xl text-muted-foreground">Loading ActivityTracker data...</p>
        </div>
      </div>
    )
  }

  // Check if required config is set
  const isConfigured = config.decryptionKey.trim() !== '' && config.employeeId.trim() !== ''

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Activity className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold">Activity Tracker Analysis</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-md ${isConfigured ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger key="settings" value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </TabsTrigger>
            {isConfigured && (
              <>
                <TabsTrigger key="summary" value="summary" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger key="dashboard" value="dashboard" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Daily Analysis
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Settings onConfigUpdate={handleConfigUpdate} onTabChange={setActiveTab} />
          </TabsContent>

          {isConfigured && activeTab === 'dashboard' && dates.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Select Date:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dates.map((date) => {
                    // Parse date - handle both YYYY-MM-DD and other formats
                    const dateObj = new Date(date + 'T00:00:00')
                    const isValidDate = !isNaN(dateObj.getTime())

                    return (
                      <Button
                        key={date}
                        variant={selectedDate === date ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDateSelect(date)}
                      >
                        {isValidDate ? dateObj.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) : date}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {isConfigured && (
            <>
              <TabsContent value="dashboard" className="space-y-4">
                <Dashboard selectedDate={selectedDate} analysisData={singleDayData} />
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Summary dates={dates} multiDayData={multiDayData} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default App
