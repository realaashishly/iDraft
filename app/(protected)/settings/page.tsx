"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession, signOut } from "@/lib/auth-client";
import {
    updateUserGeminiApiKeyAction,
    updateUserProfileAction,
} from "@/action/userActions";
import { UploadButton } from "@/lib/uploadthing";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// --- Shadcn/UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Lucide Icons ---
import { Loader2, Sun, Moon, Laptop } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Page Level Types & Schemas ---

const profileFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email.").describe("Email"),
    profession: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const apiKeyFormSchema = z.object({
    geminiApiKey: z
        .string()
        .optional()
        .describe("Your personal Google Gemini API Key."),
});
type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

// Helper function
const getInitials = (name: string) => {
    const parts = name.split(" ");
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase() || "U";
};

// --- Main Settings Page Component ---
export default function SettingsPage() {
    const { data: session, isPending: status } = useSession();

    const router = useRouter();

    useEffect(() => {
        if (!session?.user) {
            router.push("/login");
        }
    }, [session, router]);

    // Handle global loading state for the session
    if (status) {
        return (
            <div className='flex min-h-[88vh] items-center justify-center'>
                <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
            </div>
        );
    }

    // Main settings layout
    return (
        <div className='p-4 md:p-8 max-w-3xl mx-auto'>
            <header className='mb-8'>
                <h1 className='text-3xl font-bold text-foreground'>Settings</h1>
                <p className='text-muted-foreground'>
                    Manage your account settings and preferences.
                </p>
            </header>

            {/* All settings sections are rendered vertically in a single column */}
            <div className='space-y-8'>
                <ProfileSettings />
                <ApiKeysSettings />
                <AppearanceSettings />
                <NotificationsSettings />
                <AccountSettings />
            </div>
        </div>
    );
}

// =========================================================================
// --- SECTION 1: PROFILE SETTINGS COMPONENT ---
// =========================================================================
export function ProfileSettings() {
    const { data: session } = useSession();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: "", email: "", profession: "" },
    });

    // Sync session data to the form
    useEffect(() => {
        if (session?.user) {
            form.reset({
                name: session.user.name || "",
                email: session.user.email || "",
                // Assuming session.user.profession exists (see guide below)
                profession: (session.user as any).profession || "",
            });
            setAvatarPreview(session.user.image || null);
        }
    }, [session, form]);

    // Handle profile form submission
    async function onSubmit(data: ProfileFormValues) {
        setIsSaving(true);
        setMessage({ type: "", text: "" });
        try {
            // This already correctly includes profession
            const result = await updateUserProfileAction({
                name: data.name,
                profession: data.profession,
            });

            if (!result.success) throw new Error(result.message);

            setMessage({
                type: "success",
                text: "Profile updated successfully!",
            });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    // Handle avatar upload completion
    const handleAvatarUpload = async (res: any[]) => {
        const newImageUrl = res[0].url;
        setAvatarPreview(newImageUrl);
        setIsUploading(false);
        try {
            const result = await updateUserProfileAction({
                image: newImageUrl,
            });
            if (!result.success) throw new Error(result.message);

            setMessage({
                type: "success",
                text: "Avatar updated successfully!",
            });
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        }
    };

    return (
        <Card className='bg-card/50 border-white/10 shadow-lg'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            This information will be displayed on your profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {/* Avatar Section */}
                        <FormItem className='flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0'>
                            <FormLabel className='w-full sm:w-32'>
                                Avatar
                            </FormLabel>
                            <div className='flex items-center gap-4'>
                                <Avatar className='h-16 w-16'>
                                    <AvatarImage
                                        src={avatarPreview || undefined}
                                    />
                                    <AvatarFallback>
                                        {getInitials(form.watch("name"))}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='flex flex-col gap-2'>
                                    <UploadButton
                                        endpoint='imageUploader'
                                        onUploadBegin={() => {
                                            setIsUploading(true);
                                            setMessage({ type: "", text: "" });
                                        }}
                                        onClientUploadComplete={
                                            handleAvatarUpload
                                        }
                                        onUploadError={(error: Error) => {
                                            setIsUploading(false);
                                            setMessage({
                                                type: "error",
                                                text: error.message,
                                            });
                                        }}
                                        className='ut-button:bg-primary ut-button:h-9 ut-button:ut-readying:after:bg-primary/50'
                                    />
                                    <p className='text-xs text-muted-foreground mt-2'>
                                        JPG, PNG, GIF. 16MB max.
                                    </p>
                                </div>
                            </div>
                        </FormItem>

                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem className='flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0'>
                                    <FormLabel className='w-full sm:w-32'>
                                        Name
                                    </FormLabel>
                                    <div className='flex-1'>
                                        <FormControl>
                                            <Input
                                                placeholder='Your Name'
                                                {...field}
                                                disabled={
                                                    isSaving || isUploading
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage className='mt-2' />
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Profession Field */}
                        <FormField
                            control={form.control}
                            name='profession'
                            render={({ field }) => (
                                <FormItem className='flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0'>
                                    <FormLabel className='w-full sm:w-32'>
                                        Profession
                                    </FormLabel>
                                    <div className='flex-1'>
                                        <FormControl>
                                            <Input
                                                placeholder='e.g., Software Engineer'
                                                {...field}
                                                value={field.value || ""} // Ensure value is not null
                                                disabled={
                                                    isSaving || isUploading
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage className='mt-2' />
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Email Field */}
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem className='flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0'>
                                    <FormLabel className='w-full sm:w-32'>
                                        Email
                                    </FormLabel>
                                    <div className='flex-1'>
                                        <FormControl>
                                            <Input
                                                placeholder='your@email.com'
                                                {...field}
                                                disabled
                                            />
                                        </FormControl>
                                        <p className='text-xs text-muted-foreground mt-2'>
                                            Email address cannot be changed.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className='flex justify-between items-center border-t border-border pt-6 mt-6'>
                        {message.text && (
                            <p
                                className={`text-sm ${
                                    message.type === "success"
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                            >
                                {message.text}
                            </p>
                        )}
                        <Button
                            type='submit'
                            disabled={isSaving || isUploading}
                            className='ml-auto'
                        >
                            {isSaving && (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            )}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

// =========================================================================
// --- SECTION 2: API KEYS SETTINGS COMPONENT ---
// =========================================================================
function ApiKeysSettings() {
    const { data: session } = useSession();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const form = useForm<ApiKeyFormValues>({
        resolver: zodResolver(apiKeyFormSchema),
        defaultValues: { geminiApiKey: "" },
    });

    // Sync session data to the form
    useEffect(() => {
        if (session?.user?.geminiApiKey) {
            form.reset({
                geminiApiKey: session.user.geminiApiKey,
            });
        }
    }, [session, form]);

    // Handle form submission
    async function onSubmit(data: ApiKeyFormValues) {
        setIsSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const keyToSave = data.geminiApiKey || "";
            // Call your server action
            const result = await updateUserGeminiApiKeyAction(keyToSave);
            if (!result.success) throw new Error(result.message);

            setMessage({ type: "success", text: result.message });
            if (!keyToSave) {
                form.reset({ geminiApiKey: "" }); // Clear form if key was removed
            }
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    const handleRemoveKey = () => {
        onSubmit({ geminiApiKey: "" });
    };

    const hasApiKey = !!form.watch("geminiApiKey");

    return (
        <Card className='bg-card/50 border-white/10 shadow-lg'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>API Keys</CardTitle>
                        <CardDescription>
                            Provide your own API keys to bypass system-wide
                            message limits. Your keys are stored securely and
                            never shared.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <FormField
                            control={form.control}
                            name='geminiApiKey'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gemini API Key</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='password'
                                            placeholder='Enter your Google Gemini API Key'
                                            {...field}
                                            disabled={isSaving}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>OpenAI API Key</FormLabel>
                            <Input
                                type='password'
                                placeholder='Coming soon'
                                disabled
                            />
                        </FormItem>
                        <FormItem>
                            <FormLabel>Claude API Key</FormLabel>
                            <Input
                                type='password'
                                placeholder='Coming soon'
                                disabled
                            />
                        </FormItem>
                    </CardContent>
                    <CardFooter className='flex justify-between items-center border-t border-border pt-6 mt-6'>
                        {message.text && (
                            <p
                                className={`text-sm ${
                                    message.type === "success"
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                            >
                                {message.text}
                            </p>
                        )}
                        <div className='flex gap-2 ml-auto'>
                            {hasApiKey && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type='button'
                                            variant='destructive'
                                            disabled={isSaving}
                                        >
                                            Remove Key
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Remove API Key?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove your Gemini API
                                                key. You will revert to using
                                                the system's message limits.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleRemoveKey}
                                                className={
                                                    "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                }
                                            >
                                                Remove
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <Button type='submit' disabled={isSaving}>
                                {isSaving && (
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                )}
                                Save
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

// =========================================================================
// --- SECTION 3: APPEARANCE SETTINGS COMPONENT ---
// =========================================================================
function AppearanceSettings() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []); // Effect to ensure component is mounted

    if (!mounted) {
        // Render a skeleton while waiting for mount to avoid hydration mismatch
        return (
            <Card className='bg-card/50 border-white/10 shadow-lg'>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Loading theme settings...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='h-40 w-full animate-pulse rounded-md bg-muted/50' />
                </CardContent>
            </Card>
        );
    }

    const currentTheme = theme || "system";

    return (
        <Card className='bg-card/50 border-white/10 shadow-lg'>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                    Customize the look and feel of your dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Label>Theme</Label>
                <div className='grid grid-cols-3 gap-4 mt-2'>
                    <ThemeOption
                        title='Light'
                        icon={Sun}
                        onClick={() => setTheme("light")}
                        isSelected={currentTheme === "light"}
                    />
                    <ThemeOption
                        title='Dark'
                        icon={Moon}
                        onClick={() => setTheme("dark")}
                        isSelected={currentTheme === "dark"}
                    />
                    <ThemeOption
                        title='System'
                        icon={Laptop}
                        onClick={() => setTheme("system")}
                        isSelected={currentTheme === "system"}
                    />
                </div>

                <div className='mt-6'>
                    <Label>Preview</Label>
                    <div
                        className={cn(
                            "mt-2 h-40 w-full rounded-md border p-4 transition-colors",
                            resolvedTheme === "dark"
                                ? "bg-zinc-950 border-zinc-800" // Dark mode preview
                                : "bg-white border-zinc-200" // Light mode preview
                        )}
                    >
                        <div
                            className={cn(
                                "h-full w-full rounded-md p-4",
                                resolvedTheme === "dark"
                                    ? "bg-zinc-900"
                                    : "bg-zinc-100"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-4 w-3/4 rounded-sm",
                                    resolvedTheme === "dark"
                                        ? "bg-zinc-700"
                                        : "bg-zinc-300"
                                )}
                            />
                            <div
                                className={cn(
                                    "h-4 w-1/2 rounded-sm mt-3",
                                    resolvedTheme === "dark"
                                        ? "bg-zinc-700"
                                        : "bg-zinc-300"
                                )}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Helper component for ThemeOption (defined in the same file)
function ThemeOption({
    title,
    icon: Icon,
    onClick,
    isSelected,
}: {
    title: string;
    icon: React.ElementType;
    onClick: () => void;
    isSelected: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-md border p-4 transition-colors",
                isSelected
                    ? "border-primary ring-2 ring-primary" // Highlight if selected
                    : "border-border hover:bg-muted/50"
            )}
        >
            <Icon className='h-6 w-6' />
            <span className='text-sm font-medium'>{title}</span>
        </button>
    );
}

// =========================================================================
// --- SECTION 4: NOTIFICATIONS SETTINGS (Placeholder) ---
// =========================================================================
function NotificationsSettings() {
    return (
        <Card className='bg-card/50 border-white/10 shadow-lg'>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                    Manage how you receive notifications. (Coming Soon)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className='text-muted-foreground'>
                    Email, push, and in-app notification settings will be
                    available here.
                </p>
            </CardContent>
        </Card>
    );
}

// =========================================================================
// --- SECTION 5: ACCOUNT SETTINGS (Danger Zone) ---
// =========================================================================
function AccountSettings() {
    const [isDeleting, setIsDeleting] = useState(false);

    // Placeholder for delete action
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        // In a real app, you would call a server action here:
        // const result = await deleteAccountAction();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        alert("Delete account functionality is not yet implemented.");
        setIsDeleting(false);
    };

    return (
        <Card className='bg-card/50 border-destructive/30 shadow-lg'>
            <CardHeader>
                <CardTitle className='text-destructive'>Account</CardTitle>
                <CardDescription>
                    Manage your account settings and permanent actions.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                {/* Sign Out Section */}
                <div className='flex items-center justify-between rounded-lg border border-border p-4'>
                    <div>
                        <h4 className='font-semibold'>Sign Out</h4>
                        <p className='text-sm text-muted-foreground'>
                            Sign out of your account on this device.
                        </p>
                    </div>
                    <Button variant='outline' onClick={() => signOut()}>
                        Sign Out
                    </Button>
                </div>

                {/* Delete Account Section */}
                <div className='flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
                    <div>
                        <h4 className='font-semibold text-destructive'>
                            Delete Account
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                            Permanently delete your account and all associated
                            data.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant='destructive'>Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action is permanent and cannot be
                                    undone. All your data, including agents,
                                    assets, and chat history, will be
                                    permanently deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className={
                                        "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    }
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                >
                                    {isDeleting
                                        ? "Deleting..."
                                        : "Delete Account"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
