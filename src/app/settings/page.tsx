import { SettingsClient } from "@/components/settings-client";

export default function SettingsPage() {
  return (
    <div className="container relative flex flex-col py-8">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-wider">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage application data through import, export, and other actions.
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
