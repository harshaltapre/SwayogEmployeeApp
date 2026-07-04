import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, IndianRupee, Camera, MapPin, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomerRatingWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: number;
    jobType: string;
    description: string;
    customerName: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
    beforeLatitude?: number;
    beforeLongitude?: number;
    afterLatitude?: number;
    afterLongitude?: number;
  } | null;
  onSubmitRating: (data: {
    taskId: number;
    rating: number;
    feedback: string;
    fixCharges: number;
  }) => void;
}

export function CustomerRatingWorkflow({ 
  open, 
  onOpenChange, 
  task, 
  onSubmitRating 
}: CustomerRatingWorkflowProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [fixCharges, setFixCharges] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = () => {
    if (!task) return;
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a star rating for the service.",
        variant: "destructive",
      });
      return;
    }

    if (!fixCharges || parseFloat(fixCharges) <= 0) {
      toast({
        title: "Fix Charges Required",
        description: "Please enter the fix charges amount.",
        variant: "destructive",
      });
      return;
    }

    onSubmitRating({
      taskId: task.id,
      rating,
      feedback: feedback.trim(),
      fixCharges: parseFloat(fixCharges),
    });

    // Reset form
    setRating(0);
    setFeedback("");
    setFixCharges("");
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Service & Provide Payment</DialogTitle>
          <DialogDescription>
            Please rate the completed service and provide the fix charges amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2">{task.description}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">{task.jobType}</span>
              <span>•</span>
              <span>{task.customerName}</span>
            </div>
          </div>

          {/* Work Photos */}
          <div>
            <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Work Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {task.beforeImageUrl && (
                <div className="relative">
                  <img 
                    src={task.beforeImageUrl} 
                    alt="Before work" 
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Before
                  </div>
                  {task.beforeLatitude && task.beforeLongitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${task.beforeLatitude},${task.beforeLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Location
                    </a>
                  )}
                </div>
              )}
              {task.afterImageUrl && (
                <div className="relative">
                  <img 
                    src={task.afterImageUrl} 
                    alt="After work" 
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    After
                  </div>
                  {task.afterLatitude && task.afterLongitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${task.afterLatitude},${task.afterLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Location
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <Label className="text-base font-semibold">Service Rating</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm font-medium text-slate-600 ml-2">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with the service..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Fix Charges */}
          <div>
            <Label htmlFor="fixCharges" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Fix Charges Amount (INR)
            </Label>
            <Input
              id="fixCharges"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter the amount you paid for the fix"
              value={fixCharges}
              onChange={(e) => setFixCharges(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              This amount will be recorded in the finance database for tracking purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Submit Rating & Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
