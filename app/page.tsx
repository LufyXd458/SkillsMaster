import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Skills Master</h1>
      <p className="text-muted-foreground text-center max-w-md">
        轻松上手体验 Skills 是什么 - 探索 Claude Agent SDK 的技能管理系统
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/chat">Chat</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/skills">Manage Skills</Link>
        </Button>
      </div>
    </div>
  );
}
