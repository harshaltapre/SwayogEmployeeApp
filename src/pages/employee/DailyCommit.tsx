import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Paperclip, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  useAttachDailyCommitFile,
  usePassDailyCommitUpward,
  useMyDailyCommitForDate,
  useMyDailyCommits,
  useSubmitDailyCommit,
} from "@/hooks/useDailyCommits";
import { buildAssetUrlFromPath } from "@/lib/api-client";

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function DailyCommitPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [commitDate, setCommitDate] = useState(todayIso());
  const [taskWorkedOn, setTaskWorkedOn] = useState("");
  const [workSummary, setWorkSummary] = useState("");
  const [hoursSpent, setHoursSpent] = useState("8");
  const [issuesBlockers, setIssuesBlockers] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const { data: existing, isLoading: loadingExisting } = useMyDailyCommitForDate(commitDate);
  const { data: history } = useMyDailyCommits();
  const submitMutation = useSubmitDailyCommit();
  const attachMutation = useAttachDailyCommitFile();
  const passMutation = usePassDailyCommitUpward();

  const alreadySubmitted = !!existing;

  useEffect(() => {
    if (existing) {
      setTaskWorkedOn(existing.taskWorkedOn);
      setWorkSummary(existing.workSummary);
      setHoursSpent(String(existing.hoursSpent));
      setIssuesBlockers(existing.issuesBlockers ?? "");
      setTomorrowPlan(existing.tomorrowPlan ?? "");
    } else if (!loadingExisting) {
      setTaskWorkedOn("");
      setWorkSummary("");
      setHoursSpent("8");
      setIssuesBlockers("");
      setTomorrowPlan("");
    }
  }, [existing, loadingExisting, commitDate]);

  const handleSubmit = async () => {
    if (alreadySubmitted) {
      toast({ title: "Already submitted", description: "You have already submitted for this date." });
      return;
    }

    const cleanTask = taskWorkedOn.trim();
    const cleanSummary = workSummary.trim();
    const parsedHours = Number(hoursSpent);

    if (cleanTask.length < 2) {
      toast({
        title: "Validation Error",
        description: "Task worked on must be at least 2 characters.",
        variant: "destructive",
      });
      return;
    }

    if (cleanSummary.length < 10) {
      toast({
        title: "Validation Error",
        description: "Work Summary must be at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parsedHours) || parsedHours < 0.25 || parsedHours > 24) {
      toast({
        title: "Validation Error",
        description: "Hours spent must be between 0.25 and 24.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await submitMutation.mutateAsync({
        commitDate,
        taskWorkedOn: cleanTask,
        workSummary: cleanSummary,
        hoursSpent: parsedHours,
        issuesBlockers: issuesBlockers.trim() || undefined,
        tomorrowPlan: tomorrowPlan.trim() || undefined,
      });

      if (attachment) {
        await attachMutation.mutateAsync({ id: created.id, file: attachment });
      }

      setSubmittedId(created.id);
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";

      toast({
        title: "Daily commit submitted",
        description: "Admins and your reporting chain can now view this report.",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Unable to submit daily commit";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    }
  };

  const handlePassUpward = async () => {
    if (!existing?.id) return;
    try {
      const result = await passMutation.mutateAsync({ id: existing.id });
      toast({
        title: result.status === "already_passed" ? "Already passed" : "Report passed upward",
        description:
          result.status === "already_passed"
            ? "This report was already passed previously."
            : "Head, admin and super admin recipients have been notified.",
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Unable to pass report upward";
      toast({ title: "Pass failed", description: message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <SidebarLayout>
      <div className="flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
        <div className="text-center space-y-1 mt-4">
          <h1 className="text-2xl font-bold text-slate-900">Daily Commit</h1>
          <p className="text-slate-500 text-sm">Timesheet & Work Log</p>
        </div>

        {!user?.reportingManagerId && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">No reporting manager assigned</p>
                <p className="text-sm text-amber-800 mt-1">
                  You can still submit daily commits. Admins will receive and store this report in the database.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {alreadySubmitted && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex gap-3 items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">Submitted for {commitDate}</p>
                <p className="text-sm text-emerald-800">
                  Submitted at {new Date(existing!.submittedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <Button
                className="ml-auto"
                variant="secondary"
                onClick={handlePassUpward}
                disabled={passMutation.isPending}
              >
                {passMutation.isPending ? "Passing..." : "Pass To Head/Admin"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl shadow-slate-200/40 border-slate-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Submit Daily Commit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="commitDate" className="font-semibold text-slate-700">Date</Label>
              <Input
                id="commitDate"
                type="date"
                value={commitDate}
                max={todayIso()}
                onChange={(e) => setCommitDate(e.target.value)}
                disabled={alreadySubmitted}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskWorkedOn" className="font-semibold text-slate-700">Task Worked On</Label>
              <Input
                id="taskWorkedOn"
                placeholder="e.g. Site inspection at Pune plant"
                value={taskWorkedOn}
                onChange={(e) => setTaskWorkedOn(e.target.value)}
                disabled={alreadySubmitted}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workSummary" className="font-semibold text-slate-700">Work Summary</Label>
              <Textarea
                id="workSummary"
                rows={4}
                placeholder="Describe what you accomplished today..."
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                disabled={alreadySubmitted}
                className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursSpent" className="font-semibold text-slate-700">Hours Spent (Decimal)</Label>
              <Input
                id="hoursSpent"
                type="number"
                min={0.25}
                max={24}
                step={0.25}
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                disabled={alreadySubmitted}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuesBlockers" className="font-semibold text-slate-700">Issues / Blockers</Label>
              <Textarea
                id="issuesBlockers"
                rows={2}
                placeholder="Optional — any blockers you faced"
                value={issuesBlockers}
                onChange={(e) => setIssuesBlockers(e.target.value)}
                disabled={alreadySubmitted}
                className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tomorrowPlan" className="font-semibold text-slate-700">Goal for Tomorrow</Label>
              <Textarea
                id="tomorrowPlan"
                rows={2}
                placeholder="What you plan to work on next"
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                disabled={alreadySubmitted}
                className="rounded-xl border-slate-200 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            {!alreadySubmitted && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label htmlFor="attachment" className="font-semibold text-slate-700">Attachment (optional)</Label>
                <div className="relative">
                  <Input
                    id="attachment"
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 file:border-0 file:bg-slate-200 file:text-slate-700 file:font-semibold file:rounded-lg file:px-4 file:mr-4 file:py-1 file:-ml-2 pt-2"
                  />
                </div>
                {attachment && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
                    <Paperclip className="h-3 w-3" />
                    {attachment.name}
                  </p>
                )}
              </div>
            )}

            {existing?.attachmentUrl && (
              <p className="text-sm">
                <a
                  href={buildAssetUrlFromPath(existing.attachmentUrl) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Paperclip className="h-4 w-4" /> View Attachment
                </a>
              </p>
            )}

            {!alreadySubmitted && (
              <Button
                className="w-full h-14 rounded-xl text-lg font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 mt-4"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || attachMutation.isPending}
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit Timesheet
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {history && history.length > 0 && (
          <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50/50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.commitDate}</p>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.taskWorkedOn}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-1">
                    {item.hoursSpent}h
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {submittedId && (
          <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-mono">
            ID: {submittedId.slice(0, 8)}
          </p>
        )}
      </div>
    </SidebarLayout>
  );
}
