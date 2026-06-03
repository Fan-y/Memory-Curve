import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("404 - Memory Curve");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">页面不存在或已被移动。</p>
      <Link to="/">
        <Button>返回首页</Button>
      </Link>
    </div>
  );
}
