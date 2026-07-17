import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Paperclip, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
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

export default function SubAdminDailyCommitPage() {
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
        title: alreadySubmitted ? "Daily commit updated" : "Daily commit submitted",
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
    <SubAdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Daily Commit"
          description="Record what you worked on today. This feeds monthly performance reports for your team."
        />

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit Daily Commit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alreadySubmitted && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Daily commit for this date has already been submitted and saved. You can edit the fields below and click &quot;Update Daily Commit&quot; to update it.</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="commitDate">Date</Label>
              <Input
                id="commitDate"
                type="date"
                value={commitDate}
                max={todayIso()}
                onChange={(e) => setCommitDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskWorkedOn">Task Worked On</Label>
              <Input
                id="taskWorkedOn"
                value={taskWorkedOn}
                onChange={(e) => setTaskWorkedOn(e.target.value)}
                placeholder="e.g. Completed AMC visit at Abhyankar site / Panel cleaning"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workSummary">Work Summary</Label>
              <Textarea
                id="workSummary"
                rows={4}
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder="Describe details of work done, achievements, or milestones (minimum 10 characters)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursSpent">Hours Spent</Label>
              <Input
                id="hoursSpent"
                type="number"
                min={0.25}
                max={24}
                step={0.25}
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuesBlockers">Issues / Blockers</Label>
              <Textarea
                id="issuesBlockers"
                rows={2}
                value={issuesBlockers}
                onChange={(e) => setIssuesBlockers(e.target.value)}
                placeholder="Mention any issues, blockers, or help needed (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tomorrowPlan">Tomorrow&apos;s Plan</Label>
              <Textarea
                id="tomorrowPlan"
                rows={2}
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="What tasks or priorities do you plan to work on tomorrow? (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <Input
                id="attachment"
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
              {attachment && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {attachment.name}
                </p>
              )}
            </div>

            {existing?.attachmentUrl && (
              <p className="text-sm">
                <a
                  href={buildAssetUrlFromPath(existing.attachmentUrl) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  View attachment
                </a>
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || attachMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitMutation.isPending
                ? "Submitting..."
                : alreadySubmitted
                ? "Update Daily Commit"
                : "Submit Daily Commit"}
            </Button>
          </CardContent>
        </Card>

        {history && history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.commitDate}</p>
                    <p className="text-sm text-slate-600 line-clamp-2">{item.workSummary}</p>
                  </div>
                  <Badge variant="secondary">{item.hoursSpent}h</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {submittedId && (
          <p className="text-xs text-center text-muted-foreground">
            Commit ID: {submittedId.slice(0, 8)}…
          </p>
        )}
      </div>
    </SubAdminLayout>
  );
}
