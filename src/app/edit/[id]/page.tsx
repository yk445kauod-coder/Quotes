import { EditForm } from "./edit-form";

// This tells Next.js to generate dynamic routes on demand
// instead of returning a 404 if the page wasn't pre-built.
export const dynamicParams = true;

// This function is required for static export with dynamic routes.
// It tells Next.js not to pre-render any specific pages at build time.
// The client will handle rendering based on the dynamic ID.
export async function generateStaticParams() {
  return [];
}

export default function EditPage() {
  return <EditForm />;
}
