"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingAlternative from "@/components/LoadingAlternative";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoadingDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("spinner");
  const [selectedSize, setSelectedSize] = useState("md");

  const handleToggleLoading = () => {
    setIsLoading((prev) => !prev);
    if (!isLoading) {
      // Automatically turn off loading after 3 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Loading Components Demo</h1>

      <Tabs defaultValue="variants" className="w-full mb-10">
        <TabsList className="mb-6">
          <TabsTrigger value="variants">Component Variants</TabsTrigger>
          <TabsTrigger value="fullscreen">Fullscreen Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="variants">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spinner (Default)</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                <LoadingAlternative variant="spinner" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pulse (Skeleton)</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                <LoadingAlternative variant="pulse" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                <LoadingAlternative variant="skeleton" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Border</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                <LoadingAlternative variant="border" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Minimal</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-10">
                <LoadingAlternative variant="minimal" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Size Variants</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-6">
                <div className="flex items-center gap-4">
                  <LoadingAlternative
                    variant="spinner"
                    size="sm"
                    text="Small"
                  />
                  <LoadingAlternative
                    variant="spinner"
                    size="md"
                    text="Medium"
                  />
                  <LoadingAlternative
                    variant="spinner"
                    size="lg"
                    text="Large"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <LoadingAlternative variant="minimal" size="sm" />
                  <LoadingAlternative variant="minimal" size="md" />
                  <LoadingAlternative variant="minimal" size="lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fullscreen">
          <Card>
            <CardHeader>
              <CardTitle>Fullscreen Loading Demo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 py-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="mb-2 font-medium">Variant</h3>
                  <select
                    className="px-4 py-2 bg-background border rounded-md w-full"
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                  >
                    <option value="spinner">Spinner</option>
                    <option value="pulse">Pulse</option>
                    <option value="skeleton">Skeleton</option>
                    <option value="border">Border</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Size</h3>
                  <select
                    className="px-4 py-2 bg-background border rounded-md w-full"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleToggleLoading}>
                {isLoading ? "Cancel Loading" : "Show Fullscreen Loading"}
              </Button>

              <p className="text-sm text-muted-foreground mt-2">
                Loading will automatically turn off after 3 seconds
              </p>
            </CardContent>
          </Card>

          {isLoading && (
            <LoadingAlternative
              variant={selectedVariant as any}
              size={selectedSize as any}
              fullScreen={true}
            />
          )}
        </TabsContent>
      </Tabs>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-medium mb-2">Basic Usage</h3>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-6">
            {`import LoadingAlternative from "@/components/LoadingAlternative";
            
// Default spinner
<LoadingAlternative />

// Different variants
<LoadingAlternative variant="pulse" />
<LoadingAlternative variant="skeleton" />
<LoadingAlternative variant="border" />
<LoadingAlternative variant="minimal" />

// Different sizes
<LoadingAlternative size="sm" />
<LoadingAlternative size="md" />
<LoadingAlternative size="lg" />

// Custom text
<LoadingAlternative text="Processing..." />

// Fullscreen overlay
<LoadingAlternative fullScreen={true} />`}
          </pre>

          <h3 className="font-medium mb-2">In Components</h3>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            {`const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch data
    fetchData().then(() => setIsLoading(false));
  }, []);
  
  if (isLoading) {
    return <LoadingAlternative variant="minimal" fullScreen={true} />;
  }
  
  return <div>Your content here</div>;
};`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingDemo;
