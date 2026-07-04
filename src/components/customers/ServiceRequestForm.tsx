import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { serviceRequestsAPI } from "@/lib/backend-api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function ServiceRequestForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || typeof user.id !== 'number') return;
    
    setIsSubmitting(true);
    try {
      await serviceRequestsAPI.create({
        customerId: user.id,
        title,
        description
      });
      toast({
        title: "Request Submitted",
        description: "Your service request has been received successfully.",
      });
      setTitle("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Title</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Inverter Fault, Panel Cleaning" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the issue in detail..." 
              className="min-h-[120px]"
              required 
            />
          </div>
          <Button type="submit" className="w-full gradient-bg text-white" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Service Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
