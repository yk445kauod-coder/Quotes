
"use client";

import { CreateDocumentForm } from "@/components/create-document-form";
import { getSettings } from "@/lib/firebase-client";
import type { SettingsData } from "@/lib/types";
import { useEffect, useState } from "react";

export default function CreatePage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  if (loading || !settings) {
    return (
       <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          جاري تحميل الإعدادات...
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        إنشاء مستند جديد
      </h1>
      <CreateDocumentForm defaultSettings={settings} />
    </div>
  );
}
