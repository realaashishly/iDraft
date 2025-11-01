"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { ArrowUpRight, Edit, Trash2 } from "lucide-react";
import { AddAppModal } from "@/components/AddAppModal";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// --- MODIFICATION: Import Alert Dialog components ---
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
import { App, getAppsAction, deleteAppAction } from "@/action/appActions";

export default function Page() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [appToEdit, setAppToEdit] = useState<App | undefined>(undefined);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAppsAction();
      if (result.success) {
        setApps(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch apps. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // --- MODIFICATION: Removed window.confirm ---
  const handleDelete = async (appId: string, appName: string) => {
    // The confirmation is now handled by the AlertDialog
    try {
      const result = await deleteAppAction(appId);
      if (result.success) {
        await fetchApps();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Failed to delete app:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete app.";
      window.alert(`Error: ${errorMessage}`); // You could replace this with a Toast
    }
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    if (!isOpen) {
      setAppToEdit(undefined);
    }
  };

  return (
    <div className='p-4'>
      <div className='mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <h1 className='text-3xl font-bold'>Latest Apps</h1>
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
        <p className='text-center text-muted-foreground'>
          Loading apps...
        </p>
      )}
      {error && (
        <p className='text-center font-medium text-red-500'>{error}</p>
      )}

      {!isLoading && !error && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {apps.length > 0 ? (
            apps.slice(0, 4).map((app) => (
              <div key={app.id} className='relative group pt-5'>
                {isAdmin && (
                  <div
                    className="
                      absolute 
                      top-0 
                      right-2 
                      flex 
                      gap-2 
                      opacity-0 
                      group-hover:opacity-100 
                      transition-opacity 
                      duration-200 
                      z-10
                    "
                  >
                    <Button
                      variant='outline'
                      size='icon'
                      className='bg-background shadow-md cursor-pointer'
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setAppToEdit(app);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className='h-4 w-4' />
                      <span className='sr-only'>
                        Edit {app.appName}
                      </span>
                    </Button>

                    {/* --- MODIFICATION: Replaced Button with AlertDialog --- */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='destructive'
                          size='icon'
                          className='shadow-md cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                           
                          }} // Prevent link click, open dialog
                        >
                          <Trash2 className='h-4 w-4' />
                          <span className='sr-only'>
                            Delete {app.appName}
                          </span>
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
                            This action cannot be undone. This will
                            permanently delete the app &quot;
                            {app.appName}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: "destructive" })}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(app.id, app.appName);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                <Card className='flex flex-col justify-between p-4 transition-shadow hover:shadow-md h-full'>
                  <Link
                    href={app.appLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block h-full'
                  >
                    <div className='flex flex-row items-center justify-between'>
                      <div className='flex items-center gap-4 min-w-0 flex-1'>
                        <Image
                          src={app.logoUrl}
                          alt={`${app.appName} logo`}
                          width={56}
                          height={56}
                          className='rounded-md border object-cover flex-shrink-0 w-16 h-16'
                        />
                        <div className='flex flex-col justify-center min-w-0 flex-1'>
                          <CardTitle className='text-base font-semibold truncate'>
                            {app.appName}
                          </CardTitle>
                          <CardDescription className='text-sm text-muted-foreground truncate'>
                            {app.appDescription ||
                              "No description available."}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowUpRight className='h-5 w-5 text-muted-foreground flex-shrink-0 ml-4' />
                    </div>
                  </Link>
                </Card>
              </div>
            ))
          ) : (
            <p className='col-span-full text-center text-muted-foreground'>
              No apps have been added yet.
            </p>
          )}
        </div>
      )}

      <AddAppModal
        isOpen={isModalOpen}
        onOpenChange={handleModalOpenChange}
        onAppCreated={fetchApps}
        appToEdit={appToEdit}
      />
    </div>
  );
}