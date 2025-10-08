import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/services/businessApi';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Lock, 
  Download, 
  RefreshCw,
  UserX,
  Clock,
  Globe,
  Monitor,
  Key,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import type { ActivityLog, SecurityLog, Session } from '@/types';
import { formatDate } from '@/utils/formatters';

export function SecurityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activityFilters, setActivityFilters] = useState({
    action: 'all',
    timeRange: '24h',
    search: '',
  });
  const [securityFilters, setSecurityFilters] = useState({
    type: 'all',
    timeRange: '24h',
    search: '',
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const queryClient = useQueryClient();

  // Security overview data
  const { data: securityOverview } = useQuery({
    queryKey: ['security-overview'],
    queryFn: () => adminApi.getSecurityOverview(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes instead of 30 seconds
    refetchOnWindowFocus: false, // Disable refetch on window focus
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Activity logs
  const { data: activityLogs, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-logs', activityFilters],
    queryFn: () => adminApi.getActivityLogs(activityFilters),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes instead of 15 seconds
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });

  // Security logs  
  const { data: securityLogs, isLoading: securityLoading } = useQuery({
    queryKey: ['security-logs', securityFilters],
    queryFn: () => adminApi.getSecurityLogs(securityFilters),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes instead of 15 seconds
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });

  // Active sessions
  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => adminApi.getActiveSessions(),
    refetchInterval: 3 * 60 * 1000, // Refresh every 3 minutes instead of 30 seconds
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });

  // Security settings
  const { data: securitySettings } = useQuery({
    queryKey: ['security-settings'],
    queryFn: () => adminApi.getSecuritySettings(),
  });

  // Update last refreshed time
  useEffect(() => {
    setLastUpdated(new Date());
  }, [securityOverview, activityLogs, securityLogs]);

  // Mutations for security actions
  const blockIpMutation = useMutation({
    mutationFn: (ip: string) => adminApi.blockIpAddress(ip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-logs'] });
      queryClient.invalidateQueries({ queryKey: ['security-overview'] });
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => adminApi.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    },
  });

  // Handle manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['security-overview'] });
    queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    queryClient.invalidateQueries({ queryKey: ['security-logs'] });
    queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    setLastUpdated(new Date());
  };

  // Security metrics
  const securityMetrics = securityOverview?.data || {
    totalFailedLogins: 0,
    suspiciousActivities: 0,
    blockedIps: 0,
    activeSessions: 0,
    criticalAlerts: 0,
    riskScore: 0,
  };

  const getSecurityStatusColor = (score: number) => {
    if (score >= 80) return 'text-error bg-error-lighter';
    if (score >= 60) return 'text-warning bg-warning-lighter';
    if (score >= 40) return 'text-warning bg-warning-lighter';
    return 'text-success bg-success-lighter';
  };

  const getSecurityStatusText = (score: number) => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'Low Risk';
    return 'Secure';
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'failed_login': return 'bg-error-light text-error';
      case 'suspicious_activity': return 'bg-warning-light text-orange-800';
      case 'access_denied': return 'bg-warning-light text-warning';
      case 'token_expired': return 'bg-primary-light text-primary';
      default: return 'bg-muted text-foreground';
    }
  };

  const getActionTypeColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-success-light text-success';
    if (action.includes('delete') || action.includes('remove')) return 'bg-error-light text-error';
    if (action.includes('update') || action.includes('edit')) return 'bg-primary-light text-primary';
    if (action.includes('login') || action.includes('auth')) return 'bg-info-light text-purple-800';
    return 'bg-muted text-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Center
          </h1>
          <p className="text-muted-foreground">
            Monitor security events, manage access controls, and protect your system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">Live monitoring</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={`px-2 py-1 rounded-full text-sm ${getSecurityStatusColor(securityMetrics.riskScore)}`}>
                {getSecurityStatusText(securityMetrics.riskScore)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Risk Score: {securityMetrics.riskScore}/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalFailedLogins}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Monitor className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.blockedIps}</div>
            <p className="text-xs text-muted-foreground">Threat mitigation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity-logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="security-logs">Security Logs</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Recent Security Alerts
                </CardTitle>
                <CardDescription>Latest security incidents and threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(securityLogs?.data || []).slice(0, 5).map((log: SecurityLog) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <div>
                          <p className="font-medium">{log.event}</p>
                          <p className="text-sm text-muted-foreground">{log.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={getLogTypeColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!securityLogs?.data || securityLogs.data.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No security alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest user actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(activityLogs?.data || []).slice(0, 5).map((log: ActivityLog) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getActionTypeColor(log.action)}>
                          {log.details}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!activityLogs?.data || activityLogs.data.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activities</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>Monitor user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="activity-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="activity-search"
                      placeholder="Search activities..."
                      value={activityFilters.search}
                      onChange={(e) => setActivityFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="action-type-select">Action Type</Label>
                  <Select 
                    value={activityFilters.action} 
                    onValueChange={(value) => setActivityFilters(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger id="action-type-select" className="w-40">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time-range-select">Time Range</Label>
                  <Select 
                    value={activityFilters.timeRange} 
                    onValueChange={(value) => setActivityFilters(prev => ({ ...prev, timeRange: value }))}
                  >
                    <SelectTrigger id="time-range-select" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last week</SelectItem>
                      <SelectItem value="30d">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Activity Logs Table */}
              <div className="space-y-2">
                {activityLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  (activityLogs?.data || []).map((log: ActivityLog) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Activity className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.user} • {log.details}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className={getActionTypeColor(log.action)}>
                            {log.action}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {log.ipAddress && <span className="inline-flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(log.timestamp)}</p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="security-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error" />
                Security Logs
              </CardTitle>
              <CardDescription>Monitor security incidents and threats</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="security-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="security-search"
                      placeholder="Search security events..."
                      value={securityFilters.search}
                      onChange={(e) => setSecurityFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="event-type-select">Event Type</Label>
                  <Select 
                    value={securityFilters.type} 
                    onValueChange={(value) => setSecurityFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="event-type-select" className="w-44">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All events</SelectItem>
                      <SelectItem value="failed_login">Failed Login</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="access_denied">Access Denied</SelectItem>
                      <SelectItem value="token_expired">Token Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Range</Label>
                  <Select 
                    value={securityFilters.timeRange} 
                    onValueChange={(value) => setSecurityFilters(prev => ({ ...prev, timeRange: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last week</SelectItem>
                      <SelectItem value="30d">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Security Logs Table */}
              <div className="space-y-2">
                {securityLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  (securityLogs?.data || []).map((log: SecurityLog) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-4 w-4 text-error" />
                        <div>
                          <p className="font-medium">{log.event}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.source} • {log.details}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={getLogTypeColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          {log.source && (
                            <div className="mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => blockIpMutation.mutate(log.source)}
                                disabled={blockIpMutation.isPending}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Block IP
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDate(log.timestamp)}</p>
                          <p className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage active user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(activeSessions?.data?.sessions || []).map((session: Session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Monitor className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{session.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.ipAddress} • {session.userAgent}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Active for {session.duration || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {formatDate(session.lastActivity)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => terminateSessionMutation.mutate(session.id)}
                        disabled={terminateSessionMutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Terminate
                      </Button>
                    </div>
                  </div>
                ))}
                {(!activeSessions?.data?.sessions || activeSessions.data.sessions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password Policy
                </CardTitle>
                <CardDescription>Configure password requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="min-length">Minimum Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    className="w-20"
                    defaultValue={securitySettings?.data?.passwordPolicy?.minLength || 8}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-uppercase">Require Uppercase</Label>
                  <Switch
                    id="require-uppercase"
                    defaultChecked={securitySettings?.data?.passwordPolicy?.requireUppercase}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-numbers">Require Numbers</Label>
                  <Switch
                    id="require-numbers"
                    defaultChecked={securitySettings?.data?.passwordPolicy?.requireNumbers}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-symbols">Require Symbols</Label>
                  <Switch
                    id="require-symbols"
                    defaultChecked={securitySettings?.data?.passwordPolicy?.requireSymbols}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Authentication Settings
                </CardTitle>
                <CardDescription>Configure authentication options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-2fa">Enable 2FA</Label>
                  <Switch
                    id="enable-2fa"
                    defaultChecked={securitySettings?.data?.authentication?.enable2FA}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    className="w-20"
                    defaultValue={securitySettings?.data?.authentication?.sessionTimeout || 60}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    className="w-20"
                    defaultValue={securitySettings?.data?.authentication?.maxLoginAttempts || 5}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockout-duration"
                    type="number"
                    className="w-20"
                    defaultValue={securitySettings?.data?.authentication?.lockoutDuration || 15}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Save Security Settings</CardTitle>
              <CardDescription>Apply changes to security configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Update Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
