import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Shield } from "lucide-react"

export function SecurityTab({ userData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Manage your account security settings and verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{userData.email}</p>
                </div>
              </div>
              <Badge variant={userData.emailVerified ? "default" : "secondary"}>
                {userData.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>

            {userData.mobile && (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">{userData.mobile}</p>
                  </div>
                </div>
                {userData.mobileVerified ? (
                  <Badge variant="default">Verified</Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Verify
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
