import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database,
  Bell,
  User,
  Key,
  Download,
  Trash
} from "lucide-react"

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and LGPD compliance
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input defaultValue="EventVision Analytics" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Email</label>
              <Input defaultValue="admin@eventvision.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Producer Name</label>
              <Input defaultValue="João Silva" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input defaultValue="+55 11 99999-9999" className="mt-1" />
            </div>
          </div>
          <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* LGPD Compliance */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            LGPD Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Marketing Consent Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Track customer marketing consent for all communications
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Data Pseudonymization</p>
                <p className="text-sm text-muted-foreground">
                  Automatically pseudonymize personal data in exports
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Retention Policy</p>
                <p className="text-sm text-muted-foreground">
                  Automatically remove inactive customer data after 24 months
                </p>
              </div>
              <Switch />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Data Export & Removal</h4>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </Button>
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                <Trash className="w-4 h-4" />
                Request Data Deletion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">ML Job Completion</p>
              <p className="text-sm text-muted-foreground">
                Get notified when segmentation and pricing jobs complete
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Import Alerts</p>
              <p className="text-sm text-muted-foreground">
                Notifications for data import success/errors
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">System Maintenance</p>
              <p className="text-sm text-muted-foreground">
                Alerts about scheduled maintenance and updates
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* ML Model Settings */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            ML Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Segmentation Clusters (K)</label>
              <Input type="number" defaultValue="4" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Number of customer segments to generate
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Churn Threshold (days)</label>
              <Input type="number" defaultValue="60" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Days of inactivity before considering churn risk
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Recommendation Count</label>
              <Input type="number" defaultValue="10" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Number of event recommendations per customer
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Model Retrain Threshold</label>
              <Input defaultValue="10%" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Data change percentage to trigger model retraining
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
              Save ML Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API & Integrations */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API & Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <div className="flex gap-2 mt-1">
              <Input 
                type="password" 
                defaultValue="evapi_1234567890abcdef" 
                className="flex-1" 
                readOnly
              />
              <Button variant="outline">Regenerate</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this key to access the EventVision API programmatically
            </p>
          </div>
          
          <div className="pt-4">
            <h4 className="font-medium mb-3">Available Integrations</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                <div>
                  <p className="font-medium">Webhook Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time notifications via webhooks
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                <div>
                  <p className="font-medium">CSV Auto-Import</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically import data from cloud storage
                  </p>
                </div>
                <Button variant="outline" size="sm">Setup</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings