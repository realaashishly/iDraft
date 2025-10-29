"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { PlusCircle } from "lucide-react";
import { AddAppModal } from "@/components/AddAppModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { App, getAppsAction } from "@/action/appActions";

export default function Page() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This function will be passed to the modal
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

  return (
    <div className="p-4">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold">Your Apps</h1>
        {!isSessionLoading && isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add App
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-center text-muted-foreground">Loading apps...</p>
      )}
      {error && <p className="text-center font-medium text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {apps.length > 0 ? (
            apps.map((app) => (
              <Link
                key={app.id}
                href={app.appLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Image
                      src={app.logoUrl}
                      alt={`${app.appName} logo`}
                      width={48}
                      height={48}
                      className="rounded-lg border"
                    />
                    <div>
                      <CardTitle>{app.appName}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {app.appDescription}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No apps have been added yet.
            </p>
          )}
        </div>
      )}

      {/* --- THIS IS THE CHANGE --- */}
      <AddAppModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAppCreated={fetchApps}
      />
      {/* --- END CHANGE --- */}
    </div>
  );
}