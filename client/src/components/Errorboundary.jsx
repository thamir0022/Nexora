import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    // Optionally send to external logger like Sentry
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-muted px-4">
          <Alert
            variant="destructive"
            className="max-w-md w-full flex flex-col gap-3 p-6"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-xl">Something went wrong</AlertTitle>
            </div>

            <AlertDescription className="text-sm text-muted-foreground">
              {this.state.errorMessage || "An unexpected error occurred."}
            </AlertDescription>

            <div className="flex justify-end">
              <Button variant="outline" onClick={this.handleReset}>
                Try Again
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
