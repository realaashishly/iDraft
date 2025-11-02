"use client";

import React, { useState, useRef, useEffect } from "react"; // Added useEffect
import Image from "next/image"; // Added Image
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File, X, Loader2 } from "lucide-react";

import { useUploadThing } from "@/lib/uploadthing";
// --- MODIFIED: Added App type and updateAppAction ---
import { createAppAction, updateAppAction, App } from "@/action/appActions";

// --- Validation schema (unchanged) ---
const appFormSchema = z.object({
	appName: z.string().min(2, "App name must be at least 2 characters."),
	appDescription: z.string().optional(),
	appLink: z.string().url("Please enter a valid URL (e.g., https://...)"),
});

type AppFormValues = z.infer<typeof appFormSchema>;

// --- Props ---
interface AddAppModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onAppCreated: () => void;
	appToEdit?: App; // --- NEW PROP ---
}

export function AddAppModal({
	isOpen,
	onOpenChange,
	onAppCreated,
	appToEdit, // --- NEW PROP ---
}: AddAppModalProps) {
	// --- NEW STATE ---
	const isEditMode = !!appToEdit;

	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const logoInputRef = useRef<HTMLInputElement>(null);

	const { startUpload } = useUploadThing("imageUploader", {
		onUploadProgress: (progress) => setUploadProgress(progress),
		onClientUploadComplete: () => {
			setIsUploading(false);
			setUploadProgress(100);
		},
		onUploadError: (err) => {
			console.error("Upload error", err);
			setError(`Logo upload failed: ${err.message}`);
			setIsProcessing(false);
			setIsUploading(false);
		},
	});

	const form = useForm<AppFormValues>({
		resolver: zodResolver(appFormSchema),
		defaultValues: {
			appName: "",
			appDescription: "",
			appLink: "",
		},
	});

	// --- NEW EFFECT ---
	// Pre-populates the form when editing or resets it when creating
	useEffect(() => {
		if (isOpen) {
			if (isEditMode && appToEdit) {
				// Populate form with existing data
				form.reset({
					appName: appToEdit.appName,
					appDescription: appToEdit.appDescription || "",
					appLink: appToEdit.appLink,
				});
			} else {
				// Reset form for "Add New" mode
				form.reset({
					appName: "",
					appDescription: "",
					appLink: "",
				});
			}
			// Reset file and error state on modal open
			setLogoFile(null);
			setError(null);
		}
	}, [isOpen, isEditMode, appToEdit, form]);

	const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setLogoFile(event.target.files?.[0] || null);
		setError(null);
	};

	// --- MODIFIED: Handles both create and update ---
	const onSubmit = async (data: AppFormValues) => {
		setIsProcessing(true);
		setError(null);

		try {
			if (isEditMode) {
				// --- UPDATE LOGIC ---
				if (!appToEdit) return; // Should not happen

				let logoUrl = appToEdit.logoUrl; // Default to existing logo

				// If a new file was provided, upload it
				if (logoFile) {
					setIsUploading(true);
					const uploadResult = await startUpload([logoFile]);
					if (!uploadResult || uploadResult.length === 0) {
						throw new Error("New logo upload failed.");
					}
					logoUrl = uploadResult[0].url; // Get new logo URL
					setIsUploading(false);
				}

				// Call the update action
				const actionResult = await updateAppAction(appToEdit.id, {
					...data,
					logoUrl,
				});

				if (!actionResult.success) throw new Error(actionResult.error);
			} else {
				// --- CREATE LOGIC (Original) ---
				if (!logoFile) {
					setError("Please upload an app logo.");
					setIsProcessing(false); // Stop processing
					return;
				}

				setIsUploading(true);
				const uploadResult = await startUpload([logoFile]);
				if (!uploadResult || uploadResult.length === 0)
					throw new Error("Logo upload failed. Please try again.");

				const { url: logoUrl } = uploadResult[0];
				const actionResult = await createAppAction({ ...data, logoUrl });

				if (!actionResult.success) throw new Error(actionResult.error);
			}

			// --- Success ---
			onAppCreated(); // Refresh data in parent
			onOpenChange(false); // Close modal
		} catch (err: any) {
			console.error("Failed to save app:", err);
			setError(err.message || "An unexpected error occurred.");
		} finally {
			setIsProcessing(false);
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const getButtonText = () => {
		if (isUploading) return `Uploading... ${uploadProgress}%`;
		if (isProcessing)
			return (
				<>
					<Loader2 className='mr-2 h-4 w-4 animate-spin' />
					Saving...
				</>
			);
		// --- MODIFIED ---
		return isEditMode ? "Save Changes" : "Save App";
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (isProcessing) return;
				onOpenChange(open);
			}}
		>
			<DialogContent className='sm:max-w-[425px] w-[95vw] max-h-[90vh] p-6 flex flex-col overflow-visible justify-start items-stretch gap-4'>
				<DialogHeader>
					{/* --- MODIFIED --- */}
					<DialogTitle>
						{isEditMode ? "Edit App" : "Add New App"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? `Make changes to "${
									appToEdit?.appName || "this app"
							  }". Click save when you're done.`
							: "Fill in the details for the new app. Click save when you're done."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4 flex flex-col justify-start items-stretch'
					>
						{/* App Logo */}
						<FormItem>
							<FormLabel>App Logo</FormLabel>
							<FormControl>
								<div
									className={`
                    relative flex flex-col items-center justify-center
                    rounded-lg border-2 border-dashed border-muted-foreground/50
                    p-6 text-center transition-colors hover:border-primary
                    ${
						isProcessing
							? "cursor-not-allowed opacity-50"
							: "cursor-pointer"
					}
                    `}
									onClick={() =>
										!isProcessing &&
										logoInputRef.current?.click()
									}
								>
									<UploadCloud className='mb-2 h-8 w-8 text-muted-foreground' />
									<p className='text-sm font-medium text-muted-foreground'>
										{/* --- MODIFIED --- */}
										{isEditMode
											? "Click to upload a new logo"
											: "Click to upload logo (1 file only)"}
									</p>
									<input
										ref={logoInputRef}
										type='file'
										accept='image/*'
										className='hidden'
										onChange={handleLogoChange}
										disabled={isProcessing}
									/>
								</div>
							</FormControl>

							{/* --- MODIFIED: Show new file or existing logo --- */}

							{/* Case A: A new file has been selected */}
							{logoFile && !isUploading && (
								<div className='mt-2 flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm w-full overflow-hidden'>
									<div className='flex items-center gap-2 min-w-0 flex-1'>
										<File className='h-4 w-4 shrink-0' />
										<span className='truncate block w-full'>
											{logoFile.name}
										</span>
									</div>
									<Button
										type='button'
										variant='ghost'
										size='icon'
										className='h-6 w-6 shrink-0 ml-2'
										onClick={() =>
											!isProcessing && setLogoFile(null)
										}
										disabled={isProcessing}
									>
										<X className='h-4 w-4' />
									</Button>
								</div>
							)}

							{/* Case B: Edit mode, no new file, show existing logo */}
							{isEditMode && !logoFile && !isUploading && (
								<div className='mt-2 flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm'>
									<Image
										src={appToEdit.logoUrl}
										alt={appToEdit.appName}
										width={24}
										height={24}
										className='rounded-sm border object-cover'
									/>
									<span className='truncate text-muted-foreground'>
										Currently using this logo
									</span>
								</div>
							)}

							{isUploading && (
								<Progress
									value={uploadProgress}
									className='mt-2'
								/>
							)}
							<FormMessage />
						</FormItem>

						{/* App Name */}
						<FormField
							control={form.control}
							name='appName'
							render={({ field }) => (
								<FormItem>
									<FormLabel>App Name</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g., Project Manager'
											{...field}
											disabled={isProcessing}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* App Description */}
						<FormField
							control={form.control}
							name='appDescription'
							render={({ field }) => (
								<FormItem>
									<FormLabel>App Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder='What does this app do?'
											{...field}
											className='resize-none h-20'
											disabled={isProcessing}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* App Link */}
						<FormField
							control={form.control}
							name='appLink'
							render={({ field }) => (
								<FormItem>
									<FormLabel>App Visit Link</FormLabel>
									<FormControl>
										<Input
											placeholder='https://...'
											{...field}
											disabled={isProcessing}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Error */}
						{error && (
							<p className='text-center text-sm font-medium text-red-500'>
								{error}
							</p>
						)}

						{/* Footer */}
						<DialogFooter className='flex justify-end pt-2'>
							<DialogClose asChild>
								<Button
									type='button'
									variant='outline'
									disabled={isProcessing}
								>
									Cancel
								</Button>
							</DialogClose>
							<Button type='submit' disabled={isProcessing}>
								{getButtonText()}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}