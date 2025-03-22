import React from "react";

interface PageTitleProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  description,
  children,
  icon,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-2xl md:text-3xl font-bold">{title || children}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export default PageTitle;
