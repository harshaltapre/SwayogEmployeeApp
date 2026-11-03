import { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-8 sm:flex sm:items-center sm:justify-between">
      <div className="sm:flex-auto space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-1 text-sm text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <li key={item.label} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                  {item.href ? (
                    item.onClick ? (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link href={item.href} className="hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <span className="text-foreground font-medium">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {action}
        </div>
      )}
    </div>
  );
}
