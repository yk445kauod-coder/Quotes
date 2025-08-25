import { getSettings } from "@/lib/firebase-server";
import { SettingsForm } from "@/components/settings-form";

export const revalidate = 0;

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <SettingsForm initialSettings={settings} />
        </div>
    );
}
