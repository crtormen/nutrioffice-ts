import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title?: string;
  onBack?: () => void;
  backTo?: string;
  showBackButton?: boolean;
}

export const PageHeader = ({
  breadcrumbs,
  title,
  onBack,
  backTo,
  showBackButton = true,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={index}>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
    </div>
  );
};
