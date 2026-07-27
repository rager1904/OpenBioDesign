import { WorkspaceShell } from "@/components/workspace-shell";
import { getPageBySlug } from "@/lib/navigation";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function WorkspacePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPageBySlug(slug?.join("/") ?? "dashboard");
  return <WorkspaceShell page={page} />;
}
