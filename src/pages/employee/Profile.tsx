import { useState, useRef } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Edit2, Upload, Mail, Phone, Briefcase, Calendar, Shield, Camera, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joinDate: string;
  profilePhoto: string;
  designation: string;
  employeeId: string;
  address: string;
  emergencyContact: string;
}

function getEmployeeStorageKey(employeeId: string): string {
  return `employee_profile_${employeeId}`;
}

function getEmployeePhotoStorageKey(employeeId: string): string {
  return `employee_profile_photo_${employeeId}`;
}

function createDefaultProfile(user: { id: string | number; name: string; email?: string; employeeCode?: string | null }): EmployeeProfile {
  return {
    id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
    name: user.name,
    email: user.email || "",
    phone: "",
    role: "employee",
    department: "",
    joinDate: new Date().toISOString().split("T")[0],
    profilePhoto: "",
    designation: "",
    employeeId: user.employeeCode || String(user.id),
    address: "",
    emergencyContact: "",
  };
}

function loadProfileData(employeeId: string, user: any): EmployeeProfile {
  let profile = createDefaultProfile(user);
  try {
    const stored = localStorage.getItem(getEmployeeStorageKey(employeeId));
    if (stored) {
      profile = JSON.parse(stored);
    }
  } catch {}
  
  if (user?.employeeCode) {
    profile.employeeId = user.employeeCode;
  }
  return profile;
}

function saveProfileData(employeeId: string, profileData: EmployeeProfile) {
  localStorage.setItem(getEmployeeStorageKey(employeeId), JSON.stringify(profileData));
}

function loadProfilePhoto(employeeId: string): string {
  try {
    const stored = localStorage.getItem(getEmployeePhotoStorageKey(employeeId));
    return stored || "";
  } catch {
    return "";
  }
}

function saveProfilePhoto(employeeId: string, photoData: string) {
  localStorage.setItem(getEmployeePhotoStorageKey(employeeId), photoData);
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(loadProfilePhoto(String(user.id)));
  const [profile, setProfile] = useState<EmployeeProfile>(() => {
    const loaded = loadProfileData(String(user.id), user);
    return {
      ...loaded,
      profilePhoto: loadProfilePhoto(String(user.id)),
    };
  });

  const [editData, setEditData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const photoData = reader.result as string;
      setProfilePhoto(photoData);
      setEditData({ ...editData, profilePhoto: photoData });
      saveProfilePhoto(String(user.id), photoData);

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleEditChange = (field: keyof EmployeeProfile, value: string) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setProfile(editData);
      saveProfileData(String(user.id), editData);
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const displayPhoto = isEditing ? editData.profilePhoto : profile.profilePhoto;

  return (
    <SidebarLayout>
      <PageHeader title="My Profile" description="View and manage your employee profile information." />

      <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-3 md:gap-6 md:mb-8">
        {/* Profile Photo Card */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 p-4 md:p-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-slate-200 shadow-lg sm:h-40 sm:w-40">
                {displayPhoto && <AvatarImage src={displayPhoto} alt={profile.name} />}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                  {profile.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            )}

            <div className="text-center w-full">
              <p className="text-sm font-semibold text-slate-700">{profile.name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile.designation}</p>
              <p className="text-xs text-slate-400 mt-1">{profile.employeeId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">Personal Information</CardTitle>
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditData(profile);
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-slate-600 mb-1 block">First Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.name.split(" ")[0] || ""}
                      onChange={(e) => handleEditChange("name", e.target.value + " " + (editData.name.split(" ")[1] || ""))}
                      className="text-sm"
                    />
                  ) : (
                    <div className="text-sm text-slate-700 font-medium">{profile.name.split(" ")[0]}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 mb-1 block">Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.name.split(" ").slice(1).join(" ") || ""}
                      onChange={(e) => handleEditChange("name", editData.name.split(" ")[0] + " " + e.target.value)}
                      className="text-sm"
                    />
                  ) : (
                    <div className="text-sm text-slate-700 font-medium">{profile.name.split(" ").slice(1).join(" ")}</div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email Address
                </Label>
                {isEditing ? (
                  <Input value={editData.email} onChange={(e) => handleEditChange("email", e.target.value)} className="text-sm" />
                ) : (
                  <div className="text-sm text-slate-700">{profile.email}</div>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Phone Number
                </Label>
                {isEditing ? (
                  <Input value={editData.phone} onChange={(e) => handleEditChange("phone", e.target.value)} className="text-sm" />
                ) : (
                  <div className="text-sm text-slate-700">{profile.phone}</div>
                )}
              </div>

              {/* Address */}
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Address</Label>
                {isEditing ? (
                  <Input value={editData.address} onChange={(e) => handleEditChange("address", e.target.value)} className="text-sm" />
                ) : (
                  <div className="text-sm text-slate-700">{profile.address}</div>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1 block">Emergency Contact</Label>
                {isEditing ? (
                  <Input
                    value={editData.emergencyContact}
                    onChange={(e) => handleEditChange("emergencyContact", e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <div className="text-sm text-slate-700">{profile.emergencyContact}</div>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveChanges} disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">Employment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-semibold text-slate-600">Employee ID</Label>
              </div>
              <div className="text-sm font-semibold text-slate-800">{profile.employeeId}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-semibold text-slate-600">Designation</Label>
              </div>
              <div className="text-sm font-semibold text-slate-800">{profile.designation}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-semibold text-slate-600">Department</Label>
              </div>
              <div className="text-sm font-semibold text-slate-800">{profile.department}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-semibold text-slate-600">Join Date</Label>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {new Date(profile.joinDate).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-semibold text-slate-600">Role</Label>
              </div>
              <div className="text-sm font-semibold text-slate-800 capitalize">{profile.role}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
