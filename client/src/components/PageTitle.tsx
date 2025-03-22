import React from "react";

interface PageTitleProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold">{title || children}</h1>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export default PageTitle;
