import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SettingField {
  key: string;
  label: string;
  description: string;
  type: "number" | "text";
}

const SETTING_FIELDS: SettingField[] = [
  { key: "coin_base_value", label: "Coin Base Value (RWF)", description: "Starting value of 1 GOR in RWF", type: "number" },
  { key: "coin_growth_per_100_users", label: "Growth per 100 Users (RWF)", description: "How much coin value increases per 100 users", type: "number" },
  { key: "tax_pool_balance", label: "Tax Pool Balance (GOR)", description: "Current accumulated tax pool", type: "number" },
  { key: "min_users_for_trading", label: "Min Users for Trading", description: "Minimum users required to enable P2P trading", type: "number" },
  { key: "admin_access_key", label: "Admin Access Key", description: "Secondary access key for admin/founder panels", type: "text" },
];

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const settingsQuery = useQuery({
    queryKey: ["admin", "app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((r) => {
        map[r.key] = String(r.value ?? "");
      });
      return map;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setValues(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (entries: { key: string; value: string }[]) => {
      for (const entry of entries) {
        const jsonValue = isNaN(Number(entry.value)) ? entry.value : Number(entry.value);
        const { error } = await supabase
          .from("app_settings")
          .upsert({ key: entry.key, value: jsonValue as any, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Settings saved!");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "app_settings"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSaveAll = () => {
    const entries = SETTING_FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
    saveMutation.mutate(entries);
  };

  const handleSaveOne = (key: string) => {
    saveMutation.mutate([{ key, value: values[key] ?? "" }]);
  };

  if (settingsQuery.isLoading) {
    return <p className="text-center text-muted-foreground py-8">Loading settings...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display text-primary flex items-center gap-2">
            <Settings className="w-5 h-5" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SETTING_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-sm font-medium text-foreground">{field.label}</Label>
                <p className="text-[10px] text-muted-foreground">{field.description}</p>
                <Input
                  type={field.type}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="bg-muted/50 border-border"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveOne(field.key)}
                disabled={saveMutation.isPending}
                className="shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display mt-2"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save All Settings</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
