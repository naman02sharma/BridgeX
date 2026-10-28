"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useGlobalTranslation } from "@/components/translation-provider"

interface TestResult {
  table: string
  status: 'pending' | 'success' | 'error'
  message: string
  count?: number
}

export function DatabaseTestPanel() {
  const { t } = useGlobalTranslation()
  const [testResults, setTestResults] = useState<TestResult[]>([
    { table: 'profiles', status: 'pending', message: 'Testing...' },
    { table: 'alerts', status: 'pending', message: 'Testing...' },
    { table: 'responders', status: 'pending', message: 'Testing...' },
    { table: 'responder_locations', status: 'pending', message: 'Testing...' },
    { table: 'notifications', status: 'pending', message: 'Testing...' },
    { table: 'chat_messages', status: 'pending', message: 'Testing...' }
  ])

  const [isTesting, setIsTesting] = useState(false)

  const updateTestResult = (table: string, status: 'success' | 'error', message: string, count?: number) => {
    setTestResults(prev => prev.map(result =>
      result.table === table
        ? { ...result, status, message, count }
        : result
    ))
  }

  const testTable = async (tableName: string) => {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        updateTestResult(tableName, 'error', `Error: ${error.message}`)
        return false
      }

      updateTestResult(tableName, 'success', `Accessible (${count || 0} records)`, count || 0)
      return true
    } catch (error) {
      updateTestResult(tableName, 'error', `Exception: ${error}`)
      return false
    }
  }

  const testAllTables = async () => {
    setIsTesting(true)

    const tables = ['profiles', 'alerts', 'responders', 'responder_locations', 'notifications', 'chat_messages']

    for (const table of tables) {
      await testTable(table)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsTesting(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('dashboard.databaseTablesTest', 'Database Tables Test')}</h3>
        <Button
          onClick={testAllTables}
          disabled={isTesting}
          variant="outline"
        >
          {isTesting ? t('dashboard.testing', 'Testing...') : t('dashboard.testDatabase', 'Test Database')}
        </Button>
      </div>

      <div className="space-y-3">
        {testResults.map((result) => (
          <div
            key={result.table}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              {result.status === 'pending' && <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />}
              <div>
                <div className="font-medium text-sm">{result.table}</div>
                <div className="text-xs text-muted-foreground">{result.message}</div>
              </div>
            </div>
            {result.count !== undefined && (
              <Badge variant="secondary">
                {result.count}
              </Badge>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Setup Required:</strong> If tables are missing, run the SQL migration in your Supabase dashboard.
          See <code>supabase-migration.sql</code> and <code>setup-database.sh</code> for instructions.
        </p>
      </div>
    </Card>
  )
}