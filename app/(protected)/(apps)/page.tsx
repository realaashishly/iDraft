"use client";

import { ArrowUpRight, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteAppAction, getAppsAction } from "@/action/appActions";
import { AddAppModal } from "@/components/AddAppModal";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import type { App } from "@/type/types";

export default function Page() {
  const { data: session, isPending: isSessionLoading } = useSession();
  // @ts-expect-error
  const isAdmin = session?.user?.role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [appToEdit, setAppToEdit] = useState<App | undefined>(undefined);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAppsAction();
      if (result.success) {
        setApps(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to fetch apps. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // --- MODIFICATION: Removed window.confirm ---
  const handleDelete = async (appId: string) => {
    // The confirmation is now handled by the AlertDialog
    try {
      const result = await deleteAppAction(appId);
      if (result.success) {
        await fetchApps();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete app.";

      setError(errorMessage);
    }
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
      setAppToEdit(undefined);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="font-bold text-3xl">Latest Apps</h1>
        {!isSessionLoading && isAdmin && (
          <Button
            onClick={() => {
              setAppToEdit(undefined);
              setIsModalOpen(true);
            }}
          >
            Add App
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-center text-muted-foreground">Loading apps...</p>
      )}
      {error && <p className="text-center font-medium text-red-500">{error}</p>}

      {!(isLoading || error) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {apps.length > 0 ? (
            apps.map((app) => (
              <div className="group relative pt-5" key={app.id}>
                {isAdmin && (
                  <div className="absolute top-0 right-2 z-10 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Button
                      className="cursor-pointer bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setAppToEdit(app);
                        setIsModalOpen(true);
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit {app.appName}</span>
                    </Button>

                    {/* --- MODIFICATION: Replaced Button with AlertDialog --- */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="cursor-pointer shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          size="icon"
                          variant="destructive" // Prevent link click, open dialog
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {app.appName}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the app &quot;
                            {app.appName}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({
                              variant: "destructive",
                            })}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(app.id);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <Card className="flex h-full flex-col justify-between p-4 transition-shadow hover:shadow-md">
                  <Link
                    className="block h-full"
                    href={app.appLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <Image
                          alt={`${app.appName} logo`}
                          className="h-16 w-16 shrink-0 rounded-md border object-cover"
                          height={56}
                          src={app.logoUrl}
                          width={56}
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <CardTitle className="truncate font-semibold text-base">
                            {app.appName}
                          </CardTitle>
                          <CardDescription className="truncate text-muted-foreground text-sm">
                            {app.appDescription || "No description available."}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                </Card>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No apps have been added yet.
            </p>
          )}
        </div>
      )}

      <AddAppModal
        appToEdit={appToEdit}
        isOpen={isModalOpen}
        onAppCreated={fetchApps}
        onOpenChange={handleModalOpenChange}
      />
    </div>
  );
}
