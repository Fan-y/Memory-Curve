import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useI18n } from "@/hooks/useI18n";

export default function NotFoundPage() {
  const { t } = useI18n();

  useDocumentTitle("404 - Memory Curve");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">{t("notFoundMessage")}</p>
      <Link to="/">
        <Button>{t("notFoundBackHome")}</Button>
      </Link>
    </div>
  );
}
