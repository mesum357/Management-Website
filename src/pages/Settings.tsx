import { useState, useEffect } from "react";
import { Loader2, Save, User, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authAPI, employeeAPI } from "@/lib/api";

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getMe();
      if (response.data.success && response.data.data.user) {
        const user = response.data.data.user;
        if (user.employee) {
          setFirstName(user.employee.firstName || "");
          setLastName(user.employee.lastName || "");
          setEmployeeId(user.employee._id || user.employee.id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to load user data');
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || firstName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "First name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (!lastName || lastName.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Last name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee information not found",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await employeeAPI.update(employeeId, {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      toast({
        title: "Success",
        description: "Name updated successfully"
      });
      // Refresh user data
      await fetchUserData();
    } catch (err: any) {
      console.error('Error saving name:', err);
      setError(err.response?.data?.message || 'Failed to save name');
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save name",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your profile settings"
      />

      <div className="space-y-6">
        {/* Employee Name Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Employee Name</h2>
              <p className="text-sm text-muted-foreground">
                Update your employee name
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your name will be updated across the system
            </p>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || !firstName.trim() || !lastName.trim()}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
