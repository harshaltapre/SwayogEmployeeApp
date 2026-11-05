import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompanyAlarmPolicy,
  useUpdateAlarmPolicy,
  useCompanyRingtones,
  useUploadRingtone,
  useDeleteRingtone,
  CompanyAlarmPolicy,
} from "@/hooks/useAttendance";
import { BellRing, Music, Trash2, Upload, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin controls for the employee attendance alarm feature:
 * company reminder times/toggles, default personal alarm time, policy note,
 * and company ringtone upload/management (stored in R2 object storage).
 * Reporting time & working days stay in the Shift Rules card above.
 */
export function AttendanceAlarmPolicyCard() {
  const { data, isLoading } = useCompanyAlarmPolicy();
  const { data: ringtones = [] } = useCompanyRingtones();
  const updatePolicy = useUpdateAlarmPolicy();
  const uploadRingtone = useUploadRingtone();
  const deleteRingtone = useDeleteRingtone();

  const [form, setForm] = useState<Partial<CompanyAlarmPolicy>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (data?.policy) {
      setForm({
        prepReminderTime: data.policy.prepReminderTime,
        prepReminderEnabled: data.policy.prepReminderEnabled,
        finalReminderTime: data.policy.finalReminderTime,
        finalReminderEnabled: data.policy.finalReminderEnabled,
        personalDefaultTime: data.policy.personalDefaultTime,
        policyNote: data.policy.policyNote ?? "",
      });
    }
  }, [data?.policy]);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  };

  const preview = (id: string, url?: string | null) => {
    if (!url) return;
    if (playingId === id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setError("Could not play this ringtone"));
    audioRef.current = audio;
    setPlayingId(id);
  };

  const handleUpload = async (file: File) => {
    setError("");
    setMessage("");
    try {
      await uploadRingtone.mutateAsync({ file, name: file.name });
      setMessage("Ringtone uploaded successfully.");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Upload failed");
    }
  };

  const handleSave = async () => {
    setError("");
    setMessage("");
    try {
      await updatePolicy.mutateAsync({
        prepReminderTime: form.prepReminderTime,
        prepReminderEnabled: form.prepReminderEnabled,
        finalReminderTime: form.finalReminderTime,
        finalReminderEnabled: form.finalReminderEnabled,
        personalDefaultTime: form.personalDefaultTime,
        policyNote: form.policyNote,
      });
      setMessage("Alarm policy saved. Employees will see the update on next sync.");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to save policy");
    }
  };

  const Toggle = ({ checked, onChange }: { checked?: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
      )}
    >
      <span className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-5" : "translate-x-1"
      )} />
    </button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading alarm policy…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border bg-slate-50/40">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" /> Attendance Alarm Policy
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Company-controlled reminders pushed to the Android employee app. Reporting time and working days are managed in Shift Rules above.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {message && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Preparation Reminder</label>
            <div className="flex items-center gap-3">
              <Toggle
                checked={form.prepReminderEnabled}
                onChange={(v) => setForm((f) => ({ ...f, prepReminderEnabled: v }))}
              />
              <Input
                type="time"
                value={form.prepReminderTime ?? "10:00"}
                onChange={(e) => setForm((f) => ({ ...f, prepReminderTime: e.target.value }))}
                className="max-w-[140px]"
                disabled={!form.prepReminderEnabled}
              />
            </div>
            <p className="text-xs text-slate-500">Advance notice before reporting time (default 10:00 AM).</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Final Reminder</label>
            <div className="flex items-center gap-3">
              <Toggle
                checked={form.finalReminderEnabled}
                onChange={(v) => setForm((f) => ({ ...f, finalReminderEnabled: v }))}
              />
              <Input
                type="time"
                value={form.finalReminderTime ?? "10:15"}
                onChange={(e) => setForm((f) => ({ ...f, finalReminderTime: e.target.value }))}
                className="max-w-[140px]"
                disabled={!form.finalReminderEnabled}
              />
            </div>
            <p className="text-xs text-slate-500">Last call before the reporting cutoff (default 10:15 AM).</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Default Personal Alarm</label>
            <Input
              type="time"
              value={form.personalDefaultTime ?? "09:30"}
              onChange={(e) => setForm((f) => ({ ...f, personalDefaultTime: e.target.value }))}
              className="max-w-[140px]"
            />
            <p className="text-xs text-slate-500">Suggested wake-up time for new employees.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Policy Note (shown in app)</label>
            <Input
              value={form.policyNote ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, policyNote: e.target.value }))}
              placeholder="e.g. Plan commute for peak traffic"
              maxLength={120}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" /> Company Ringtones
              </h4>
              <p className="text-xs text-slate-500">
                Audio files (MP3/WAV/OGG/M4A, max 20MB) uploaded to cloud storage and selectable inside the employee alarm screen.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadRingtone.isPending}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              {uploadRingtone.isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>

          {ringtones.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No company ringtones uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {ringtones.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-slate-50/60 dark:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.mimeType || "audio"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => preview(r.id, r.url)}
                      title={playingId === r.id ? "Stop" : "Play"}
                    >
                      {playingId === r.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRingtone.mutate(r.id)}
                      disabled={deleteRingtone.isPending}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-6">
          <Button onClick={handleSave} disabled={updatePolicy.isPending}>
            {updatePolicy.isPending ? "Saving…" : "Save Alarm Policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
