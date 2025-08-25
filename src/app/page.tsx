"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentList } from "@/components/document-list";

export default function DashboardPage() {
  return (
    <div className="container mx-auto flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">
          لوحة التحكم
        </h1>
        <div className="flex items-center space-x-2">
          <Link href="/create">
            <Button>
              <PlusCircle className="ms-2 h-4 w-4" />
              إنشاء مستند جديد
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستندات</CardTitle>
          <CardDescription>
            قائمة بأحدث عروض الأسعار والمقايسات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentList />
        </CardContent>
      </Card>
    </div>
  );
}
